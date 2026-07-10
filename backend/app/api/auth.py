from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.core.config import get_settings
from app.models.user import User
from app.schemas.auth import Token

settings = get_settings()
router = APIRouter()

@router.post("/login", response_model=Token)
def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    # We use OAuth2PasswordRequestForm which uses 'username' and 'password'
    # In our case, 'username' will carry the email address.
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value}, expires_delta=access_token_expires
    )
    
    # Return basic user info with token
    user_data = {
        "id": user.id,
        "email": user.email,
        "role": user.role.value,
        "name": user.email.split('@')[0], # Fallback until profiles are populated
        "is_class_advisor": False,
        "advisor_section_id": None,
        "is_mentor": False
    }
    
    if user.role.value in ("faculty", "hod"):
        from app.models.faculty import Faculty
        from app.models.academic import Section, MentorAssignment
        faculty = db.query(Faculty).filter(Faculty.user_id == user.id).first()
        if faculty:
            section = db.query(Section).filter(
                Section.class_advisor_id == faculty.id,
                Section.is_active == True
            ).first()
            if section:
                user_data["is_class_advisor"] = True
                user_data["advisor_section_id"] = section.id
            is_mentor = db.query(MentorAssignment).filter(
                MentorAssignment.mentor_id == faculty.id
            ).first() is not None
            user_data["is_mentor"] = is_mentor

    # Add title for authority users
    if user.role.value == "authority":
        from app.models.authority import Authority
        authority = db.query(Authority).filter(Authority.user_id == user.id).first()
        if authority:
            user_data["title"] = authority.title
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_data}

from app.core.security import get_current_active_user
from app.models.faculty import Faculty
from app.models.academic import Section, MentorAssignment

@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    from app.models.authority import Authority
    
    extra = {"is_class_advisor": False, "advisor_section_id": None, "is_mentor": False}

    if current_user.role in ("faculty", "hod"):
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if faculty:
            section = db.query(Section).filter(
                Section.class_advisor_id == faculty.id,
                Section.is_active == True
            ).first()
            if section:
                extra["is_class_advisor"] = True
                extra["advisor_section_id"] = section.id
            
            is_mentor = db.query(MentorAssignment).filter(
                MentorAssignment.mentor_id == faculty.id
            ).first() is not None
            extra["is_mentor"] = is_mentor
    
    # Add title for authority users
    if current_user.role == "authority":
        authority = db.query(Authority).filter(Authority.user_id == current_user.id).first()
        if authority:
            extra["title"] = authority.title

    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role.value,
        "name": current_user.email.split('@')[0],
        **extra
    }


@router.get("/profile")
def get_my_profile(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Returns full profile for any logged-in user based on their role."""
    from app.models.student import Student
    from app.models.authority import Authority
    from app.models.department import Department

    role = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    base = {"id": current_user.id, "email": current_user.email, "role": role}

    if role in ("faculty", "hod"):
        f = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if f:
            dept = db.query(Department).filter(Department.id == f.department_id).first()
            return {**base,
                "first_name": f.first_name, "last_name": f.last_name,
                "employee_id": f.employee_id, "designation": f.designation,
                "college_email": f.college_email, "personal_email": f.personal_email,
                "phone": f.phone, "alternate_phone": f.alternate_phone,
                "gender": f.gender, "date_of_birth": str(f.date_of_birth) if f.date_of_birth else None,
                "blood_group": f.blood_group, "nationality": f.nationality, "religion": f.religion,
                "qualification": f.qualification, "specialization": f.specialization,
                "experience_years": f.experience_years,
                "date_of_joining": str(f.date_of_joining) if f.date_of_joining else None,
                "employment_type": f.employment_type,
                "address_line1": f.address_line1, "address_line2": f.address_line2,
                "city": f.city, "state": f.state, "pincode": f.pincode,
                "department_name": dept.name if dept else None,
                "department_code": dept.code if dept else None,
            }

    if role == "student":
        from sqlalchemy.orm import joinedload
        from app.models.academic import Enrollment, MentorAssignment, CourseAssignment
        from app.models.attendance import Attendance, AttendanceStatus

        s = db.query(Student).options(
            joinedload(Student.section).joinedload(Section.class_advisor)
        ).filter(Student.user_id == current_user.id).first()
        if s:
            dept = db.query(Department).filter(Department.id == s.department_id).first()

            # Class advisor
            advisor_name = None
            if s.section and s.section.class_advisor:
                ca = s.section.class_advisor
                advisor_name = f"{ca.first_name} {ca.last_name}"

            # Mentor
            mentor_name = None
            ma = db.query(MentorAssignment).filter(MentorAssignment.student_id == s.id).first()
            if ma:
                mentor = db.query(Faculty).filter(Faculty.id == ma.mentor_id).first()
                if mentor:
                    mentor_name = f"{mentor.first_name} {mentor.last_name}"

            # Enrolled courses
            enrollments = db.query(Enrollment).filter(Enrollment.student_id == s.id).all()
            course_ids = [e.course_id for e in enrollments]
            from app.models.academic import Course
            courses_list = []
            for cid in course_ids:
                c = db.query(Course).filter(Course.id == cid).first()
                if c:
                    # Per-course attendance
                    total = db.query(Attendance).filter(
                        Attendance.student_id == s.id, Attendance.course_id == cid
                    ).count()
                    present = db.query(Attendance).filter(
                        Attendance.student_id == s.id, Attendance.course_id == cid,
                        Attendance.status == AttendanceStatus.PRESENT
                    ).count()
                    att_pct = round((present / total * 100), 1) if total > 0 else None
                    courses_list.append({
                        "code": c.code, "name": c.name, "credits": c.credits,
                        "course_type": c.course_type.value if c.course_type else None,
                        "semester": c.semester,
                        "attendance_percentage": att_pct,
                        "classes_attended": present,
                        "total_classes": total,
                    })

            # Overall attendance
            total_all = db.query(Attendance).filter(Attendance.student_id == s.id).count()
            present_all = db.query(Attendance).filter(
                Attendance.student_id == s.id,
                Attendance.status == AttendanceStatus.PRESENT
            ).count()
            od_all = db.query(Attendance).filter(
                Attendance.student_id == s.id,
                Attendance.status == AttendanceStatus.ON_DUTY
            ).count()
            late_all = db.query(Attendance).filter(
                Attendance.student_id == s.id,
                Attendance.status == AttendanceStatus.LATE
            ).count()
            attended_all = present_all + od_all + late_all
            overall_att = round((attended_all / total_all * 100), 1) if total_all > 0 else None

            return {**base,
                "first_name": s.first_name, "last_name": s.last_name,
                "register_number": s.register_number,
                "college_email": s.college_email, "personal_email": s.personal_email,
                "phone": s.phone, "gender": s.gender,
                "date_of_birth": str(s.date_of_birth) if s.date_of_birth else None,
                "blood_group": s.blood_group, "nationality": s.nationality, "community": s.community, "religion": s.religion,
                "admission_date": str(s.admission_date) if s.admission_date else None,
                "admission_type": s.admission_type,
                "batch": s.batch, "current_year": s.current_year, "current_semester": s.current_semester,
                "department_name": dept.name if dept else None,
                "department_code": dept.code if dept else None,
                "section_name": s.section.name if s.section else None,
                "class_advisor": advisor_name,
                "mentor": mentor_name,
                "is_active": s.is_active,
                "father_name": s.father_name, "father_phone": s.father_phone,
                "mother_name": s.mother_name, "mother_phone": s.mother_phone,
                "address_line1": s.address_line1, "address_line2": s.address_line2,
                "city": s.city, "state": s.state, "pincode": s.pincode,
                "username": current_user.email,
                "last_login": str(current_user.updated_at) if current_user.updated_at else None,
                "overall_attendance": overall_att,
                "enrolled_courses": courses_list,
            }

    if role == "authority":
        a = db.query(Authority).filter(Authority.user_id == current_user.id).first()
        if a:
            return {**base,
                "first_name": a.first_name, "last_name": a.last_name,
                "title": a.title, "employee_id": a.employee_id,
                "email": a.email, "phone": a.phone,
            }

    # admin / late_tracker — no profile model, return user info only
    return {**base, "first_name": current_user.email.split("@")[0], "last_name": ""}


@router.put("/profile")
def update_my_profile(
    payload: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Students can update personal_email, phone, address, blood_group. Any role can change password."""
    from app.models.student import Student
    from app.core.security import verify_password, get_password_hash

    role = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role

    # Handle password change for any role
    if payload.get("new_password"):
        old_pw = payload.get("current_password", "")
        if not verify_password(old_pw, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        if len(payload["new_password"]) < 6:
            raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
        current_user.hashed_password = get_password_hash(payload["new_password"])
        db.commit()
        return {"message": "Password updated successfully"}

    if role == "student":
        s = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not s:
            raise HTTPException(status_code=404, detail="Student profile not found")
        editable = [
            "personal_email", "phone", "blood_group",
            "address_line1", "address_line2", "city", "state", "pincode",
            "gender", "date_of_birth", "nationality", "community", "religion",
            "admission_date", "admission_type",
            "father_name", "father_phone", "father_occupation",
            "mother_name", "mother_phone", "mother_occupation", "annual_income",
            "tenth_school", "tenth_board", "tenth_marks", "tenth_percentage",
            "twelfth_school", "twelfth_board", "twelfth_marks", "twelfth_percentage",
            "aadhar_number", "accommodation", "transportation", "bus_number"
        ]
        for field in editable:
            if field in payload:
                val = payload[field]
                if val == "":
                    val = None
                setattr(s, field, val)
        db.commit()
        return {"message": "Profile updated successfully"}

    if role in ("faculty", "hod"):
        f = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if not f:
            raise HTTPException(status_code=404, detail="Faculty profile not found")
        editable = [
            "personal_email", "phone", "alternate_phone", "blood_group",
            "address_line1", "address_line2", "city", "state", "pincode",
            "gender", "date_of_birth", "nationality", "community", "religion",
            "designation", "qualification", "specialization", 
            "experience_years", "date_of_joining", "employment_type"
        ]
        for field in editable:
            if field in payload:
                val = payload[field]
                if val == "":
                    val = None
                setattr(f, field, val)
        db.commit()
        return {"message": "Profile updated successfully"}

    raise HTTPException(status_code=400, detail="No updatable fields provided")

