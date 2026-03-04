from pydantic import BaseModel
from typing import List

class EvaluationFeatures(BaseModel):
    features: List[float]

class EvaluationResult(BaseModel):
    score: float
    improvementProbability: float
    weakAreas: List[str]
    trainingPlan: List[str]
