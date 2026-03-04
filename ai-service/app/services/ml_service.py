import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

class MLService:
    def __init__(self):
        self.model_path = "model.joblib"
        self.model = None
        self._load_or_train()

    def _load_or_train(self):
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
        else:
            self._train_initial_model()

    def _train_initial_model(self):
        # Generate synthetic data for training
        # Features: [avg_grade, improvement, attendance, behavior, workload, completion]
        np.random.seed(42)
        n_samples = 1000
        
        X = np.random.rand(n_samples, 6)
        # avg_grade (0-100)
        X[:, 0] = X[:, 0] * 100
        # grade_improvement (-10 to 10)
        X[:, 1] = (X[:, 1] - 0.5) * 20
        # attendance (0-1)
        X[:, 2] = X[:, 2]
        # behavior (0-100)
        X[:, 3] = X[:, 3] * 100
        # workload (0-40)
        X[:, 4] = X[:, 4] * 40
        # completion (0-1)
        X[:, 5] = X[:, 5]

        # Target: score (0-100)
        # Simple rule for synthetic labels: 
        # score = 0.4*grade + 0.1*improvement + 0.2*attendance*100 + 0.1*behavior + 0.2*completion*100
        y = (0.4 * X[:, 0] + 
             0.1 * (X[:, 1] + 10) * 5 + 
             0.2 * X[:, 2] * 100 + 
             0.1 * X[:, 3] + 
             0.2 * X[:, 5] * 100)
        
        # Add some noise
        y += np.random.normal(0, 2, n_samples)
        y = np.clip(y, 0, 100)

        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.model.fit(X, y)
        joblib.dump(self.model, self.model_path)

    def predict(self, features):
        X = np.array(features).reshape(1, -1)
        score = self.model.predict(X)[0]
        
        # Heuristics for other outputs since we only trained on score
        improvement_prob = 0.5 + (features[1] / 100) + (features[5] * 0.2)
        improvement_prob = np.clip(improvement_prob, 0, 1)
        
        weak_areas = []
        training_plan = []
        
        if features[0] < 60:
            weak_areas.append("Student Academic Performance")
            training_plan.append("Pedagogical skills workshop")
        if features[2] < 0.8:
            weak_areas.append("Classroom Engagement/Attendance")
            training_plan.append("Classroom management training")
        if features[5] < 0.7:
            weak_areas.append("Assignment Follow-up")
            training_plan.append("Digital tools for homework tracking")
            
        if not weak_areas:
            weak_areas.append("None")
            training_plan.append("Advanced professional development")

        return {
            "score": round(float(score), 2),
            "improvementProbability": round(float(improvement_prob), 2),
            "weakAreas": weak_areas,
            "trainingPlan": training_plan
        }

ml_service = MLService()
