from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.faculty import Faculty
from app.models.student import Student
from app.models.authority import Authority
from app.models.lms import Announcement
from app.schemas.announcements import (
    AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse, AuthorResponse
)
from app.core.security import get_current_active_user

router = APIRouter()

def build_announcement_response(ann: Announcement, db: Session) -> AnnouncementResponse:
    creator = ann.posted_by
    name = "Administrator"
    role = creator.role.value
    designation = "Administrator"

    if creator.role == UserRole.ADMIN:
        name = "System Admin"
        designation = "Administrator"
    elif creator.role == UserRole.HOD:
        fac = db.query(Faculty).filter(Faculty.user_id == creator.id).first()
        if fac:
            name = f"{fac.first_name} {fac.last_name}"
            designation = fac.designation or "Head of Department"
    elif creator.role == UserRole.FACULTY:
        fac = db.query(Faculty).filter(Faculty.user_id == creator.id).first()
        if fac:
            name = f"{fac.first_name} {fac.last_name}"
            designation = fac.designation or "Faculty"
    elif creator.role == UserRole.AUTHORITY:
        auth = db.query(Authority).filter(Authority.user_id == creator.id).first()
        if auth:
            name = f"{auth.first_name} {auth.last_name}"
            designation = auth.title or "Authority"
    elif creator.role == UserRole.STUDENT:
        stud = db.query(Student).filter(Student.user_id == creator.id).first()
        if stud:
            name = f"{stud.first_name} {stud.last_name}"
            designation = "Student"

    author_info = AuthorResponse(name=name, role=role, designation=designation)
    return AnnouncementResponse(
        id=ann.id,
        course_id=ann.course_id,
        department_id=ann.department_id,
        posted_by_id=ann.posted_by_id,
        title=ann.title,
        content=ann.content,
        category=ann.category,
        target_audience=ann.target_audience,
        is_global=ann.is_global or False,
        created_at=ann.created_at,
        author=author_info
    )

@router.get("", response_model=List[AnnouncementResponse])
def get_announcements(
    limit: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Resolve user's department
    user_dept_id = None
    if current_user.role in (UserRole.FACULTY, UserRole.HOD):
        fac = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if fac:
            user_dept_id = fac.department_id
    elif current_user.role == UserRole.STUDENT:
        stud = db.query(Student).filter(Student.user_id == current_user.id).first()
        if stud:
            user_dept_id = stud.department_id

    # Base query joining User to inspect creator role
    query = db.query(Announcement).join(User, Announcement.posted_by_id == User.id)

    if current_user.role == UserRole.ADMIN:
        # Admin can view all announcements in the DB
        query = query.order_by(Announcement.created_at.desc())
    else:
        conditions = []
        # 1. Creator always sees their own announcements
        conditions.append(Announcement.posted_by_id == current_user.id)
        
        # 2. Student seeing Faculty announcements (only visible to Students)
        if current_user.role == UserRole.STUDENT:
            student_faculty_cond = and_(
                User.role == UserRole.FACULTY,
                Announcement.target_audience == "Students",
                or_(
                    Announcement.is_global == True,
                    Announcement.department_id == None,
                    Announcement.department_id == user_dept_id
                )
            )
            conditions.append(student_faculty_cond)
            
        # 3. Non-faculty announcements (Admin, HOD, Authority creators)
        allowed_audiences = ["Everyone"]
        if current_user.role == UserRole.AUTHORITY:
            allowed_audiences.append("Higher Authorities")
        elif current_user.role == UserRole.HOD:
            allowed_audiences.extend(["HODs", "Faculty"])
        elif current_user.role == UserRole.FACULTY:
            allowed_audiences.append("Faculty")
        elif current_user.role == UserRole.STUDENT:
            allowed_audiences.append("Students")

        # Filter by audience type and department bounds
        non_faculty_cond = and_(
            User.role != UserRole.FACULTY,
            Announcement.target_audience.in_(allowed_audiences),
            or_(
                Announcement.is_global == True,
                Announcement.department_id == None,
                Announcement.department_id == user_dept_id
            )
        )
        conditions.append(non_faculty_cond)

        query = query.filter(or_(*conditions)).order_by(Announcement.created_at.desc())
    
    if limit is not None:
        query = query.limit(limit)
        
    results = query.all()
    return [build_announcement_response(r, db) for r in results]

@router.post("", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
def create_announcement(
    ann_in: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Validate role-based creation permissions
    allowed_audiences = []
    if current_user.role == UserRole.ADMIN:
        allowed_audiences = ["Everyone", "Higher Authorities", "HODs", "Faculty", "Students"]
    elif current_user.role == UserRole.AUTHORITY:
        allowed_audiences = ["Everyone", "HODs", "Faculty", "Students"]
    elif current_user.role == UserRole.FACULTY:
        allowed_audiences = ["Students"]
    elif current_user.role == UserRole.HOD:
        allowed_audiences = ["Everyone", "Faculty", "Students"]
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your role is not authorized to create announcements"
        )

    if ann_in.target_audience not in allowed_audiences:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"As a {current_user.role}, you cannot publish announcements to audience '{ann_in.target_audience}'"
        )

    # Determine department scope
    dept_id = None
    if current_user.role in (UserRole.HOD, UserRole.FACULTY):
        fac = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if fac:
            dept_id = fac.department_id

    # Enforce non-global for HOD/Faculty
    is_global_val = ann_in.is_global
    if current_user.role in (UserRole.HOD, UserRole.FACULTY):
        is_global_val = False

    new_ann = Announcement(
        department_id=dept_id,
        posted_by_id=current_user.id,
        title=ann_in.title,
        content=ann_in.content,
        category=ann_in.category,
        target_audience=ann_in.target_audience,
        is_global=is_global_val
    )
    
    db.add(new_ann)
    db.commit()
    db.refresh(new_ann)
    return build_announcement_response(new_ann, db)

@router.put("/{ann_id}", response_model=AnnouncementResponse)
def update_announcement(
    ann_id: int,
    ann_in: AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    ann = db.query(Announcement).filter(Announcement.id == ann_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    if ann.posted_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the announcement creator can edit this announcement"
        )

    # Update only passed non-null values
    if ann_in.title is not None:
        ann.title = ann_in.title
    if ann_in.content is not None:
        ann.content = ann_in.content
    if ann_in.category is not None:
        ann.category = ann_in.category
        
    # Faculty/HOD audience restrictions
    if ann_in.target_audience is not None:
        allowed_audiences = []
        if current_user.role == UserRole.ADMIN:
            allowed_audiences = ["Everyone", "Higher Authorities", "HODs", "Faculty", "Students"]
        elif current_user.role == UserRole.AUTHORITY:
            allowed_audiences = ["Everyone", "HODs", "Faculty", "Students"]
        elif current_user.role == UserRole.FACULTY:
            allowed_audiences = ["Students"]
        elif current_user.role == UserRole.HOD:
            allowed_audiences = ["Everyone", "Faculty", "Students"]
            
        if ann_in.target_audience not in allowed_audiences:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cannot edit target audience to '{ann_in.target_audience}' for your role"
            )
        ann.target_audience = ann_in.target_audience

    if ann_in.is_global is not None:
        if current_user.role in (UserRole.HOD, UserRole.FACULTY):
            ann.is_global = False
        else:
            ann.is_global = ann_in.is_global

    db.commit()
    db.refresh(ann)
    return build_announcement_response(ann, db)

@router.delete("/{ann_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_announcement(
    ann_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    ann = db.query(Announcement).filter(Announcement.id == ann_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")

    # Creator or Admin can delete
    if current_user.role != UserRole.ADMIN and ann.posted_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this announcement"
        )
        
    db.delete(ann)
    db.commit()
    return None
