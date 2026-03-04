import pytest
from app.services.ml_service import MLService
import os

def test_ml_service_prediction():
    service = MLService()
    # Features: [avg_grade, improvement, attendance, behavior, workload, completion]
    features = [85.0, 5.0, 0.95, 90.0, 30.0, 0.9]
    
    result = service.predict(features)
    
    assert "score" in result
    assert "improvementProbability" in result
    assert "weakAreas" in result
    assert "trainingPlan" in result
    assert 0 <= result["score"] <= 100
    assert 0 <= result["improvementProbability"] <= 1

def test_ml_service_weak_areas():
    service = MLService()
    # Low attendance feature
    features = [85.0, 5.0, 0.4, 90.0, 30.0, 0.9]
    
    result = service.predict(features)
    assert "Classroom Engagement/Attendance" in result["weakAreas"]
    assert any("Classroom management" in plan for plan in result["trainingPlan"])

def test_ml_service_model_persistence():
    model_path = "model.joblib"
    if os.path.exists(model_path):
        os.remove(model_path)
    
    service = MLService()
    assert os.path.exists(model_path)
    
    # Second initialization should load from disk
    service2 = MLService()
    assert service2.model is not None
