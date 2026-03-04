from fastapi import APIRouter
from app.schemas.evaluation import EvaluationFeatures, EvaluationResult
from app.services.ml_service import ml_service

router = APIRouter()

@router.post("/predict", response_model=EvaluationResult)
async def predict_performance(data: EvaluationFeatures):
    result = ml_service.predict(data.features)
    return result
