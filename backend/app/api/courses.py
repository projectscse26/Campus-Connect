from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.academic import Course
from app.models.department import Department
from app.models.user import User
from app.schemas.academic import CourseCreate, CourseUpdate, CourseResponse
from app.core.security import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[CourseResponse])
def get_courses(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve all courses.
    """
    courses = db.query(Course).offset(skip).limit(limit).all()
    return courses

@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    course_in: CourseCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new course.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can create courses")
        
    db_dept = db.query(Department).filter(Department.id == course_in.department_id).first()
    if not db_dept:
        raise HTTPException(status_code=400, detail="Department does not exist")

    db_course = db.query(Course).filter(Course.code == course_in.code).first()
    if db_course:
        raise HTTPException(status_code=400, detail="Course code already exists")

    new_course = Course(**course_in.model_dump())
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    
    return new_course

@router.put("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    course_in: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a course.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can update courses")
        
    db_course = db.query(Course).filter(Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    update_data = course_in.model_dump(exclude_unset=True)
    
    if "code" in update_data and update_data["code"] != db_course.code:
        if db.query(Course).filter(Course.code == update_data["code"]).first():
            raise HTTPException(status_code=400, detail="Course code already in use")
            
    for field, value in update_data.items():
        setattr(db_course, field, value)
        
    db.commit()
    db.refresh(db_course)
    return db_course

@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a course.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can delete courses")
        
    db_course = db.query(Course).filter(Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    db.delete(db_course)
    db.commit()
    return None
