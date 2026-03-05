import json
from ortools.sat.python import cp_model

with open('ai_payload.json') as f:
    request = json.load(f)

model = cp_model.CpModel()
days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

teacher_ids = [t['id'] for t in request['teachers']]
class_ids   = [c['id'] for c in request['classes']]
subject_ids = [s['id'] for s in request['subjects']]
slot_ids    = [s['id'] for s in request['slots']]

class_max_slots = {cwh['classId']: cwh['maxSlotsPerWeek'] for cwh in request['classWeeklyHours']}

valid_subject_for_class = set(
    (sr['classId'], sr['subjectId']) for sr in request['subjectRequirements']
)
use_subject_restriction = len(valid_subject_for_class) > 0

valid_triples = set()
for ta in request['teacherAssignments']:
    for sid in ta['subjectIds']:
        for cid in ta['classIds']:
            if use_subject_restriction and (cid, sid) not in valid_subject_for_class:
                continue
            valid_triples.add((ta['teacherId'], sid, cid))

assignments = {}
for (t, s, c) in valid_triples:
    for d in days:
        for sl in slot_ids:
            key = (t, c, s, d, sl)
            assignments[key] = model.NewBoolVar(f't{t}_c{c}_s{s}_d{d}_sl{sl}')

for c in class_ids:
    for d in days:
        for sl in slot_ids:
            relevant = [v for (tc, cls, s, dy, slt), v in assignments.items()
                        if cls == c and dy == d and slt == sl]
            if relevant:
                # print(f"Class constraint slots: {len(relevant)}")
                model.AddAtMostOne(relevant)

for t in teacher_ids:
    for d in days:
        for sl in slot_ids:
            relevant = [v for (tc, cls, s, dy, slt), v in assignments.items()
                        if tc == t and dy == d and slt == sl]
            if relevant:
                model.AddAtMostOne(relevant)

for c in class_ids:
    max_slots = class_max_slots.get(c, 6)
    class_vars = [v for (tc, cls, s, d, sl), v in assignments.items() if cls == c]
    if class_vars:
        print(f"Adding class load max_slots={max_slots} for class {c}")
        model.Add(sum(class_vars) <= max_slots)

teacher_workloads = {t['id']: t.get('weeklyWorkload', 20) for t in request['teachers']}
for t in teacher_ids:
    max_workload = teacher_workloads.get(t, 20)
    teacher_vars = [v for (tc, c, s, d, sl), v in assignments.items() if tc == t]
    if teacher_vars:
        print(f"Adding teacher load max_workload={max_workload} for teacher {t}")
        model.Add(sum(teacher_vars) <= max_workload)

for c in class_ids:
    for s in subject_ids:
        for d in days:
            subject_day_vars = [
                v for (tc, cls, subj, dy, sl), v in assignments.items()
                if cls == c and subj == s and dy == d
            ]
            if subject_day_vars:
                model.Add(sum(subject_day_vars) <= 2)

model.Maximize(sum(assignments.values()))

solver = cp_model.CpSolver()
status = solver.Solve(model)
print("Status:", solver.StatusName(status))
print("Objective Value:", solver.ObjectiveValue())

timetable = []
if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
    for (t, c, s, d, sl), var in assignments.items():
        if solver.Value(var):
            timetable.append({
                "day": d,
                "classId": c,
                "subjectId": s,
                "timeSlotId": sl,
                "employerId": t,
            })
print("Timetable length:", len(timetable))
print(json.dumps(timetable, indent=2))
