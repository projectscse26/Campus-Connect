from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.core.database import get_db
from app.models.user import User
from app.models.faculty import Faculty
from app.models.student import Student
from app.models.department import Department
from app.models.academic import Section, Course, CourseAssignment, MentorAssignment
from app.models.lms import TimetableSlot, Announcement
from app.schemas.hod import (
    SectionCreate, SectionUpdate, SectionResponse,
    CourseAssignmentCreate, CourseAssignmentResponse,
    MentorAssignmentCreate, MentorAssignmentResponse,
    HodDashboardResponse,
    TimetableSlotCreate, TimetableSlotResponse, TimetableBulkCreate,
    AnnouncementCreate, AnnouncementResponse,
    AssignStudentsRequest
)
from typing import List, Optional
from app.core.security import get_current_active_user

router = APIRouter()


def get_hod_department(current_user: User, db: Session):
    """
    Helper: Given the current user (who must be an HOD), return their department.
    """
    if current_user.role != "hod":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access restricted to HODs")

    faculty_profile = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty_profile:
        raise HTTPException(status_code=404, detail="Faculty profile not found for this HOD user")

    department = db.query(Department).filter(Department.hod_id == faculty_profile.id).first()
    if not department:
        raise HTTPException(status_code=404, detail="No department assigned to this HOD")

    return department, faculty_profile


# ── Dashboard ──────────────────────────────────────────

@router.get("/dashboard", response_model=HodDashboardResponse)
def hod_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)

    faculty_count = db.query(Faculty).filter(Faculty.department_id == department.id).count()
    student_count = db.query(Student).filter(Student.department_id == department.id).count()
    course_count = db.query(Course).filter(Course.department_id == department.id).count()
    section_count = db.query(Section).filter(Section.department_id == department.id).count()
    assignment_count = db.query(CourseAssignment).join(Course).filter(
        Course.department_id == department.id,
        CourseAssignment.is_active == True
    ).count()

    return HodDashboardResponse(
        department_name=department.name,
        department_code=department.code,
        faculty_count=faculty_count,
        student_count=student_count,
        course_count=course_count,
        section_count=section_count,
        assignment_count=assignment_count
    )


# ── Faculty (read-only for HOD) ──────────────────────────

@router.get("/faculty")
def hod_faculty(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)
    faculty = db.query(Faculty).filter(Faculty.department_id == department.id).all()
    return [
        {
            "id": f.id,
            "first_name": f.first_name,
            "last_name": f.last_name,
            "employee_id": f.employee_id,
            "designation": f.designation,
            "college_email": f.college_email,
            "phone": f.phone,
        }
        for f in faculty
    ]


# ── Courses (read-only for HOD) ─────────────────────────

@router.get("/courses")
def hod_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)
    courses = db.query(Course).filter(Course.department_id == department.id).all()
    return [
        {
            "id": c.id,
            "code": c.code,
            "name": c.name,
            "credits": c.credits,
            "course_type": c.course_type.value if c.course_type else None,
            "semester": c.semester,
        }
        for c in courses
    ]


# ── Students (read-only for HOD) ────────────────────────

@router.get("/students")
def hod_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)
    students = db.query(Student).options(joinedload(Student.section)).filter(Student.department_id == department.id).all()
    return [
        {
            "id": s.id,
            "first_name": s.first_name,
            "last_name": s.last_name,
            "register_number": s.register_number,
            "batch": s.batch,
            "current_semester": s.current_semester,
            "section": {
                "id": s.section.id,
                "name": s.section.name,
                "year": s.section.year
            } if s.section else None
        }
        for s in students
    ]


# ── Sections CRUD ────────────────────────────────────────

@router.get("/sections", response_model=List[SectionResponse])
def get_sections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)
    return db.query(Section).filter(Section.department_id == department.id).all()


@router.post("/sections", response_model=SectionResponse, status_code=status.HTTP_201_CREATED)
def create_section(
    section_in: SectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)

    # Check for duplicates
    existing = db.query(Section).filter(
        Section.department_id == department.id,
        Section.name == section_in.name,
        Section.year == section_in.year,
        Section.batch == section_in.batch
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="This section already exists")

    new_section = Section(
        department_id=department.id,
        name=section_in.name,
        year=section_in.year,
        batch=section_in.batch,
    )
    db.add(new_section)
    db.commit()
    db.refresh(new_section)
    return new_section


@router.put("/sections/{section_id}", response_model=SectionResponse)
def update_section(
    section_id: int,
    section_in: SectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)
    section = db.query(Section).filter(Section.id == section_id, Section.department_id == department.id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    update_data = section_in.model_dump(exclude_unset=True)

    # Validate class advisor belongs to same department
    if "class_advisor_id" in update_data and update_data["class_advisor_id"]:
        advisor = db.query(Faculty).filter(
            Faculty.id == update_data["class_advisor_id"],
            Faculty.department_id == department.id
        ).first()
        if not advisor:
            raise HTTPException(status_code=400, detail="Class advisor must belong to your department")

    for field, value in update_data.items():
        setattr(section, field, value)

    db.commit()
    db.refresh(section)
    return section


@router.delete("/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_section(
    section_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)
    section = db.query(Section).filter(Section.id == section_id, Section.department_id == department.id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    db.delete(section)
    db.commit()
    return None

@router.get("/sections/{section_id}/unassigned-students")
def get_unassigned_students(
    section_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)
    section = db.query(Section).filter(Section.id == section_id, Section.department_id == department.id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    # Fetch students in the same department, year, and batch who don't have a section assigned
    students = db.query(Student).filter(
        Student.department_id == department.id,
        Student.batch == section.batch,
        Student.current_year == section.year,
        Student.section_id == None,
        Student.is_active == True
    ).all()
    
    return [
        {
            "id": s.id,
            "first_name": s.first_name,
            "last_name": s.last_name,
            "register_number": s.register_number,
        }
        for s in students
    ]

@router.put("/sections/{section_id}/students")
def update_section_students(
    section_id: int,
    payload: AssignStudentsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)
    section = db.query(Section).filter(Section.id == section_id, Section.department_id == department.id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    # Unassign all students currently in this section
    db.query(Student).filter(Student.section_id == section_id).update({"section_id": None})
    
    # Assign the provided students to this section
    if payload.student_ids:
        # Verify that these students belong to the same department
        valid_students = db.query(Student).filter(
            Student.id.in_(payload.student_ids),
            Student.department_id == department.id
        ).all()
        
        valid_student_ids = [s.id for s in valid_students]
        if len(valid_student_ids) != len(payload.student_ids):
            raise HTTPException(status_code=400, detail="Some students do not exist or belong to a different department")
            
        db.query(Student).filter(Student.id.in_(valid_student_ids)).update({"section_id": section_id})

    db.commit()
    return {"message": "Students successfully assigned to the section"}


# ── Course Assignments CRUD ──────────────────────────────

@router.get("/assignments", response_model=List[CourseAssignmentResponse])
def get_assignments(
    section_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)
    query = db.query(CourseAssignment).options(
        joinedload(CourseAssignment.course),
        joinedload(CourseAssignment.faculty)
    ).join(Course).filter(Course.department_id == department.id)
    if section_id:
        query = query.filter(CourseAssignment.section_id == section_id)
    return query.all()


@router.post("/assignments", response_model=CourseAssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_assignment(
    assignment_in: CourseAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)

    # Validate faculty belongs to this department
    faculty = db.query(Faculty).filter(
        Faculty.id == assignment_in.faculty_id,
        Faculty.department_id == department.id
    ).first()
    if not faculty:
        raise HTTPException(status_code=400, detail="Faculty member not found in your department")

    # Validate course belongs to this department
    course = db.query(Course).filter(
        Course.id == assignment_in.course_id,
        Course.department_id == department.id
    ).first()
    if not course:
        raise HTTPException(status_code=400, detail="Course not found in your department")

    # Validate section belongs to this department
    section = db.query(Section).filter(
        Section.id == assignment_in.section_id,
        Section.department_id == department.id
    ).first()
    if not section:
        raise HTTPException(status_code=400, detail="Section not found in your department")

    # Check for duplicate assignment
    existing = db.query(CourseAssignment).filter(
        CourseAssignment.course_id == assignment_in.course_id,
        CourseAssignment.section_id == assignment_in.section_id,
        CourseAssignment.academic_year == assignment_in.academic_year,
        CourseAssignment.semester == assignment_in.semester,
        CourseAssignment.is_active == True
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="This course is already assigned to this section for the given semester")

    new_assignment = CourseAssignment(**assignment_in.model_dump())
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    return new_assignment


@router.delete("/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)
    assignment = (
        db.query(CourseAssignment)
        .join(Course)
        .filter(CourseAssignment.id == assignment_id, Course.department_id == department.id)
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assignment)
    db.commit()
    return None


# ── Mentor Assignments CRUD ──────────────────────────────

@router.get("/mentors", response_model=List[MentorAssignmentResponse])
def get_mentors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)
    return (
        db.query(MentorAssignment)
        .join(Faculty, MentorAssignment.mentor_id == Faculty.id)
        .filter(Faculty.department_id == department.id)
        .all()
    )


@router.post("/mentors", response_model=MentorAssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_mentor(
    mentor_in: MentorAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)

    faculty = db.query(Faculty).filter(
        Faculty.id == mentor_in.mentor_id,
        Faculty.department_id == department.id
    ).first()
    if not faculty:
        raise HTTPException(status_code=400, detail="Faculty member not found in your department")

    student = db.query(Student).filter(
        Student.id == mentor_in.student_id,
        Student.department_id == department.id
    ).first()
    if not student:
        raise HTTPException(status_code=400, detail="Student not found in your department")

    # Update existing or create new mentor assignment
    existing = db.query(MentorAssignment).filter(
        MentorAssignment.student_id == mentor_in.student_id
    ).first()
    if existing:
        existing.mentor_id = mentor_in.mentor_id
        existing.academic_year = mentor_in.academic_year
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new_mentor = MentorAssignment(**mentor_in.model_dump())
        db.add(new_mentor)
        db.commit()
        db.refresh(new_mentor)
        return new_mentor

@router.delete("/mentors/student/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def unassign_mentor(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)
    
    assignment = (
        db.query(MentorAssignment)
        .join(Student, MentorAssignment.student_id == Student.id)
        .filter(MentorAssignment.student_id == student_id, Student.department_id == department.id)
        .first()
    )
    if assignment:
        db.delete(assignment)
        db.commit()
    return None


@router.delete("/mentors/{mentor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mentor(
    mentor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)
    assignment = (
        db.query(MentorAssignment)
        .join(Faculty, MentorAssignment.mentor_id == Faculty.id)
        .filter(MentorAssignment.id == mentor_id, Faculty.department_id == department.id)
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Mentor assignment not found")
    db.delete(assignment)
    db.commit()
    return None

# ── Timetable Management ──────────────────────────────────

@router.get("/timetable", response_model=List[TimetableSlotResponse])
def get_timetable(
    section_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)
    
    # Verify section belongs to this HOD's department
    section = db.query(Section).filter(Section.id == section_id, Section.department_id == department.id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found in your department")

    # Get all course assignments for this section
    assignments = db.query(CourseAssignment).filter(CourseAssignment.section_id == section_id).all()
    assignment_ids = [a.id for a in assignments]

    slots = db.query(TimetableSlot).filter(TimetableSlot.course_assignment_id.in_(assignment_ids)).all()
    # Format times as strings for response
    for s in slots:
        s.start_time = s.start_time.strftime("%H:%M")
        s.end_time = s.end_time.strftime("%H:%M")
    return slots

@router.post("/timetable", response_model=TimetableSlotResponse, status_code=status.HTTP_201_CREATED)
def create_timetable_slot(
    slot_in: TimetableSlotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)

    # Verify assignment belongs to this department
    assignment = (
        db.query(CourseAssignment)
        .join(Course)
        .filter(CourseAssignment.id == slot_in.course_assignment_id, Course.department_id == department.id)
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Course Assignment not found in your department")

    from datetime import datetime
    try:
        start_t = datetime.strptime(slot_in.start_time, "%H:%M").time()
        end_t = datetime.strptime(slot_in.end_time, "%H:%M").time()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM")

    new_slot = TimetableSlot(
        course_assignment_id=slot_in.course_assignment_id,
        day=slot_in.day,
        start_time=start_t,
        end_time=end_t,
        room=slot_in.room
    )
    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)
    new_slot.start_time = new_slot.start_time.strftime("%H:%M")
    new_slot.end_time = new_slot.end_time.strftime("%H:%M")
    return new_slot

@router.post("/timetable/bulk", status_code=status.HTTP_201_CREATED)
def bulk_create_timetable(
    payload: TimetableBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)
    
    # 1. Verify section belongs to HOD
    section = db.query(Section).filter(Section.id == payload.section_id, Section.department_id == department.id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found in your department")
        
    # 2. Get all assignments for this section
    assignments = db.query(CourseAssignment).filter(CourseAssignment.section_id == payload.section_id).all()
    assignment_ids = [a.id for a in assignments]
    
    # 3. Delete existing slots for this section
    if assignment_ids:
        db.query(TimetableSlot).filter(TimetableSlot.course_assignment_id.in_(assignment_ids)).delete(synchronize_session=False)
        
    # 4. Insert new slots
    from datetime import datetime
    new_slots = []
    for slot_in in payload.slots:
        if slot_in.course_assignment_id not in assignment_ids:
            raise HTTPException(status_code=400, detail=f"Assignment {slot_in.course_assignment_id} does not belong to section {payload.section_id}")
            
        try:
            start_t = datetime.strptime(slot_in.start_time, "%H:%M").time()
            end_t = datetime.strptime(slot_in.end_time, "%H:%M").time()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM")
            
        new_slots.append(TimetableSlot(
            course_assignment_id=slot_in.course_assignment_id,
            day=slot_in.day,
            start_time=start_t,
            end_time=end_t,
            room=slot_in.room
        ))
        
    if new_slots:
        db.add_all(new_slots)
        
    db.commit()
    return {"message": "Timetable updated successfully", "slots_added": len(new_slots)}

@router.delete("/timetable/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_timetable_slot(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)
    slot = (
        db.query(TimetableSlot)
        .join(CourseAssignment)
        .join(Course)
        .filter(TimetableSlot.id == slot_id, Course.department_id == department.id)
        .first()
    )
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    db.delete(slot)
    db.commit()
    return None

# ── Announcements Management ──────────────────────────────

@router.get("/announcements", response_model=List[AnnouncementResponse])
def get_announcements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)
    return db.query(Announcement).filter(
        (Announcement.department_id == department.id) | (Announcement.is_global == True)
    ).order_by(Announcement.created_at.desc()).all()

@router.post("/announcements", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
def create_announcement(
    ann_in: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)
    
    new_ann = Announcement(
        department_id=department.id,
        posted_by_id=current_user.id,
        title=ann_in.title,
        content=ann_in.content,
        is_global=False # HODs can only post to their department
    )
    db.add(new_ann)
    db.commit()
    db.refresh(new_ann)
    return new_ann

@router.delete("/announcements/{ann_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_announcement(
    ann_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)
    ann = db.query(Announcement).filter(
        Announcement.id == ann_id,
        Announcement.department_id == department.id
    ).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found or not yours to delete")
    db.delete(ann)
    db.commit()
    return None

# ── Monitoring (Dummy endpoints for Phase 4 UI) ──────────────────────

@router.get("/attendance-summary")
def get_attendance_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)
    # Mock data for UI demonstration
    return [
        {"section_id": 1, "section_name": "II CSE A", "average_attendance": 85.5, "low_attendance_count": 3},
        {"section_id": 2, "section_name": "II CSE B", "average_attendance": 92.0, "low_attendance_count": 0},
        {"section_id": 3, "section_name": "III CSE A", "average_attendance": 78.4, "low_attendance_count": 5},
    ]

@router.get("/results-summary")
def get_results_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    department, _ = get_hod_department(current_user, db)
    # Mock data for UI demonstration
    return [
        {"course_code": "CS201", "course_name": "Data Structures", "pass_percentage": 94.2},
        {"course_code": "CS202", "course_name": "Digital Electronics", "pass_percentage": 88.5},
        {"course_code": "CS301", "course_name": "Operating Systems", "pass_percentage": 91.0},
    ]
