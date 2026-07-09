from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.models.academic import CourseAssignment
from app.models.course_plan import CoursePlan, CoursePlanTopic
from app.schemas.course_plan import CoursePlanCreate, CoursePlanResponse
from app.core.security import get_current_active_user
from app.models.user import User

router = APIRouter()

@router.get("/{assignment_id}", response_model=CoursePlanResponse)
def get_course_plan(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve the course plan for a specific course assignment.
    """
    assignment = db.query(CourseAssignment).filter(CourseAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Course assignment not found")
        
    plan = db.query(CoursePlan).options(
        joinedload(CoursePlan.topics)
    ).filter(
        CoursePlan.course_assignment_id == assignment_id
    ).first()
    
    if not plan:
        # Return a mock empty plan response if it doesn't exist yet
        return CoursePlanResponse(
            id=0,
            course_assignment_id=assignment_id,
            created_at=datetime.now(),
            topics=[]
        )
        
    # Sort topics by sequence_no for consistent display
    plan.topics.sort(key=lambda t: t.sequence_no)
    return plan

@router.post("/{assignment_id}", response_model=CoursePlanResponse)
def save_course_plan(
    assignment_id: int,
    plan_in: CoursePlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create or update/overwrite the course plan topics.
    """
    assignment = db.query(CourseAssignment).filter(CourseAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Course assignment not found")
        
    # Ensure current user has permission (is the faculty assigned or admin/HOD)
    if current_user.role == "faculty":
        from app.models.faculty import Faculty
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if not faculty or assignment.faculty_id != faculty.id:
            raise HTTPException(status_code=403, detail="You do not have access to edit this plan")

    # Fetch or create the plan header
    plan = db.query(CoursePlan).filter(CoursePlan.course_assignment_id == assignment_id).first()
    if not plan:
        plan = CoursePlan(course_assignment_id=assignment_id)
        db.add(plan)
        db.flush() # Get the plan ID

    # Validation: If actual_date is set and differs from proposed_date, reason_for_deviation must be provided.
    # Also if marked as signed, it must have actual_date.
    for topic_in in plan_in.topics:
        if topic_in.actual_date and topic_in.proposed_date:
            if topic_in.actual_date != topic_in.proposed_date and not topic_in.reason_for_deviation:
                raise HTTPException(
                    status_code=400,
                    detail=f"Topic {topic_in.sequence_no}: Reason for deviation is required when actual date differs from proposed date."
                )

    # Delete existing topics to rebuild them dynamically
    db.query(CoursePlanTopic).filter(CoursePlanTopic.course_plan_id == plan.id).delete()
    
    # Save the updated topics
    for topic_in in plan_in.topics:
        db_topic = CoursePlanTopic(
            course_plan_id=plan.id,
            sequence_no=topic_in.sequence_no,
            proposed_date=topic_in.proposed_date,
            hours=topic_in.hours,
            unit=topic_in.unit,
            topic=topic_in.topic,
            cognitive_level=topic_in.cognitive_level,
            mode_of_delivery=topic_in.mode_of_delivery,
            actual_date=topic_in.actual_date,
            reason_for_deviation=topic_in.reason_for_deviation,
            is_signed=topic_in.is_signed,
            signed_at=datetime.now() if topic_in.is_signed else None
        )
        db.add(db_topic)
        
    db.commit()
    
    # Refetch plan to return full relationships
    plan = db.query(CoursePlan).options(
        joinedload(CoursePlan.topics)
    ).filter(
        CoursePlan.id == plan.id
    ).first()
    
    plan.topics.sort(key=lambda t: t.sequence_no)
    return plan
