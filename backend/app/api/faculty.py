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

@router.get("/me/dashboard")
def get_faculty_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    course_id: int = None,  # Keep for backward compatibility
    assignment_id: int = None,  # New parameter for specific assignment
    selected_date: str = None
):
    """
    Get comprehensive dashboard data for faculty including courses, students, analytics, and timetable.
    Optionally filter by assignment_id (preferred) or course_id and/or selected_date (YYYY-MM-DD format)
    """
    if current_user.role not in ["faculty", "hod"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only faculty can access this")
    
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")
    
    from app.models.lms import TimetableSlot
    from app.models.academic import Course
    from datetime import date as date_type, datetime, time as time_type, timedelta
    
    # Parse selected date if provided
    if selected_date:
        try:
            selected_date_obj = datetime.strptime(selected_date, "%Y-%m-%d").date()
        except:
            selected_date_obj = date_type.today()
    else:
        selected_date_obj = date_type.today()
    
    # Get active course assignments (optionally filtered by assignment_id or course_id)
    assignment_query = db.query(CourseAssignment).options(
        joinedload(CourseAssignment.course),
        joinedload(CourseAssignment.section)
    ).filter(
        CourseAssignment.faculty_id == faculty.id,
        CourseAssignment.is_active == True
    )
    
    if assignment_id:
        assignment_query = assignment_query.filter(CourseAssignment.id == assignment_id)
    elif course_id:
        assignment_query = assignment_query.filter(CourseAssignment.course_id == course_id)
    
    assignments = assignment_query.all()
    
    # Calculate total students
    total_students = 0
    for assignment in assignments:
        if assignment.section:
            student_count = db.query(Student).filter(
                Student.section_id == assignment.section_id,
                Student.is_active == True
            ).count()
            total_students += student_count
    
    # Get schedule for selected date
    # If assignment_id is provided, show only that course's schedule
    # Otherwise, show ALL classes for the day
    DAY_MAP = {0: "mon", 1: "tue", 2: "wed", 3: "thu", 4: "fri", 5: "sat", 6: "sun"}
    selected_day_name = DAY_MAP[selected_date_obj.weekday()]
    now_time = datetime.now().time()
    is_today = selected_date_obj == date_type.today()
    
    selected_date_classes = []
    
    # Determine which assignments to show in schedule
    if assignment_id or course_id:
        # Show only selected course's schedule
        schedule_assignments = assignments
    else:
        # Show ALL assignments for complete daily schedule
        schedule_assignments = db.query(CourseAssignment).options(
            joinedload(CourseAssignment.course),
            joinedload(CourseAssignment.section)
        ).filter(
            CourseAssignment.faculty_id == faculty.id,
            CourseAssignment.is_active == True
        ).all()
    
    for assignment in schedule_assignments:
        slots = db.query(TimetableSlot).filter(
            TimetableSlot.course_assignment_id == assignment.id
        ).all()
        
        for slot in slots:
            slot_day = slot.day.value if hasattr(slot.day, 'value') else slot.day
            if slot_day == selected_day_name:
                is_current = is_today and (slot.start_time <= now_time <= slot.end_time)
                
                class_info = {
                    "course_name": assignment.course.name,
                    "course_code": assignment.course.code,
                    "start_time": slot.start_time.strftime("%H:%M"),
                    "end_time": slot.end_time.strftime("%H:%M"),
                    "room": slot.room,
                    "section": f"{assignment.section.year} Year {assignment.section.name}" if assignment.section else "N/A",
                    "is_current": is_current,
                    "course_id": assignment.course_id,
                    "assignment_id": assignment.id
                }
                
                selected_date_classes.append(class_info)
    
    # Sort classes by start time
    selected_date_classes.sort(key=lambda x: x["start_time"])
    
    # Calculate attendance trajectory (last 30 days for better graph)
    trajectory = []
    for i in range(29, -1, -1):
        check_date = date_type.today() - timedelta(days=i)
        
        # Count attendance marked by this faculty
        attendance_query = db.query(Attendance).filter(
            Attendance.marked_by_id == faculty.id,
            Attendance.date == check_date,
            Attendance.status == AttendanceStatus.PRESENT
        )
        
        # Filter by course if specified
        if course_id:
            # Get students from sections for this course
            section_ids = [a.section_id for a in assignments if a.section_id]
            if section_ids:
                attendance_query = attendance_query.filter(
                    Attendance.student_id.in_(
                        db.query(Student.id).filter(Student.section_id.in_(section_ids))
                    )
                )
        
        present_count = attendance_query.count()
        
        # Also get total marked (present + absent)
        total_query = db.query(Attendance).filter(
            Attendance.marked_by_id == faculty.id,
            Attendance.date == check_date
        )
        
        if course_id:
            if section_ids:
                total_query = total_query.filter(
                    Attendance.student_id.in_(
                        db.query(Student.id).filter(Student.section_id.in_(section_ids))
                    )
                )
        
        total_marked = total_query.count()
        absent_count = total_marked - present_count
        
        trajectory.append({
            "date": check_date.strftime("%b %d"),
            "full_date": check_date.strftime("%Y-%m-%d"),
            "present": present_count,
            "absent": absent_count,
            "total": total_marked,
            "percentage": round((present_count / total_marked * 100) if total_marked > 0 else 0, 1)
        })
    
    # Calculate pending evaluations (grades not entered)
    pending_evaluations = 0
    for assignment in assignments:
        if assignment.section:
            students_in_section = db.query(Student).filter(
                Student.section_id == assignment.section_id,
                Student.is_active == True
            ).count()
            
            graded_count = db.query(Grade).filter(
                Grade.course_id == assignment.course_id,
                Grade.graded_by_id == faculty.id
            ).count()
            
            pending_evaluations += max(0, students_in_section - graded_count)
    
    # Calculate average class performance
    total_marks = 0
    grade_count = 0
    for assignment in assignments:
        grades = db.query(Grade).filter(
            Grade.course_id == assignment.course_id,
            Grade.graded_by_id == faculty.id,
            Grade.marks_obtained != None,
            Grade.max_marks != None
        ).all()
        
        for grade in grades:
            if grade.max_marks and grade.marks_obtained:
                percentage = (float(grade.marks_obtained) / float(grade.max_marks)) * 100
                total_marks += percentage
                grade_count += 1
    
    avg_performance = round(total_marks / grade_count) if grade_count > 0 else 0
    
    # Get recent campus announcements (latest 5)
    campus_announcements = db.query(Announcement).options(
        joinedload(Announcement.posted_by)
    ).order_by(
        Announcement.created_at.desc()
    ).limit(5).all()
    
    announcements_data = [
        {
            "id": ann.id,
            "title": ann.title,
            "content": ann.content,
            "posted_by": ann.posted_by.email if ann.posted_by else "Unknown",
            "created_at": ann.created_at.strftime("%b %d, %Y %I:%M %p") if ann.created_at else "N/A",
            "priority": getattr(ann, 'priority', 'normal')
        }
        for ann in campus_announcements
    ]
    
    # Calculate student performance breakdown by grade ranges
    student_performance = {
        "excellent": 0,  # 90-100%
        "good": 0,       # 75-89%
        "average": 0,    # 60-74%
        "poor": 0        # below 60%
    }
    
    for assignment in assignments:
        grades = db.query(Grade).filter(
            Grade.course_id == assignment.course_id,
            Grade.graded_by_id == faculty.id,
            Grade.marks_obtained != None,
            Grade.max_marks != None
        ).all()
        
        for grade in grades:
            if grade.max_marks and grade.marks_obtained:
                percentage = (float(grade.marks_obtained) / float(grade.max_marks)) * 100
                if percentage >= 90:
                    student_performance["excellent"] += 1
                elif percentage >= 75:
                    student_performance["good"] += 1
                elif percentage >= 60:
                    student_performance["average"] += 1
                else:
                    student_performance["poor"] += 1
    
    # AI Risk Analysis - Identify at-risk students (course-specific if filtered)
    at_risk_students = []
    for assignment in assignments:
        if assignment.section:
            students = db.query(Student).filter(
                Student.section_id == assignment.section_id,
                Student.is_active == True
            ).limit(50).all()  # Limit for performance
            
            for student in students:
                risk_factors = []
                risk_score = 0
                
                # Check attendance for this specific course
                # Get attendance records where this faculty marked for this student
                total_classes_query = db.query(Attendance).filter(
                    Attendance.student_id == student.id,
                    Attendance.marked_by_id == faculty.id
                )
                
                # Filter by course if needed (check if attendance is for classes of this course)
                if course_id:
                    total_classes_query = total_classes_query.filter(
                        Attendance.course_id == course_id
                    )
                
                total_classes = total_classes_query.count()
                
                if total_classes >= 5:  # Only analyze if minimum attendance records exist
                    present_classes = total_classes_query.filter(
                        Attendance.status == AttendanceStatus.PRESENT
                    ).count()
                    
                    attendance_percentage = (present_classes / total_classes) * 100
                    
                    if attendance_percentage < 50:
                        risk_factors.append(f"Critical attendance: {attendance_percentage:.0f}%")
                        risk_score += 50
                    elif attendance_percentage < 65:
                        risk_factors.append(f"Low attendance: {attendance_percentage:.0f}%")
                        risk_score += 30
                    elif attendance_percentage < 75:
                        risk_factors.append(f"Below average attendance: {attendance_percentage:.0f}%")
                        risk_score += 15
                
                # Check grades for this course
                grade_query = db.query(Grade).filter(
                    Grade.student_id == student.id,
                    Grade.graded_by_id == faculty.id,
                    Grade.marks_obtained != None,
                    Grade.max_marks != None
                )
                
                if course_id:
                    grade_query = grade_query.filter(Grade.course_id == course_id)
                
                recent_grades = grade_query.order_by(Grade.created_at.desc()).limit(3).all()
                
                if recent_grades:
                    failing_grades = 0
                    grade_percentages = []
                    
                    for grade in recent_grades:
                        if grade.max_marks and grade.marks_obtained:
                            percentage = (float(grade.marks_obtained) / float(grade.max_marks)) * 100
                            grade_percentages.append(percentage)
                            if percentage < 40:
                                failing_grades += 1
                            elif percentage < 60:
                                failing_grades += 0.5
                    
                    avg_grade = sum(grade_percentages) / len(grade_percentages) if grade_percentages else 0
                    
                    if failing_grades >= 2:
                        risk_factors.append(f"Multiple failing grades (avg: {avg_grade:.0f}%)")
                        risk_score += 40
                    elif failing_grades >= 1:
                        risk_factors.append(f"Recent low performance (avg: {avg_grade:.0f}%)")
                        risk_score += 25
                    elif avg_grade < 70:
                        risk_factors.append(f"Below average grades ({avg_grade:.0f}%)")
                        risk_score += 10
                
                # Check for assignment submissions (if available)
                # This would require an assignments table - skipping for now
                
                # Determine risk level and add to list
                if risk_score >= 50:
                    risk_level = "high"
                    suggestion = "Schedule immediate intervention meeting"
                elif risk_score >= 25:
                    risk_level = "medium"
                    suggestion = "Send academic support resources"
                elif risk_score >= 10:
                    risk_level = "low"
                    suggestion = "Monitor closely"
                else:
                    continue  # Skip students with no risk
                
                at_risk_students.append({
                    "student_id": student.id,
                    "name": f"{student.first_name} {student.last_name}",
                    "register_number": student.register_number,
                    "risk_level": risk_level,
                    "risk_score": risk_score,
                    "risk_factors": risk_factors,
                    "suggestion": suggestion,
                    "course": assignment.course.name,
                    "course_code": assignment.course.code
                })
    
    # Sort by risk score and get top 10
    at_risk_students.sort(key=lambda x: x["risk_score"], reverse=True)
    at_risk_students = at_risk_students[:10]
    
    # Get faculty profile for name and gender
    # Use first_name and last_name from faculty table, fallback to email if not available
    faculty_name = f"{faculty.first_name} {faculty.last_name}" if faculty.first_name and faculty.last_name else (current_user.email.split('@')[0].title() if current_user.email else "Faculty")
    
    faculty_profile = {
        "name": faculty_name,
        "gender": getattr(faculty, 'gender', 'male'),  # Default to male if not set
        "title": getattr(faculty, 'title', None)  # Use actual title from database, no default
    }
    
    # Get all courses for dropdown (each course-section pair should be unique)
    all_courses = [
        {
            "id": a.id,  # Use assignment ID instead of course_id for uniqueness
            "course_id": a.course_id,
            "course_name": a.course.name,
            "course_code": a.course.code,
            "section": f"{a.section.year} Year {a.section.name}" if a.section else "N/A",
            "section_id": a.section_id
        }
        for a in db.query(CourseAssignment).options(
            joinedload(CourseAssignment.course),
            joinedload(CourseAssignment.section)
        ).filter(
            CourseAssignment.faculty_id == faculty.id,
            CourseAssignment.is_active == True
        ).all()
    ]
    
    return {
        "assigned_courses": len(assignments),
        "total_students": total_students,
        "pending_evaluations": pending_evaluations,
        "class_performance": avg_performance,
        "selected_date_classes": selected_date_classes,
        "selected_date": selected_date_obj.strftime("%Y-%m-%d"),
        "attendance_trajectory": trajectory,
        "campus_announcements": announcements_data,
        "student_performance": student_performance,
        "at_risk_students": at_risk_students,
        "faculty_profile": faculty_profile,
        "all_courses": all_courses,
        "current_assignment_id": assignment_id,
        "current_course_id": course_id,  # Keep for backward compatibility
        "total_at_risk": len(at_risk_students)
    }


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


@router.get("/courses/{assignment_id}/timetable")
def get_course_timetable(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve timetable slots for a specific course assignment.
    """
    if current_user.role not in ["faculty", "hod"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only faculty and HODs can view course timetable")
        
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
        
    slots = db.query(TimetableSlot).filter(
        TimetableSlot.course_assignment_id == assignment_id
    ).order_by(TimetableSlot.day, TimetableSlot.start_time).all()
    
    return [
        {
            "id": s.id,
            "day": s.day.value if hasattr(s.day, 'value') else s.day,
            "start_time": s.start_time.strftime("%H:%M") if s.start_time else "",
            "end_time": s.end_time.strftime("%H:%M") if s.end_time else "",
            "room": s.room
        }
        for s in slots
    ]


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
        
        # Calculate attendance percentage
        total = db.query(Attendance).filter(Attendance.student_id == s.id).count()
        present = db.query(Attendance).filter(
            Attendance.student_id == s.id,
            Attendance.status == AttendanceStatus.PRESENT
        ).count()
        od = db.query(Attendance).filter(
            Attendance.student_id == s.id,
            Attendance.status == AttendanceStatus.ON_DUTY
        ).count()
        late = db.query(Attendance).filter(
            Attendance.student_id == s.id,
            Attendance.status == AttendanceStatus.LATE
        ).count()
        
        attended = present + od + late
        att_pct = round((attended / total * 100), 1) if total > 0 else None
        
        result.append({
            "id": s.id, "first_name": s.first_name, "last_name": s.last_name,
            "register_number": s.register_number, "college_email": s.college_email,
            "current_semester": s.current_semester, "current_year": s.current_year,
            "department": s.department.name if s.department else None,
            "section": s.section.name if s.section else None, "batch": s.batch,
            "attendance_pct": att_pct,
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
    
    # Calculate attendance percentage
    total = db.query(Attendance).filter(Attendance.student_id == student_id).count()
    present = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.status == AttendanceStatus.PRESENT
    ).count()
    od = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.status == AttendanceStatus.ON_DUTY
    ).count()
    late = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.status == AttendanceStatus.LATE
    ).count()
    
    # We count PRESENT, ON_DUTY, and LATE as attended classes
    attended = present + od + late
    att_pct = round((attended / total * 100), 1) if total > 0 else None
    
    grades = db.query(Grade).filter(Grade.student_id == student_id).all()
    backlogs = sum(1 for g in grades if g.max_marks and g.marks_obtained is not None and (float(g.marks_obtained) / float(g.max_marks)) < 0.40)
    
    logs = db.query(AdvisingLog).filter(AdvisingLog.mentor_id == faculty.id, AdvisingLog.student_id == student_id).order_by(AdvisingLog.created_at.desc()).all()
    
    # 1. Personal & Guardian Details
    personal_details = {
        "gender": student.gender,
        "date_of_birth": student.date_of_birth.isoformat() if student.date_of_birth else None,
        "blood_group": student.blood_group,
        "nationality": student.nationality,
        "community": student.community,
        "phone": student.phone,
        "personal_email": student.personal_email,
        "address": f"{student.address_line1 or ''}, {student.address_line2 or ''}, {student.city or ''}, {student.state or ''} - {student.pincode or ''}".strip(", "),
        "father_name": student.father_name,
        "father_phone": student.father_phone,
        "father_occupation": student.father_occupation,
        "mother_name": student.mother_name,
        "mother_phone": student.mother_phone,
        "mother_occupation": student.mother_occupation,
        "annual_income": float(student.annual_income) if student.annual_income else None,
        "tenth_school": student.tenth_school,
        "tenth_percentage": float(student.tenth_percentage) if student.tenth_percentage else None,
        "twelfth_school": student.twelfth_school,
        "twelfth_percentage": float(student.twelfth_percentage) if student.twelfth_percentage else None,
        "accommodation": student.accommodation,
        "transportation": student.transportation,
        "bus_number": student.bus_number
    }

    # 2. Detailed Course-wise Attendance Summary & Logs
    from app.models.academic import Course
    att_records = db.query(Attendance).options(joinedload(Attendance.course)).filter(Attendance.student_id == student_id).all()
    
    course_att = {}
    for att in att_records:
        c_id = att.course_id
        if c_id not in course_att:
            course_att[c_id] = {"code": att.course.code, "name": att.course.name, "total": 0, "present": 0}
        course_att[c_id]["total"] += 1
        if att.status in (AttendanceStatus.PRESENT, AttendanceStatus.ON_DUTY, AttendanceStatus.LATE):
            course_att[c_id]["present"] += 1

    att_summary = []
    for c_id, stats in course_att.items():
        pct = round((stats["present"] / stats["total"] * 100), 1) if stats["total"] > 0 else 0
        att_summary.append({
            "course_id": c_id,
            "course_code": stats["code"],
            "course_name": stats["name"],
            "total_classes": stats["total"],
            "attended_classes": stats["present"],
            "percentage": pct
        })

    att_details = [{
        "id": a.id,
        "date": a.date.isoformat(),
        "hour": a.hour,
        "status": a.status.value,
        "course_code": a.course.code,
        "course_name": a.course.name
    } for a in sorted(att_records, key=lambda x: x.date, reverse=True)[:50]]

    # 3. Detailed Marks & Grades
    grade_records = db.query(Grade).options(joinedload(Grade.course)).filter(Grade.student_id == student_id).all()
    grades_list = [{
        "id": g.id,
        "course_code": g.course.code,
        "course_name": g.course.name,
        "grade_type": g.grade_type.value,
        "marks_obtained": float(g.marks_obtained) if g.marks_obtained is not None else None,
        "max_marks": float(GRADE_MAX_MARKS.get(g.grade_type)) if g.grade_type in GRADE_MAX_MARKS else float(g.max_marks),
        "remarks": g.remarks,
        "semester": g.semester,
        "is_published": g.is_published,
        "is_absent": g.is_absent
    } for g in grade_records]

    # 4. Discipline Records
    from app.models.discipline import DisciplineRecord
    discipline_records = db.query(DisciplineRecord).options(joinedload(DisciplineRecord.reported_by)).filter(DisciplineRecord.student_id == student_id).all()
    discipline_list = [{
        "id": dr.id,
        "incident_type": dr.incident_type.value,
        "incident_date": dr.incident_date.isoformat(),
        "remarks": dr.remarks,
        "action_status": dr.action_status.value,
        "action_taken": dr.action_taken,
        "reported_by_name": dr.reported_by.email.split('@')[0] if dr.reported_by else "System"
    } for dr in discipline_records]

    # 5. Leave History
    from app.models.leave import StudentLeaveRequest
    leave_requests = db.query(StudentLeaveRequest).filter(StudentLeaveRequest.student_id == student_id).order_by(StudentLeaveRequest.from_date.desc()).all()
    leave_list = [{
        "id": lr.id,
        "from_date": lr.from_date.isoformat(),
        "to_date": lr.to_date.isoformat(),
        "duration_days": lr.duration_days,
        "reason": lr.reason,
        "status": lr.status.value,
        "mentor_remarks": lr.mentor_remarks,
        "class_advisor_remarks": lr.class_advisor_remarks,
        "hod_remarks": lr.hod_remarks
    } for lr in leave_requests]

    return {
        "id": student.id, 
        "first_name": student.first_name, 
        "last_name": student.last_name,
        "register_number": student.register_number, 
        "college_email": student.college_email,
        "current_semester": student.current_semester, 
        "current_year": student.current_year,
        "department": student.department.name if student.department else None,
        "section": student.section.name if student.section else None, 
        "batch": student.batch,
        "attendance_percentage": att_pct, 
        "backlog_count": backlogs,
        "personal_details": personal_details,
        "attendance_summary": att_summary,
        "attendance_details": att_details,
        "grades": grades_list,
        "discipline_records": discipline_list,
        "leave_history": leave_list,
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
    payload_hour = payload.get("hour")

    # Determine period number from hour, slot_start, or current time
    period_number = None
    if payload_hour is not None:
        period_number = int(payload_hour)
    else:
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

    # Automated update of Lesson Plan (CoursePlanTopic) if topic_id is provided
    topic_id = payload.get("topic_id")
    if topic_id:
        from app.models.course_plan import CoursePlanTopic
        from sqlalchemy import func as sa_func
        topic = db.query(CoursePlanTopic).filter(CoursePlanTopic.id == int(topic_id)).first()
        if topic:
            topic.actual_date = today
            topic.is_signed = True
            topic.signed_at = sa_func.now()
            if period_number:
                topic.hours = period_number
            if topic.proposed_date and topic.proposed_date != today:
                if not topic.reason_for_deviation:
                    topic.reason_for_deviation = "Topic covered during Daily Attendance session"

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


@router.get("/")
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
    return [
        {
            "id": f.id,
            "user_id": f.user_id,
            "first_name": f.first_name,
            "last_name": f.last_name,
            "department_id": f.department_id,
            "employee_id": f.employee_id,
            "college_email": f.college_email,
            "phone": f.phone,
            "designation": f.designation,
            "specialization": f.specialization,
            "gender": f.gender,
            "joining_date": str(f.date_of_joining) if f.date_of_joining else None,
            "is_active": f.is_active,
            "created_at": f.created_at.isoformat() if f.created_at else None,
            "updated_at": f.updated_at.isoformat() if f.updated_at else None,
        }
        for f in faculty
    ]

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

    if "college_email" in update_data and update_data["college_email"] != db_faculty.college_email:
        if db.query(User).filter(User.email == update_data["college_email"]).first():
            raise HTTPException(status_code=400, detail="Email already in use")
        
        db_user_update = db.query(User).filter(User.id == db_faculty.user_id).first()
        if db_user_update:
            db_user_update.email = update_data["college_email"]

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

    max_marks = float(GRADE_MAX_MARKS.get(gt, 100))
    pass_mark = float(GRADE_PASS_MARKS.get(gt, 40))

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

    max_marks = float(GRADE_MAX_MARKS.get(gt, 100))
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

    max_marks = float(GRADE_MAX_MARKS.get(gt, 100))

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


# ── PDF Report Generation ─────────────────────────────────────────────────────

@router.get("/student-report/{student_id}")
def generate_student_report(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate a comprehensive academic report for a student (at-risk analysis).
    Returns JSON data that frontend can use to generate PDF.
    """
    if current_user.role not in ["faculty", "hod"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only faculty can access this")
    
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")
    
    # Get student details
    student = db.query(Student).options(
        joinedload(Student.department),
        joinedload(Student.section)
    ).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    from datetime import datetime, timedelta
    
    # Get attendance data
    total_classes = db.query(Attendance).filter(
        Attendance.student_id == student_id
    ).count()
    
    present_classes = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.status == AttendanceStatus.PRESENT
    ).count()
    
    attendance_percentage = round((present_classes / total_classes * 100), 1) if total_classes > 0 else 0
    
    # Get grade data
    grades = db.query(Grade).options(
        joinedload(Grade.course)
    ).filter(
        Grade.student_id == student_id,
        Grade.marks_obtained != None,
        Grade.max_marks != None
    ).all()
    
    grade_details = []
    total_percentage = 0
    failing_count = 0
    
    for grade in grades:
        if grade.max_marks and grade.marks_obtained:
            percentage = round((float(grade.marks_obtained) / float(grade.max_marks)) * 100, 1)
            total_percentage += percentage
            
            status = "Pass"
            if percentage < 40:
                status = "Fail"
                failing_count += 1
            elif percentage < 60:
                status = "Below Average"
            elif percentage < 75:
                status = "Average"
            elif percentage < 90:
                status = "Good"
            else:
                status = "Excellent"
            
            grade_details.append({
                "course_name": grade.course.name if grade.course else "N/A",
                "course_code": grade.course.code if grade.course else "N/A",
                "grade_type": grade.grade_type.value if grade.grade_type else "N/A",
                "marks_obtained": float(grade.marks_obtained),
                "max_marks": float(grade.max_marks),
                "percentage": percentage,
                "status": status
            })
    
    average_grade = round(total_percentage / len(grades), 1) if grades else 0
    
    # Calculate risk score
    risk_score = 0
    risk_factors = []
    
    if attendance_percentage < 50:
        risk_factors.append(f"Critical attendance: {attendance_percentage}%")
        risk_score += 50
    elif attendance_percentage < 65:
        risk_factors.append(f"Low attendance: {attendance_percentage}%")
        risk_score += 30
    elif attendance_percentage < 75:
        risk_factors.append(f"Below average attendance: {attendance_percentage}%")
        risk_score += 15
    
    if failing_count >= 2:
        risk_factors.append(f"Multiple failing grades ({failing_count} subjects)")
        risk_score += 40
    elif failing_count >= 1:
        risk_factors.append(f"Failing in {failing_count} subject(s)")
        risk_score += 25
    elif average_grade < 70:
        risk_factors.append(f"Below average grades ({average_grade}%)")
        risk_score += 10
    
    # Determine risk level
    if risk_score >= 50:
        risk_level = "high"
        recommendation = "Immediate intervention required. Schedule a meeting with student and parents."
    elif risk_score >= 25:
        risk_level = "medium"
        recommendation = "Academic support needed. Provide tutoring resources and monitor progress."
    elif risk_score >= 10:
        risk_level = "low"
        recommendation = "Monitor student performance closely. Encourage improvement."
    else:
        risk_level = "none"
        recommendation = "Student is performing well. Continue regular monitoring."
    
    # Get recent attendance trend (last 30 days)
    attendance_trend = []
    for i in range(29, -1, -1):
        check_date = date_type.today() - timedelta(days=i)
        day_records = db.query(Attendance).filter(
            Attendance.student_id == student_id,
            Attendance.date == check_date
        ).all()
        
        if day_records:
            present = sum(1 for r in day_records if r.status == AttendanceStatus.PRESENT)
            total = len(day_records)
            attendance_trend.append({
                "date": check_date.strftime("%Y-%m-%d"),
                "present": present,
                "total": total,
                "percentage": round((present / total * 100), 1) if total > 0 else 0
            })
    
    return {
        "report_generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "generated_by": {
            "name": f"{faculty.first_name} {faculty.last_name}",
            "employee_id": faculty.employee_id,
            "designation": faculty.designation
        },
        "student": {
            "id": student.id,
            "name": f"{student.first_name} {student.last_name}",
            "register_number": student.register_number,
            "email": student.college_email,
            "department": student.department.name if student.department else "N/A",
            "section": f"{student.section.year} Year {student.section.name}" if student.section else "N/A",
            "batch": student.batch,
            "current_semester": student.current_semester,
            "current_year": student.current_year
        },
        "attendance_summary": {
            "total_classes": total_classes,
            "present": present_classes,
            "absent": total_classes - present_classes,
            "percentage": attendance_percentage,
            "trend": attendance_trend[-7:]  # Last 7 days for chart
        },
        "academic_performance": {
            "total_subjects": len(grades),
            "average_percentage": average_grade,
            "failing_count": failing_count,
            "grade_details": grade_details
        },
        "risk_analysis": {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "recommendation": recommendation
        }
    }
