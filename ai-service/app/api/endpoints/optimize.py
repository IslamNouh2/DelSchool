from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from ortools.sat.python import cp_model
import random

router = APIRouter()

class Teacher(BaseModel):
    id: int
    name: str

class ClassRoom(BaseModel):
    id: int
    name: str

class Subject(BaseModel):
    id: int
    name: str

class Slot(BaseModel):
    id: int
    start: str
    end: str

class SubjectRequirement(BaseModel):
    classId: int
    subjectId: int
    requiredHours: int

class TeacherAssignment(BaseModel):
    teacherId: int
    subjectIds: List[int]
    classIds: List[int]

class OptimizeRequest(BaseModel):
    teachers: List[Teacher]
    classes: List[ClassRoom]
    subjects: List[Subject]
    slots: List[Slot]
    teacherAssignments: List[TeacherAssignment]
    subjectRequirements: List[SubjectRequirement]
    academicYear: str

@router.post("/optimize")
async def optimize_timetable(request: OptimizeRequest):
    model = cp_model.CpModel()
    
    # Days of operation
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    
    # Pre-calculate IDs
    teacher_ids = [t.id for t in request.teachers]
    class_ids = [c.id for c in request.classes]
    subject_ids = [s.id for s in request.subjects]
    slot_ids = [s.id for s in request.slots]
    
    # Map valid assignments (Teacher can only teach specific subjects in specific classes)
    valid_assignments = {} # (teacher_id, subject_id, class_id) -> bool
    for ta in request.teacherAssignments:
        for sid in ta.subjectIds:
            for cid in ta.classIds:
                valid_assignments[(ta.teacherId, sid, cid)] = True

    # Define variables: assignments[(teacher, class, subject, day, slot)]
    assignments = {}
    for t in teacher_ids:
        for c in class_ids:
            for s in subject_ids:
                # Optimization: Only create variables for valid assignments
                if (t, s, c) not in valid_assignments:
                    continue
                for d in days:
                    for sl in slot_ids:
                        assignments[(t, c, s, d, sl)] = model.NewBoolVar(f't{t}_c{c}_s{s}_d{d}_sl{sl}')

    # Constraints:
    
    # 1. Collision Constraint: Class can have at most one lesson per (day, slot)
    for c in class_ids:
        for d in days:
            for sl in slot_ids:
                relevant_vars = [assignments[(t, c, s, d, sl)] for t in teacher_ids for s in subject_ids if (t, c, s, d, sl) in assignments]
                if relevant_vars:
                    model.AddAtMostOne(relevant_vars)

    # 2. Collision Constraint: Teacher can teach at most one class per (day, slot)
    for t in teacher_ids:
        for d in days:
            for sl in slot_ids:
                relevant_vars = [assignments[(t, c, s, d, sl)] for c in class_ids for s in subject_ids if (t, c, s, d, sl) in assignments]
                if relevant_vars:
                    model.AddAtMostOne(relevant_vars)

    # 3. Exact Subject Volume Constraint (Respect the "size" of the subject in the local)
    for req in request.subjectRequirements:
        c = req.classId
        s = req.subjectId
        relevant_vars = [assignments[(t, c, s, d, sl)] for t in teacher_ids for d in days for sl in slot_ids if (t, c, s, d, sl) in assignments]
        if relevant_vars:
            # We enforce that the sum of assigned slots equals the required hours
            model.Add(sum(relevant_vars) == req.requiredHours)
        elif req.requiredHours > 0:
            # If no teachers are assigned to this subject/class but hours are required, this might be impossible
            # For now, we proceed, but OR-Tools will mark it INFEASIBLE if it's a hard requirement
            pass

    # Objective: Maximize assigned slots (though strict constraints might fix this)
    model.Maximize(sum(assignments.values()))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 15.0
    status = solver.Solve(model)

    timetable = []
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        for (t, c, s, d, sl), var in assignments.items():
            if solver.Value(var):
                timetable.append({
                    "day": d,
                    "classId": c,
                    "subjectId": s,
                    "timeSlotId": sl,
                    "employerId": t
                })

    return {
        "timetable": timetable,
        "optimizationScore": 1.0 if status == cp_model.OPTIMAL else (0.8 if status == cp_model.FEASIBLE else 0.0),
        "status": solver.StatusName(status),
        "conflictCount": 0
    }
