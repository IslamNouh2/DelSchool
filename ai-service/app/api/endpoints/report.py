from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import random

router = APIRouter()

class SubjectHistory(BaseModel):
    name: str
    history: List[float]
    current: float

class RecommendationRequest(BaseModel):
    subjects: List[SubjectHistory]

@router.post("/recommendations")
async def get_recommendations(request: RecommendationRequest):
    recommendations = []
    
    # Analyze trends and performance
    struggling_subjects = []
    excellent_subjects = []
    improving_subjects = []

    for s in request.subjects:
        # Trend Analysis
        if len(s.history) >= 2:
            prev = s.history[-2]
            last = s.history[-1]
            if last > prev + 5:
                improving_subjects.append(s.name)
            elif last < prev - 5:
                recommendations.append(f"تراجع ملحوظ في {s.name} في الآونة الأخيرة.")

        # Absolute Performance
        if s.current < 50:
            struggling_subjects.append(s.name)
        elif s.current > 85:
            excellent_subjects.append(s.name)

    # Construct Actionable Recommendations
    if excellent_subjects:
        recommendations.append(f"تميز استثنائي في {', '.join(excellent_subjects[:2])} - ينصح بالمشاركة في الأولمبياد المدرسية.")
    
    if improving_subjects:
        recommendations.append(f"استمر في هذا النشاط! نلاحظ تحسناً كبيراً في {', '.join(improving_subjects[:2])}.")

    if struggling_subjects:
        recommendations.append(f"يجب تكثيف المراجعة في {', '.join(struggling_subjects[:2])} قبل نهاية الفصل الدراسي.")
        recommendations.append("يُنصح بوضع جدول دراسي لمراجعة المفاهيم الأساسية للمواد الضعيفة.")

    if not recommendations:
        recommendations.append("أداء دراسي متوازن ومستقر. استمر في الحفاظ على هذا المستوى.")
        
    # Semester Specific Tips
    semester_tips = [
        "يُنصح ببدء المراجعة النهائية مبكراً لضمان فهم شامل لكل الدروس.",
        "المشاركة الصفية الفعالة تساعد في تثبيت المعلومات بشكل أفضل.",
        "التركيز على حل التمارين التطبيقية يرفع من مستوى الاستيعاب."
    ]
    recommendations.append(random.choice(semester_tips))

    return {"recommendations": recommendations[:5]}
