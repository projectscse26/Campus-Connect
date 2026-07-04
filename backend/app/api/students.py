from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
import csv
import io
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from app.core.database import get_db
from app.models.student import Student
from app.models.user import User
from app.models.department import Department
from app.models.alumni import Alumni
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse
from app.core.security import get_current_active_user, get_password_hash

router = APIRouter()

@router.get("/", response_model=List[StudentResponse])
def get_students(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve all students.
    """
    students = db.query(Student).offset(skip).limit(limit).all()
    return students

@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    student_in: StudentCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Onboard a new student. Creates both a User account and a Student profile.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can onboard students")
        
    db_user = db.query(User).filter(User.email == student_in.college_email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    db_student = db.query(Student).filter(Student.register_number == student_in.register_number).first()
    if db_student:
        raise HTTPException(status_code=400, detail="Register number already exists")

    db_dept = db.query(Department).filter(Department.id == student_in.department_id).first()
    if not db_dept:
        raise HTTPException(status_code=400, detail="Department does not exist")

    # 1. Create the User account
    new_user = User(
        email=student_in.college_email,
        hashed_password=get_password_hash(student_in.password),
        role="student",
        is_active=True
    )
    db.add(new_user)
    db.flush() 
    
    # 2. Create the Student profile linked to the User
    sem = student_in.current_semester or 1
    year = student_in.current_year or ((sem + 1) // 2)

    new_student = Student(
        user_id=new_user.id,
        department_id=student_in.department_id,
        first_name=student_in.first_name,
        last_name=student_in.last_name,
        register_number=student_in.register_number,
        college_email=student_in.college_email,
        phone=student_in.phone,
        batch=student_in.batch,
        current_semester=sem,
        current_year=year,
        gender=student_in.gender,
        date_of_birth=student_in.date_of_birth
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    
    return new_student

@router.post("/promote", status_code=status.HTTP_200_OK)
def promote_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Promote all active students to the next semester.
    If a student is in the 8th semester, graduate them to Alumni.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can promote students")

    active_students = db.query(Student).filter(Student.is_active == True).all()
    promoted_count = 0
    graduated_count = 0

    for s in active_students:
        if s.current_semester < 8:
            s.current_semester += 1
            promoted_count += 1
        elif s.current_semester == 8:
            # Create Alumni record
            alumni_record = Alumni(
                user_id=s.user_id,
                department_id=s.department_id,
                first_name=s.first_name,
                last_name=s.last_name,
                register_number=s.register_number,
                gender=s.gender,
                date_of_birth=s.date_of_birth,
                blood_group=s.blood_group,
                nationality=s.nationality,
                community=s.community,
                photo_url=s.photo_url,
                batch=s.batch,
                graduation_year=2026, # Using a hardcoded year for now or derive from batch
                college_email=s.college_email,
                personal_email=s.personal_email,
                phone=s.phone,
                address_line1=s.address_line1,
                address_line2=s.address_line2,
                city=s.city,
                state=s.state,
                pincode=s.pincode
            )
            db.add(alumni_record)
            
            # Deactivate user account (optional, based on requirement)
            if s.user:
                s.user.is_active = False

            # Delete student record
            db.delete(s)
            graduated_count += 1

    db.commit()

    return {
        "message": f"Successfully promoted {promoted_count} students and graduated {graduated_count} students to Alumni.",
        "promoted_count": promoted_count,
        "graduated_count": graduated_count
    }

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_students(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Bulk import students via CSV.
    Headers expected: first_name, last_name, register_number, college_email, phone, department_id, batch, current_semester, password
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can bulk upload students")
        
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    content = await file.read()
    csv_reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
    
    success_count = 0
    errors = []
    
    for row_num, row in enumerate(csv_reader, start=2):
        try:
            # Basic validation
            required = ['first_name', 'last_name', 'register_number', 'college_email', 'phone', 'department_id', 'batch']
            for req in required:
                if req not in row or not row[req].strip():
                    raise ValueError(f"Missing required field: {req}")
            
            email = row['college_email'].strip()
            
            if db.query(User).filter(User.email == email).first():
                errors.append(f"Row {row_num}: Email {email} already exists")
                continue
            
            if db.query(Student).filter(Student.register_number == row['register_number'].strip()).first():
                errors.append(f"Row {row_num}: Register Number {row['register_number']} already exists")
                continue
                
            pwd = row.get('password', '').strip()
            if not pwd:
                pwd = "Welcome123"
                
            new_user = User(
                email=email,
                hashed_password=get_password_hash(pwd),
                role="student",
                is_active=True
            )
            db.add(new_user)
            db.flush()
            
            semester_val = int(row.get('current_semester', '1').strip() or '1')
            year_val = int(row.get('current_year', str((semester_val + 1) // 2)).strip() or str((semester_val + 1) // 2))

            new_student = Student(
                user_id=new_user.id,
                department_id=int(row['department_id']),
                first_name=row['first_name'].strip(),
                last_name=row['last_name'].strip(),
                register_number=row['register_number'].strip(),
                college_email=email,
                phone=row['phone'].strip(),
                batch=row['batch'].strip(),
                current_semester=semester_val,
                current_year=year_val
            )
            db.add(new_student)
            success_count += 1
            
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
            
    db.commit()
    
    return {
        "message": f"Successfully imported {success_count} students",
        "success_count": success_count,
        "errors": errors
    }

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    student_in: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a student member.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can update students")
        
    db_student = db.query(Student).filter(Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    update_data = student_in.model_dump(exclude_unset=True)
    
    if "register_number" in update_data and update_data["register_number"] != db_student.register_number:
        if db.query(Student).filter(Student.register_number == update_data["register_number"]).first():
            raise HTTPException(status_code=400, detail="Register Number already in use")
            
    for field, value in update_data.items():
        setattr(db_student, field, value)
        
    db.commit()
    db.refresh(db_student)
    return db_student

@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a student (and their user account).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can delete students")
        
    db_student = db.query(Student).filter(Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    db_user = db.query(User).filter(User.id == db_student.user_id).first()
    
    # Manually delete related records to avoid FK constraints
    db.execute(text("DELETE FROM discipline_records WHERE student_id = :id"), {"id": student_id})
    db.execute(text("DELETE FROM late_records WHERE student_id = :id"), {"id": student_id})
    db.execute(text("DELETE FROM late_entry_notifications WHERE student_id = :id"), {"id": student_id})
    db.execute(text("DELETE FROM mentoring_meetings WHERE student_id = :id"), {"id": student_id})
    db.execute(text("DELETE FROM advising_logs WHERE student_id = :id"), {"id": student_id})
    db.execute(text("DELETE FROM gate_passes WHERE student_id = :id"), {"id": student_id})
    db.execute(text("DELETE FROM enrollments WHERE student_id = :id"), {"id": student_id})
    db.execute(text("DELETE FROM attendance WHERE student_id = :id"), {"id": student_id})
    db.execute(text("DELETE FROM student_leave_requests WHERE student_id = :id"), {"id": student_id})
    db.execute(text("DELETE FROM grades WHERE student_id = :id"), {"id": student_id})
    db.execute(text("DELETE FROM mentor_assignments WHERE student_id = :id"), {"id": student_id})

    db.delete(db_student)
    if db_user:
        db.delete(db_user)
        
    db.commit()
    return None
