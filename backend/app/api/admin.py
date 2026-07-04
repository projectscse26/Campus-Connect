from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.models.department import Department
from app.models.faculty import Faculty
from app.models.student import Student
from app.models.academic import Course
from app.models.user import User
from app.core.security import get_current_active_user, get_password_hash

router = APIRouter()

class PasswordResetRequest(BaseModel):
    new_password: str

@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get live metrics for the Admin Dashboard.
    """
    dept_count = db.query(Department).count()
    faculty_count = db.query(Faculty).count()
    student_count = db.query(Student).count()
    course_count = db.query(Course).count()
    
    # Calculate active users vs total records roughly
    total_records = dept_count + faculty_count + student_count + course_count
    active_users = db.query(User).filter(User.is_active == True).count()
    
    return {
        "departments": dept_count,
        "faculty": faculty_count,
        "students": student_count,
        "courses": course_count,
        "total_records": total_records,
        "active_users": active_users
    }

@router.post("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    request: PasswordResetRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Reset a user's password to a new temporary password.
    Only accessible by Admin.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can reset passwords")
        
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not request.new_password or len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
        
    db_user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    
    return {"message": "Password successfully reset"}
