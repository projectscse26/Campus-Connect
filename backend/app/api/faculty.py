from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
import csv
import io
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.core.database import get_db
from app.models.faculty import Faculty
from app.models.user import User
from app.models.department import Department
from app.models.academic import CourseAssignment
from app.models.lms import LMSResource, ResourceType, Announcement
from app.schemas.faculty import FacultyCreate, FacultyUpdate, FacultyResponse, CourseAssignmentFacultyResponse, LMSResourceCreate, LMSResourceResponse, AnnouncementCreate, AnnouncementResponse
from app.core.security import get_current_active_user, get_password_hash

router = APIRouter()

@router.get("/me/courses", response_model=List[CourseAssignmentFacultyResponse])
def get_my_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve courses assigned to the current faculty.
    """
    if current_user.role not in ["faculty", "hod"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only faculty and HODs can view assigned courses")
    
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")

    assignments = db.query(CourseAssignment).options(
        joinedload(CourseAssignment.course),
        joinedload(CourseAssignment.section)
    ).filter(
        CourseAssignment.faculty_id == faculty.id,
        CourseAssignment.is_active == True
    ).all()
    
    return assignments

@router.post("/courses/{assignment_id}/resources", response_model=LMSResourceResponse, status_code=status.HTTP_201_CREATED)
def create_lms_resource(
    assignment_id: int,
    resource_in: LMSResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in ["faculty", "hod"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")
    
    # Verify assignment belongs to this faculty
    assignment = db.query(CourseAssignment).filter(
        CourseAssignment.id == assignment_id,
        CourseAssignment.faculty_id == faculty.id,
        CourseAssignment.is_active == True
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Course assignment not found")
        
    # Format title to include module unit if provided
    combined_title = f"[{resource_in.module_unit}] {resource_in.title}" if resource_in.module_unit else resource_in.title
    
    # Map category to enum
    try:
        resource_type = ResourceType(resource_in.category)
    except ValueError:
        resource_type = ResourceType.NOTES # fallback
    
    new_resource = LMSResource(
        course_id=assignment.course_id,
        uploaded_by_id=faculty.id,
        title=combined_title,
        description=resource_in.description,
        resource_type=resource_type,
        external_link=resource_in.external_link
    )
    
    db.add(new_resource)
    db.commit()
    db.refresh(new_resource)
    return new_resource

@router.get("/courses/{assignment_id}/resources", response_model=List[LMSResourceResponse])
def get_lms_resources(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in ["faculty", "hod", "student"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
    assignment = db.query(CourseAssignment).filter(CourseAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Course assignment not found")
        
    resources = db.query(LMSResource).filter(
        LMSResource.course_id == assignment.course_id
    ).order_by(LMSResource.created_at.desc()).all()
    
    return resources


@router.post("/courses/{assignment_id}/announcements", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
def create_course_announcement(
    assignment_id: int,
    announcement_in: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in ["faculty", "hod"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
    assignment = db.query(CourseAssignment).filter(CourseAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Course assignment not found")
        
    # Check if faculty owns the assignment
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty or assignment.faculty_id != faculty.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to post to this course")

    new_announcement = Announcement(
        course_id=assignment.course_id,
        posted_by_id=current_user.id,
        title=announcement_in.title,
        content=announcement_in.content,
        is_global=announcement_in.is_global
    )
    
    db.add(new_announcement)
    db.commit()
    db.refresh(new_announcement)
    return new_announcement


@router.get("/courses/{assignment_id}/announcements", response_model=List[AnnouncementResponse])
def get_course_announcements(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in ["faculty", "hod", "student"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
    assignment = db.query(CourseAssignment).filter(CourseAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Course assignment not found")
        
    announcements = db.query(Announcement).filter(
        Announcement.course_id == assignment.course_id
    ).order_by(Announcement.created_at.desc()).all()
    
    return announcements


@router.get("/", response_model=List[FacultyResponse])
def get_faculty(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve all faculty members.
    """
    faculty = db.query(Faculty).offset(skip).limit(limit).all()
    return faculty

@router.post("/", response_model=FacultyResponse, status_code=status.HTTP_201_CREATED)
def create_faculty(
    faculty_in: FacultyCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Onboard a new faculty member. This creates both a User account and a Faculty profile.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can onboard faculty")
        
    # Check if user email already exists
    db_user = db.query(User).filter(User.email == faculty_in.college_email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Check if department exists
    db_dept = db.query(Department).filter(Department.id == faculty_in.department_id).first()
    if not db_dept:
        raise HTTPException(status_code=400, detail="Department does not exist")

    # Check if employee_id already exists
    db_emp = db.query(Faculty).filter(Faculty.employee_id == faculty_in.employee_id).first()
    if db_emp:
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    # Determine role based on designation
    is_hod = faculty_in.designation and faculty_in.designation.upper() == "HOD"
    user_role = "hod" if is_hod else "faculty"

    # If HOD, check that the department doesn't already have one
    if is_hod:
        existing_hod = db.query(Faculty).join(User).filter(
            Faculty.department_id == faculty_in.department_id,
            Faculty.designation == "HOD",
            User.role == "hod"
        ).first()
        if existing_hod:
            raise HTTPException(status_code=400, detail="This department already has an HOD assigned")

    # 1. Create the User account
    new_user = User(
        email=faculty_in.college_email,
        hashed_password=get_password_hash(faculty_in.password),
        role=user_role,
        is_active=True
    )
    db.add(new_user)
    db.flush()
    
    # 2. Create the Faculty profile linked to the User
    new_faculty = Faculty(
        user_id=new_user.id,
        department_id=faculty_in.department_id,
        first_name=faculty_in.first_name,
        last_name=faculty_in.last_name,
        college_email=faculty_in.college_email,
        phone=faculty_in.phone,
        employee_id=faculty_in.employee_id,
        designation=faculty_in.designation,
        gender=faculty_in.gender,
        date_of_joining=faculty_in.joining_date,
        specialization=faculty_in.specialization
    )
    db.add(new_faculty)
    db.flush()

    # 3. If HOD, set Department.hod_id
    if is_hod:
        db_dept.hod_id = new_faculty.id

    db.commit()
    db.refresh(new_faculty)
    
    return new_faculty

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_faculty(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Bulk import faculty members via CSV.
    Headers expected: first_name, last_name, department_id, employee_id, college_email, phone, designation, password
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can bulk upload faculty")
        
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    content = await file.read()
    csv_reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
    
    success_count = 0
    errors = []
    
    for row_num, row in enumerate(csv_reader, start=2): # Row 1 is header
        try:
            # Basic validation
            required = ['first_name', 'last_name', 'department_id', 'employee_id', 'college_email', 'phone']
            for req in required:
                if req not in row or not row[req].strip():
                    raise ValueError(f"Missing required field: {req}")
            
            email = row['college_email'].strip()
            
            # Check existing
            if db.query(User).filter(User.email == email).first():
                errors.append(f"Row {row_num}: Email {email} already exists")
                continue
            
            if db.query(Faculty).filter(Faculty.employee_id == row['employee_id'].strip()).first():
                errors.append(f"Row {row_num}: Employee ID {row['employee_id']} already exists")
                continue
                
            # Default password if not provided
            pwd = row.get('password', '').strip()
            if not pwd:
                pwd = "Welcome123"
                
            # Create user
            new_user = User(
                email=email,
                hashed_password=get_password_hash(pwd),
                role="faculty",
                is_active=True
            )
            db.add(new_user)
            db.flush()
            
            # Create faculty
            new_faculty = Faculty(
                user_id=new_user.id,
                department_id=int(row['department_id']),
                first_name=row['first_name'].strip(),
                last_name=row['last_name'].strip(),
                college_email=email,
                phone=row['phone'].strip(),
                employee_id=row['employee_id'].strip(),
                designation=row.get('designation', '').strip()
            )
            db.add(new_faculty)
            success_count += 1
            
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
            
    db.commit()
    
    return {
        "message": f"Successfully imported {success_count} faculty members",
        "success_count": success_count,
        "errors": errors
    }

@router.put("/{faculty_id}", response_model=FacultyResponse)
def update_faculty(
    faculty_id: int,
    faculty_in: FacultyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a faculty member. Handles HOD role transitions.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can update faculty")
        
    db_faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not db_faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
        
    update_data = faculty_in.model_dump(exclude_unset=True)
    
    if "employee_id" in update_data and update_data["employee_id"] != db_faculty.employee_id:
        if db.query(Faculty).filter(Faculty.employee_id == update_data["employee_id"]).first():
            raise HTTPException(status_code=400, detail="Employee ID already in use")

    # Handle designation/role changes
    old_designation = (db_faculty.designation or "").upper()
    new_designation = (update_data.get("designation") or db_faculty.designation or "").upper()
    db_user = db.query(User).filter(User.id == db_faculty.user_id).first()
    dept_id = update_data.get("department_id", db_faculty.department_id)

    if new_designation == "HOD" and old_designation != "HOD":
        # Promoting to HOD — check dept doesn't already have one
        existing_hod = db.query(Faculty).join(User).filter(
            Faculty.department_id == dept_id,
            Faculty.designation == "HOD",
            User.role == "hod",
            Faculty.id != faculty_id
        ).first()
        if existing_hod:
            raise HTTPException(status_code=400, detail="This department already has an HOD assigned")
        if db_user:
            db_user.role = "hod"
        db_dept = db.query(Department).filter(Department.id == dept_id).first()
        if db_dept:
            db_dept.hod_id = db_faculty.id

    elif old_designation == "HOD" and new_designation != "HOD":
        # Demoting from HOD
        if db_user:
            db_user.role = "faculty"
        db_dept = db.query(Department).filter(Department.id == db_faculty.department_id).first()
        if db_dept and db_dept.hod_id == db_faculty.id:
            db_dept.hod_id = None

    for field, value in update_data.items():
        setattr(db_faculty, field, value)
        
    db.commit()
    db.refresh(db_faculty)
    return db_faculty

@router.delete("/{faculty_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faculty(
    faculty_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a faculty member (and their user account).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can delete faculty")
        
    db_faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not db_faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
        
    db_user = db.query(User).filter(User.id == db_faculty.user_id).first()
    
    db.delete(db_faculty)
    if db_user:
        db.delete(db_user)
        
    db.commit()
    return None
