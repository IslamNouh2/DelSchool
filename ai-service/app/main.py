from fastapi import FastAPI
from app.api.endpoints import evaluation, optimize

app = FastAPI(title="DelSchool AI Service (Performance & Timetable)")

app.include_router(evaluation.router, prefix="/api/v1")
app.include_router(evaluation.router, prefix="/api/v1/evaluation", tags=["Evaluation"])
app.include_router(optimize.router, prefix="/api/v1/timetable", tags=["Timetable"])

@app.get("/")
async def root():
    return {"message": "DelSchool AI Service is running"}
