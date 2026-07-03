from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
import csv
import io
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date as date_type

from app.core.database import get_db
from app.models.faculty import Faculty
from app.models.user import User
from app.models.department import Department
from app.models.academic import CourseAssignment, Section, MentorAssignment
from app.models.attendance import Attendance, AttendanceStatus
from app.models.student import Student
from app.models.grade import Grade, GradeType, GRADE_MAX_MARKS, GRADE_PASS_MARKS
from app.models.mentorship import AdvisingLog
from app.models.lms import LMSResource, ResourceType, Announcement, TimetableSlot
from app.schemas.faculty import (
    FacultyCreate, FacultyUpdate, FacultyResponse,
    CourseAssignmentFacultyResponse,
    LMSResourceCreate, LMSResourceResponse,
    AnnouncementCreate, AnnouncementResponse,
)
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


@router.get("/{faculty_id}/workload")
def get_faculty_workload(
    faculty_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get workload (assigned courses) for a specific faculty member.
    """
    if current_user.role not in ["admin", "hod"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins and HODs can view faculty workload")
    
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    
    # Get all course assignments for this faculty
    assignments = db.query(CourseAssignment).options(
        joinedload(CourseAssignment.course),
        joinedload(CourseAssignment.section)
    ).filter(
        CourseAssignment.faculty_id == faculty_id,
        CourseAssignment.is_active == True
    ).order_by(
        CourseAssignment.semester.asc()
    ).all()
    
    # Import TimetableSlot model
    from app.models.lms import TimetableSlot
    
    # Build flat course list and count timetable periods
    courses = []
    total_hours = 0
    
    for assignment in assignments:
        # Count timetable slots (periods) for this course assignment
        slot_count = db.query(TimetableSlot).filter(
            TimetableSlot.course_assignment_id == assignment.id
        ).count()
        
        total_hours += slot_count
        
        courses.append({
            "id": assignment.id,
            "course_code": assignment.course.code,
            "course_name": assignment.course.name,
            "credits": assignment.course.credits,
            "periods": slot_count,
            "course_type": assignment.course.course_type,
            "semester": assignment.semester,
            "section": f"{assignment.section.year} Year {assignment.section.name}" if assignment.section else "N/A"
        })
    
    return {
        "faculty_id": faculty.id,
        "faculty_name": f"{faculty.first_name} {faculty.last_name}",
        "employee_id": faculty.employee_id,
        "designation": faculty.designation,
        "department_id": faculty.department_id,
        "courses": courses,
        "total_active_courses": len(assignments),
        "total_hours": total_hours
    }


# ── Mentorship Endpoints (from development) ───────────────────────────────────

def _get_faculty_profile(current_user: User, db: Session) -> Faculty:
    if current_user.role not in ["faculty", "hod"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only faculty can access this")
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")
    return faculty


@router.get("/me/mentees")
def get_my_mentees(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    faculty = _get_faculty_profile(current_user, db)
    assignments = db.query(MentorAssignment).options(
        joinedload(MentorAssignment.student).joinedload(Student.department),
        joinedload(MentorAssignment.student).joinedload(Student.section),
    ).filter(MentorAssignment.mentor_id == faculty.id).all()
    result = []
    for ma in assignments:
        s = ma.student
        result.append({
            "id": s.id, "first_name": s.first_name, "last_name": s.last_name,
            "register_number": s.register_number, "college_email": s.college_email,
            "current_semester": s.current_semester, "current_year": s.current_year,
            "department": s.department.name if s.department else None,
            "section": s.section.name if s.section else None, "batch": s.batch,
        })
    return result


@router.get("/me/mentees/{student_id}")
def get_mentee_detail(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    faculty = _get_faculty_profile(current_user, db)
    assignment = db.query(MentorAssignment).filter(
        MentorAssignment.mentor_id == faculty.id, MentorAssignment.student_id == student_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Student not found in your mentee list")
    student = db.query(Student).options(
        joinedload(Student.department), joinedload(Student.section)
    ).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    total = db.query(Attendance).filter(Attendance.student_id == student_id).count()
    present = db.query(Attendance).filter(Attendance.student_id == student_id, Attendance.status == AttendanceStatus.PRESENT).count()
    att_pct = round((present / total * 100), 1) if total > 0 else None
    grades = db.query(Grade).filter(Grade.student_id == student_id).all()
    backlogs = sum(1 for g in grades if g.max_marks and g.marks_obtained is not None and (float(g.marks_obtained) / float(g.max_marks)) < 0.40)
    logs = db.query(AdvisingLog).filter(AdvisingLog.mentor_id == faculty.id, AdvisingLog.student_id == student_id).order_by(AdvisingLog.created_at.desc()).all()
    return {
        "id": student.id, "first_name": student.first_name, "last_name": student.last_name,
        "register_number": student.register_number, "college_email": student.college_email,
        "current_semester": student.current_semester, "current_year": student.current_year,
        "department": student.department.name if student.department else None,
        "section": student.section.name if student.section else None, "batch": student.batch,
        "attendance_percentage": att_pct, "backlog_count": backlogs,
        "advising_logs": [{"id": l.id, "note": l.note, "created_at": l.created_at} for l in logs],
    }


@router.post("/me/mentees/{student_id}/logs")
def add_advising_log(student_id: int, payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    faculty = _get_faculty_profile(current_user, db)
    assignment = db.query(MentorAssignment).filter(
        MentorAssignment.mentor_id == faculty.id, MentorAssignment.student_id == student_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Student not found in your mentee list")
    note_text = payload.get("note", "").strip()
    if not note_text:
        raise HTTPException(status_code=400, detail="Note cannot be empty")
    log = AdvisingLog(mentor_id=faculty.id, student_id=student_id, note=note_text)
    db.add(log)
    db.commit()
    db.refresh(log)
    return {"id": log.id, "note": log.note, "created_at": log.created_at}


# ── Attendance Endpoints ───────────────────────────────────────────────────────

@router.get("/courses/{assignment_id}/attendance-slots")
def get_attendance_slots(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns today's timetable slots for this assignment.
    Each slot includes is_current (True if current time is within that period).
    Faculty can only mark attendance during or after the period starts.
    """
    from datetime import datetime, time as time_type

    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")

    assignment = db.query(CourseAssignment).options(
        joinedload(CourseAssignment.course),
        joinedload(CourseAssignment.section)
    ).filter(
        CourseAssignment.id == assignment_id,
        CourseAssignment.faculty_id == faculty.id,
        CourseAssignment.is_active == True
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Use weekday() — locale-independent: 0=Monday ... 5=Saturday
    DAY_MAP = {0: "mon", 1: "tue", 2: "wed", 3: "thu", 4: "fri", 5: "sat", 6: "sun"}
    today_name = DAY_MAP[date_type.today().weekday()]
    now_time = datetime.now().time()

    slots = db.query(TimetableSlot).filter(
        TimetableSlot.course_assignment_id == assignment_id
    ).all()

    today_slots = []
    for s in slots:
        slot_day = s.day.value if hasattr(s.day, 'value') else s.day
        if slot_day != today_name:
            continue

        start = s.start_time if isinstance(s.start_time, time_type) else s.start_time
        end   = s.end_time   if isinstance(s.end_time,   time_type) else s.end_time

        # Allow marking from start_time until end of day (so staff can mark even slightly late)
        is_active = now_time >= start

        today_slots.append({
            "id": s.id,
            "day": slot_day,
            "start_time": start.strftime("%H:%M"),
            "end_time":   end.strftime("%H:%M"),
            "room": s.room,
            "is_active": is_active,   # True = faculty can mark now
            "is_current": start <= now_time <= end,  # True = currently in this period
        })

    # Students in this section
    students = db.query(Student).filter(
        Student.section_id == assignment.section_id,
        Student.is_active == True
    ).order_by(Student.register_number).all()

    today = date_type.today()
    student_ids = [s.id for s in students]
    existing = {}
    if student_ids:
        records = db.query(Attendance).filter(
            Attendance.student_id.in_(student_ids),
            Attendance.course_id == assignment.course_id,
            Attendance.date == today
        ).all()
        existing = {r.student_id: r.status.value for r in records}

    return {
        "today_slots": today_slots,
        "course_name": assignment.course.name,
        "course_code": assignment.course.code,
        "section": f"{assignment.section.year} Year {assignment.section.name}" if assignment.section else "",
        "today": str(today),
        "today_day": today_name,
        "students": [
            {
                "id": s.id,
                "register_number": s.register_number,
                "first_name": s.first_name,
                "last_name": s.last_name,
                "status": existing.get(s.id)
            }
            for s in students
        ]
    }


@router.post("/courses/{assignment_id}/attendance")
def save_course_attendance(
    assignment_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Save attendance for today for a specific course assignment.
    payload: { records: [{ student_id, status }], slot_start_time: "HH:MM" (optional) }
    """
    from datetime import datetime, time as time_type

    # Map start_time → period number
    PERIOD_MAP = {
        "08:45": 1, "09:30": 2, "10:35": 3, "11:25": 4,
        "13:00": 5, "13:50": 6, "14:50": 7, "15:40": 8
    }

    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")

    assignment = db.query(CourseAssignment).filter(
        CourseAssignment.id == assignment_id,
        CourseAssignment.faculty_id == faculty.id,
        CourseAssignment.is_active == True
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    from app.models.department import Department
    department = db.query(Department).filter(Department.id == assignment.course.department_id).first()
    if department and department.attendance_closed:
        raise HTTPException(status_code=400, detail="Attendance marking is currently locked by the HOD.")

    today = date_type.today()
    now_time = datetime.now().time()
    records = payload.get("records", [])
    slot_start = payload.get("slot_start_time")  # e.g. "08:45"

    # Determine period number from slot_start or current time
    period_number = PERIOD_MAP.get(slot_start) if slot_start else None
    if not period_number:
        # Find active slot from timetable right now
        DAY_MAP = {0: "mon", 1: "tue", 2: "wed", 3: "thu", 4: "fri", 5: "sat", 6: "sun"}
        today_name = DAY_MAP[date_type.today().weekday()]
        slots = db.query(TimetableSlot).filter(
            TimetableSlot.course_assignment_id == assignment_id
        ).all()
        for s in slots:
            slot_day = s.day.value if hasattr(s.day, 'value') else s.day
            if slot_day == today_name and s.start_time <= now_time:
                period_number = PERIOD_MAP.get(s.start_time.strftime("%H:%M"))
                break

    saved = 0
    for rec in records:
        try:
            att_status = AttendanceStatus(rec["status"])
        except (ValueError, KeyError):
            continue

        existing = db.query(Attendance).filter(
            Attendance.student_id == rec["student_id"],
            Attendance.course_id == assignment.course_id,
            Attendance.date == today,
            Attendance.hour == period_number
        ).first()

        if existing:
            existing.status = att_status
            existing.marked_by_id = faculty.id
        else:
            db.add(Attendance(
                student_id=rec["student_id"],
                course_id=assignment.course_id,
                date=today,
                hour=period_number,
                status=att_status,
                marked_by_id=faculty.id
            ))
        saved += 1

    db.commit()
    return {"message": "Attendance saved", "saved": saved}


@router.get("/courses/{assignment_id}/attendance-history")
def get_attendance_history(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns attendance history grouped by date for this course assignment.
    Each date entry shows present/absent count and per-student status.
    """
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")

    assignment = db.query(CourseAssignment).options(
        joinedload(CourseAssignment.course),
        joinedload(CourseAssignment.section)
    ).filter(
        CourseAssignment.id == assignment_id,
        CourseAssignment.faculty_id == faculty.id,
        CourseAssignment.is_active == True
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # All students in section
    students = db.query(Student).filter(
        Student.section_id == assignment.section_id,
        Student.is_active == True
    ).order_by(Student.register_number).all()
    student_map = {s.id: f"{s.first_name} {s.last_name}" for s in students}
    reg_map     = {s.id: s.register_number for s in students}

    # All attendance records for this course
    records = db.query(Attendance).filter(
        Attendance.course_id == assignment.course_id,
        Attendance.student_id.in_([s.id for s in students])
    ).order_by(Attendance.date.desc()).all()

    # Group by date + hour
    from collections import defaultdict
    by_date_hour = defaultdict(list)
    for r in records:
        key = (str(r.date), r.hour)
        by_date_hour[key].append(r)

    # Period number → time label
    PERIOD_TIMES = {
        1: "8:45–9:30am", 2: "9:30–10:20am", 3: "10:35–11:25am", 4: "11:25–12:15pm",
        5: "1:00–1:50pm", 6: "1:50–2:40pm",  7: "2:50–3:40pm",  8: "3:40–4:30pm"
    }

    history = []
    for (date_str, hour) in sorted(by_date_hour.keys(), key=lambda x: (x[0], x[1] or 0), reverse=True):
        day_records = by_date_hour[(date_str, hour)]
        present = sum(1 for r in day_records if r.status == AttendanceStatus.PRESENT)
        absent  = sum(1 for r in day_records if r.status == AttendanceStatus.ABSENT)
        history.append({
            "date": date_str,
            "hour": hour,
            "hour_label": f"Period {hour} · {PERIOD_TIMES[hour]}" if hour and hour in PERIOD_TIMES else "—",
            "present": present,
            "absent": absent,
            "total": len(students),
            "records": [
                {
                    "student_id": r.student_id,
                    "name": student_map.get(r.student_id, "—"),
                    "register_number": reg_map.get(r.student_id, "—"),
                    "status": r.status.value
                }
                for r in sorted(day_records, key=lambda x: reg_map.get(x.student_id, ""))
            ]
        })

    return {
        "course_name": assignment.course.name,
        "course_code": assignment.course.code,
        "section": f"{assignment.section.year} Year {assignment.section.name}" if assignment.section else "",
        "total_students": len(students),
        "history": history
    }

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


# ── Grade Book Endpoints ──────────────────────────────────────────────────────

def _get_assignment_for_faculty(assignment_id: int, faculty: Faculty, db: Session) -> CourseAssignment:
    """Helper: fetch and validate a CourseAssignment belongs to this faculty."""
    assignment = db.query(CourseAssignment).options(
        joinedload(CourseAssignment.course),
        joinedload(CourseAssignment.section)
    ).filter(
        CourseAssignment.id == assignment_id,
        CourseAssignment.faculty_id == faculty.id,
        CourseAssignment.is_active == True
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Course assignment not found")
    return assignment


@router.get("/courses/{assignment_id}/gradebook")
def get_gradebook(
    assignment_id: int,
    grade_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns the student roster with existing marks for the given grade_type.
    Query param: grade_type — one of internal_1, internal_2, model_exam
    """
    faculty = _get_faculty_profile(current_user, db)
    assignment = _get_assignment_for_faculty(assignment_id, faculty, db)

    # Validate grade type
    try:
        gt = GradeType(grade_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid grade_type '{grade_type}'")

    # Student roster via section
    students = db.query(Student).filter(
        Student.section_id == assignment.section_id,
        Student.is_active == True
    ).order_by(Student.register_number).all()

    student_ids = [s.id for s in students]

    # Existing grades for this course + grade_type
    existing_grades = db.query(Grade).filter(
        Grade.course_id == assignment.course_id,
        Grade.grade_type == gt.value,
        Grade.student_id.in_(student_ids),
        Grade.academic_year == assignment.academic_year,
        Grade.semester == assignment.semester,
    ).all()
    grade_map = {g.student_id: g for g in existing_grades}

    max_marks = GRADE_MAX_MARKS.get(gt, 100)
    pass_mark = GRADE_PASS_MARKS.get(gt)

    roster = []
    for s in students:
        g = grade_map.get(s.id)
        retest_eligible = None
        if pass_mark is not None and g:
            retest_eligible = g.is_absent or (
                g.marks_obtained is not None and float(g.marks_obtained) < pass_mark
            )
        roster.append({
            "student_id": s.id,
            "register_number": s.register_number,
            "first_name": s.first_name,
            "last_name": s.last_name,
            "grade_id": g.id if g else None,
            "marks_obtained": float(g.marks_obtained) if g and g.marks_obtained is not None else None,
            "is_absent": g.is_absent if g else False,
            "remarks": g.remarks if g else "",
            "is_published": g.is_published if g else False,
            "retest_eligible": retest_eligible,
        })

    return {
        "course_name": assignment.course.name,
        "course_code": assignment.course.code,
        "section": f"{assignment.section.year} Year {assignment.section.name}" if assignment.section else "",
        "academic_year": assignment.academic_year,
        "semester": assignment.semester,
        "grade_type": gt.value,
        "max_marks": max_marks,
        "pass_mark": pass_mark,
        "is_published": all(g.is_published for g in existing_grades) if existing_grades else False,
        "roster": roster,
    }


@router.post("/courses/{assignment_id}/gradebook")
def save_grades(
    assignment_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Bulk upsert grades for a course assignment.
    payload: {
        grade_type: str,
        entries: [{ student_id, marks_obtained, is_absent, remarks }]
    }
    Creates new Grade rows or updates existing ones (draft, not published).
    """
    faculty = _get_faculty_profile(current_user, db)
    assignment = _get_assignment_for_faculty(assignment_id, faculty, db)

    try:
        gt = GradeType(payload.get("grade_type", ""))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid grade_type")

    max_marks = GRADE_MAX_MARKS.get(gt, 100)
    entries = payload.get("entries", [])

    saved = 0
    for entry in entries:
        student_id = entry.get("student_id")
        is_absent = bool(entry.get("is_absent", False))
        raw_marks = entry.get("marks_obtained")
        remarks = entry.get("remarks", "")

        # Validate marks range
        marks = None
        if not is_absent and raw_marks is not None:
            try:
                marks = float(raw_marks)
                if marks < 0 or marks > max_marks:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Marks {marks} out of range for {gt.value} (max {max_marks})"
                    )
            except (TypeError, ValueError):
                raise HTTPException(status_code=400, detail="Invalid marks value")

        existing = db.query(Grade).filter(
            Grade.course_id == assignment.course_id,
            Grade.grade_type == gt.value,
            Grade.student_id == student_id,
            Grade.academic_year == assignment.academic_year,
            Grade.semester == assignment.semester,
        ).first()

        if existing:
            existing.marks_obtained = marks
            existing.is_absent = is_absent
            existing.max_marks = max_marks
            existing.remarks = remarks
            existing.graded_by_id = faculty.id
        else:
            db.add(Grade(
                student_id=student_id,
                course_id=assignment.course_id,
                grade_type=gt.value,
                marks_obtained=marks,
                max_marks=max_marks,
                is_absent=is_absent,
                academic_year=assignment.academic_year,
                semester=assignment.semester,
                graded_by_id=faculty.id,
                remarks=remarks,
                is_published=False,
            ))
        saved += 1

    db.commit()
    return {"message": f"Saved {saved} grade entries", "saved": saved}


@router.post("/courses/{assignment_id}/gradebook/publish")
def publish_grades(
    assignment_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Publish grades for a specific grade_type — makes them visible to students.
    payload: { grade_type: str }
    """
    faculty = _get_faculty_profile(current_user, db)
    assignment = _get_assignment_for_faculty(assignment_id, faculty, db)

    try:
        gt = GradeType(payload.get("grade_type", ""))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid grade_type")

    updated = db.query(Grade).filter(
        Grade.course_id == assignment.course_id,
        Grade.grade_type == gt.value,
        Grade.academic_year == assignment.academic_year,
        Grade.semester == assignment.semester,
    ).all()

    if not updated:
        raise HTTPException(status_code=404, detail="No grades found to publish for this assessment")

    for g in updated:
        g.is_published = True

    db.commit()
    return {"message": f"Published {len(updated)} grades for {gt.value}"}


@router.get("/courses/{assignment_id}/gradebook/export")
def export_grades_csv(
    assignment_id: int,
    grade_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Export grades as CSV for a given grade_type.
    Returns CSV text as plain response.
    """
    from fastapi.responses import StreamingResponse

    faculty = _get_faculty_profile(current_user, db)
    assignment = _get_assignment_for_faculty(assignment_id, faculty, db)

    try:
        gt = GradeType(grade_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid grade_type '{grade_type}'")

    students = db.query(Student).filter(
        Student.section_id == assignment.section_id,
        Student.is_active == True
    ).order_by(Student.register_number).all()

    student_ids = [s.id for s in students]
    grades = db.query(Grade).filter(
        Grade.course_id == assignment.course_id,
        Grade.grade_type == gt.value,
        Grade.student_id.in_(student_ids),
        Grade.academic_year == assignment.academic_year,
        Grade.semester == assignment.semester,
    ).all()
    grade_map = {g.student_id: g for g in grades}

    max_marks = GRADE_MAX_MARKS.get(gt, 100)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Register Number", "First Name", "Last Name",
        f"Marks Obtained (Max {max_marks})", "Absent", "Remarks", "Published"
    ])
    for s in students:
        g = grade_map.get(s.id)
        writer.writerow([
            s.register_number,
            s.first_name,
            s.last_name,
            float(g.marks_obtained) if g and g.marks_obtained is not None else "",
            "Yes" if g and g.is_absent else "No",
            g.remarks if g else "",
            "Yes" if g and g.is_published else "No",
        ])

    output.seek(0)
    filename = f"{assignment.course.code}_{gt.value}_{assignment.academic_year}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ── Student-facing Grade API (read-only, published grades only) ───────────────

@router.get("/courses/{assignment_id}/gradebook/student/{student_id}")
def get_student_grades(
    assignment_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns published grades for a student in a course.
    Accessible by the student themselves or the faculty teaching the course.
    """
    assignment = db.query(CourseAssignment).options(
        joinedload(CourseAssignment.course)
    ).filter(CourseAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Course assignment not found")

    # Only the student themselves or the faculty teaching this course can view
    if current_user.role == "student":
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student or student.id != student_id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role in ["faculty", "hod"]:
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if not faculty or assignment.faculty_id != faculty.id:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        raise HTTPException(status_code=403, detail="Access denied")

    grades = db.query(Grade).filter(
        Grade.course_id == assignment.course_id,
        Grade.student_id == student_id,
        Grade.academic_year == assignment.academic_year,
        Grade.semester == assignment.semester,
        Grade.is_published == True,
    ).all()

    return [
        {
            "grade_type": g.grade_type.value,
            "marks_obtained": float(g.marks_obtained) if g.marks_obtained is not None else None,
            "max_marks": float(g.max_marks),
            "is_absent": g.is_absent,
            "remarks": g.remarks,
        }
        for g in grades
    ]
