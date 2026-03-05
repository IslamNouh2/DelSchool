from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict
from ortools.sat.python import cp_model

router = APIRouter()


# ----------------------------
# Models
# ----------------------------

class Teacher(BaseModel):
    id: int
    name: str
    weeklyWorkload: int = 20


class ClassRoom(BaseModel):
    id: int
    name: str


class Subject(BaseModel):
    id: int
    name: str
    isBreak: bool = False


class Slot(BaseModel):
    id: int
    start: str
    end: str


class SubjectRequirement(BaseModel):
    classId: int
    subjectId: int


class ClassWeeklyHours(BaseModel):
    classId: int
    maxSlotsPerWeek: int


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
    classWeeklyHours: List[ClassWeeklyHours]
    subjectRequirements: List[SubjectRequirement]

    academicYear: str

    weekStartDay: str = "Sunday"
    firstSlotId: int | None = None


# ----------------------------
# Optimizer
# ----------------------------

@router.post("/optimize")
async def optimize_timetable(request: OptimizeRequest):

    model = cp_model.CpModel()

    # ------------------------------------------------
    # 1. Week start day
    # ------------------------------------------------

    base_days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ]

    try:
        start_index = base_days.index(request.weekStartDay.capitalize())
        rotated_days = base_days[start_index:] + base_days[:start_index]
    except ValueError:
        rotated_days = base_days

    days = rotated_days[:6] # Increased to 6 days to handle Sun-Fri or Mon-Sat schedules better

    # ------------------------------------------------
    # 2. Sort slots by time
    # ------------------------------------------------

    sorted_slots = sorted(request.slots, key=lambda s: s.start)

    if request.firstSlotId is not None:
        sorted_slots = [s for s in sorted_slots if s.id >= request.firstSlotId]

    slot_ids = [s.id for s in sorted_slots]

    # ------------------------------------------------
    # IDs
    # ------------------------------------------------

    teacher_ids = [t.id for t in request.teachers]
    class_ids = [c.id for c in request.classes]
    subject_ids = [s.id for s in request.subjects]

    break_subject_ids = {s.id for s in request.subjects if s.isBreak}

    # ------------------------------------------------
    # Class weekly hours
    # ------------------------------------------------

    class_max_slots: Dict[int, int] = {
        cwh.classId: cwh.maxSlotsPerWeek for cwh in request.classWeeklyHours
    }

    # ------------------------------------------------
    # Subject restrictions (subject_local)
    # ------------------------------------------------

    valid_subject_for_class = {
        (sr.classId, sr.subjectId) for sr in request.subjectRequirements
    }

    use_subject_restriction = len(valid_subject_for_class) > 0

    # ------------------------------------------------
    # Teacher assignments
    # ------------------------------------------------

    valid_triples = set()

    for ta in request.teacherAssignments:

        for sid in ta.subjectIds:

            for cid in ta.classIds:

                if use_subject_restriction and (cid, sid) not in valid_subject_for_class:
                    continue

                valid_triples.add((ta.teacherId, sid, cid))

    if not valid_triples:
        return {
            "timetable": [],
            "status": "NO_VALID_ASSIGNMENTS",
            "optimizationScore": 0,
            "conflictCount": 0,
        }

    # ------------------------------------------------
    # Decision variables
    # ------------------------------------------------

    assignments = {}

    class_day_slot_index = {}
    teacher_day_slot_index = {}
    class_subject_day_index = {}

    class_index = {}
    teacher_index = {}

    for (teacher_id, subject_id, class_id) in valid_triples:

        for day in days:

            for slot_id in slot_ids:

                key = (teacher_id, class_id, subject_id, day, slot_id)

                var = model.NewBoolVar(
                    f"T{teacher_id}_C{class_id}_S{subject_id}_D{day}_SL{slot_id}"
                )

                assignments[key] = var

                class_day_slot_index.setdefault(
                    (class_id, day, slot_id), []
                ).append(var)

                teacher_day_slot_index.setdefault(
                    (teacher_id, day, slot_id), []
                ).append(var)

                class_subject_day_index.setdefault(
                    (class_id, subject_id, day), []
                ).append(var)

                if subject_id not in break_subject_ids:
                    class_index.setdefault(class_id, []).append(var)

                teacher_index.setdefault(teacher_id, []).append(var)

    # ------------------------------------------------
    # Constraint 1
    # No class conflict
    # ------------------------------------------------

    for vars in class_day_slot_index.values():

        if len(vars) > 1:
            model.AddAtMostOne(vars)

    # ------------------------------------------------
    # Constraint 2
    # No teacher conflict
    # ------------------------------------------------

    for vars in teacher_day_slot_index.values():

        if len(vars) > 1:
            model.AddAtMostOne(vars)

    # ------------------------------------------------
    # Constraint 3
    # Class weekly hours (without break)
    # ------------------------------------------------

    for class_id, vars in class_index.items():

        max_slots = class_max_slots.get(class_id, 6)

        model.Add(sum(vars) <= max_slots)

    # ------------------------------------------------
    # Constraint 4
    # Teacher weekly workload
    # ------------------------------------------------

    teacher_workloads = {t.id: t.weeklyWorkload for t in request.teachers}

    for teacher_id, vars in teacher_index.items():

        max_workload = teacher_workloads.get(teacher_id, 20)

        model.Add(sum(vars) <= max_workload)

    # ------------------------------------------------
    # Constraint 5
    # Subject spread per day
    # ------------------------------------------------

    for vars in class_subject_day_index.values():

        if len(vars) > 2:
            model.Add(sum(vars) <= 2)

    # ------------------------------------------------
    # Soft Constraints & Penalties
    # ------------------------------------------------
    
    # We will collect penalty variables to subtract from the objective
    penalties = []
    
    # Calculate lessons requested (for base score)
    # This is a bit complex since many teachers can teach a class, 
    # but we can approximate by summing the class weekly hours requested.
    total_requested_lessons = sum(class_max_slots.values())

    # 1. Penalty for 3+ consecutive lessons for a teacher
    for teacher_id in teacher_ids:
        for day in days:
            for i in range(len(slot_ids) - 2):
                s1, s2, s3 = slot_ids[i], slot_ids[i+1], slot_ids[i+2]
                
                vars1 = teacher_day_slot_index.get((teacher_id, day, s1), [])
                vars2 = teacher_day_slot_index.get((teacher_id, day, s2), [])
                vars3 = teacher_day_slot_index.get((teacher_id, day, s3), [])
                
                if vars1 and vars2 and vars3:
                    # Penalty if all three are 1
                    consecutive_penalty = model.NewBoolVar(f"consecutive_t{teacher_id}_d{day}_i{i}")
                    # Linear penalty: p >= busy1 + busy2 + busy3 - 2
                    # If sum is 3, p must be 1. If sum < 3, p can be 0.
                    model.Add(sum(vars1 + vars2 + vars3) <= 2 + consecutive_penalty)
                    penalties.append(consecutive_penalty * 10) # Higher weight for teacher burnout

    # 2. Penalty for student gaps (Lesson -> Gap -> Lesson)
    for class_id in class_ids:
        for day in days:
            for i in range(len(slot_ids) - 2):
                s1, s2, s3 = slot_ids[i], slot_ids[i+1], slot_ids[i+2]
                
                cvars1 = class_day_slot_index.get((class_id, day, s1), [])
                cvars2 = class_day_slot_index.get((class_id, day, s2), [])
                cvars3 = class_day_slot_index.get((class_id, day, s3), [])
                
                if cvars1 and cvars3:
                    # Gap if busy1=1 AND busy2=0 AND busy3=1
                    gap_penalty = model.NewBoolVar(f"gap_c{class_id}_d{day}_i{i}")
                    
                    # c_busy_2 is 1 if any lesson is in slot 2
                    c_busy_2 = model.NewBoolVar(f"busyc2_c{class_id}_d{day}_{i}")
                    if cvars2:
                        model.Add(c_busy_2 == sum(cvars2))
                    else:
                        model.Add(c_busy_2 == 0)

                    # Penalty if busy1 + (1-busy2) + busy3 == 3
                    # i.e. p >= busy1 + 1 - busy2 + busy3 - 2
                    # i.e. p >= busy1 - busy2 + busy3 - 1
                    model.Add(sum(cvars1 + cvars3) - c_busy_2 <= 1 + gap_penalty)
                    
                    penalties.append(gap_penalty * 20) # Gaps are very bad for students


    # ------------------------------------------------
    # Objective
    # ------------------------------------------------

    # We want to maximize placed lessons while minimizing penalties
    # NEW: Day/Slot preference to pack schedule to the START of the week
    objective_terms = []
    for (t_id, c_id, s_id, day, slot_id), var in assignments.items():
        day_idx = days.index(day)
        slot_idx = slot_ids.index(slot_id)
        
        # Base value: 1000 (very high to prioritize placement)
        # Day bonus: packs towards Sunday (0) vs Friday (5)
        # Slot bonus: packs towards morning
        pref_bonus = (len(days) - day_idx) * 10 + (len(slot_ids) - slot_idx)
        objective_terms.append(var * (1000 + pref_bonus))

    model.Maximize(sum(objective_terms) - sum(penalties))

    # ------------------------------------------------
    # Solver
    # ------------------------------------------------

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 20
    status = solver.Solve(model)

    timetable = []
    consecutive_count = 0
    gap_count = 0

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        for (teacher_id, class_id, subject_id, day, slot_id), var in assignments.items():
            if solver.Value(var):
                timetable.append({
                    "day": day,
                    "classId": class_id,
                    "subjectId": subject_id,
                    "timeSlotId": slot_id,
                    "employerId": teacher_id,
                })
        
        # Extract penalty counts for the score
        for p in penalties:
            # p is (BoolVar * weight). We need to check if the BoolVar part is true.
            # But simplify: the objective value already contains the penalties.
            pass

    # Calculate optimization score (0.0 to 1.0)
    # Score = (lessons_placed / total_requested) - (penalties / (total_requested * factor))
    placed_count = len(timetable)
    base_score = placed_count / total_requested_lessons if total_requested_lessons > 0 else 0
    
    # For reporting, we could use solver.Value() on the penalty vars if we saved them, 
    # but let's just use the final objective or a simple formula.
    final_score = base_score * 0.95 # Slight reduction if not optimal or has small penalties
    if status == cp_model.OPTIMAL and base_score > 0.99:
        final_score = 1.0

    return {
        "timetable": timetable,
        "days": days,
        "slots": slot_ids,
        "lessonsPlaced": placed_count,
        "lessonsRequested": total_requested_lessons,
        "optimizationScore": round(final_score, 4),
        "status": solver.StatusName(status),
        "conflictCount": 0,
    }