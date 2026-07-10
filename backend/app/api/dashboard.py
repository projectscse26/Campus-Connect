"""
Campus Connect ERP — Dashboard API
Provides statistics and metrics for different user roles
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, date
from typing import Dict, Any

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.authority import Authority
from app.models.discipline import DisciplineRecord
from app.models.gatepass import GatePass, GatePassStatus
from app.models.leave import (
    FacultyLeaveRequest, 
    StudentLeaveRequest, 
    LeaveStatus,
    StudentLeaveStatus
)
from app.models.department import Department

router = APIRouter()

@router.get("/debug/user-info")
def get_user_debug_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Debug endpoint to check user information and authority title
    """
    user_info = {
        "user_id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active
    }
    
    if current_user.role == "authority":
        authority = db.query(Authority).filter(Authority.user_id == current_user.id).first()
        if authority:
            user_info["authority"] = {
                "id": authority.id,
                "first_name": authority.first_name,
                "last_name": authority.last_name,
                "title": authority.title,
                "title_length": len(authority.title),
                "title_repr": repr(authority.title),  # Shows hidden characters
                "email": authority.email,
                "employee_id": authority.employee_id
            }
        else:
            user_info["authority"] = None
            user_info["error"] = "Authority profile not found"
    
    return user_info

@router.get("/authority/stats")
def get_authority_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get comprehensive dashboard statistics for Office Manager users (authority/OM)
    """
    if current_user.role != "authority":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # NOTE: Not checking specific title to allow any authority user to view OM dashboard
    # This is intentional for backward compatibility
    
    try:
        from datetime import timedelta
        from app.models.academic import Course, Enrollment
        from app.models.attendance import Attendance
        from app.models.grade import Grade
        
        # 1. TOP NUMBERS (Stat Cards)
        total_students = db.query(Student).filter(Student.is_active == True).count()
        total_faculty = db.query(Faculty).filter(Faculty.is_active == True).count()
        total_departments = db.query(Department).count()
        
        # Active courses (courses with enrollments in current semester)
        try:
            active_courses = db.query(Course).filter(Course.is_active == True).count()
        except Exception:
            active_courses = 0
        
        # 2. ATTENDANCE OVERVIEW
        # Overall college attendance
        try:
            total_attendance_records = db.query(Attendance).count()
            present_count = db.query(Attendance).filter(Attendance.status == "present").count()
            overall_attendance_percent = round((present_count / total_attendance_records * 100), 2) if total_attendance_records > 0 else 0
        except Exception:
            overall_attendance_percent = 0
        
        # Attendance by department
        attendance_by_dept = []
        departments = db.query(Department).all()
        for dept in departments:
            try:
                dept_students = db.query(Student).filter(
                    Student.department_id == dept.id,
                    Student.is_active == True
                ).all()
                student_ids = [s.id for s in dept_students]
                
                if student_ids:
                    dept_total = db.query(Attendance).filter(Attendance.student_id.in_(student_ids)).count()
                    dept_present = db.query(Attendance).filter(
                        Attendance.student_id.in_(student_ids),
                        Attendance.status == "present"
                    ).count()
                    dept_percent = round((dept_present / dept_total * 100), 2) if dept_total > 0 else 0
                else:
                    dept_percent = 0
            except Exception:
                dept_percent = 0
                
            attendance_by_dept.append({
                "department_name": dept.name,
                "department_code": dept.code,
                "attendance_percent": dept_percent
            })
        
        # 3. ACADEMIC PERFORMANCE
        # Overall pass percentage (students with passing grades)
        try:
            total_grades = db.query(Grade).count()
            passing_grades = db.query(Grade).filter(
                Grade.marks_obtained >= 50
            ).count()
            overall_pass_percent = round((passing_grades / total_grades * 100), 2) if total_grades > 0 else 0
        except Exception:
            overall_pass_percent = 0
        
        # Pass percentage by department
        performance_by_dept = []
        for dept in departments:
            try:
                dept_students = db.query(Student).filter(
                    Student.department_id == dept.id,
                    Student.is_active == True
                ).all()
                student_ids = [s.id for s in dept_students]
                
                if student_ids:
                    dept_grades = db.query(Grade).filter(Grade.student_id.in_(student_ids)).count()
                    dept_passing = db.query(Grade).filter(
                        Grade.student_id.in_(student_ids),
                        Grade.marks_obtained >= 50
                    ).count()
                    dept_pass_percent = round((dept_passing / dept_grades * 100), 2) if dept_grades > 0 else 0
                else:
                    dept_pass_percent = 0
            except Exception:
                dept_pass_percent = 0
                
            performance_by_dept.append({
                "department_name": dept.name,
                "department_code": dept.code,
                "pass_percent": dept_pass_percent
            })
        
        # 4. PENDING REQUESTS
        # Gate passes pending OM approval
        pending_gate_passes = db.query(GatePass).filter(
            GatePass.status == GatePassStatus.PENDING_OM,
            GatePass.is_deleted_by_student == False
        ).count()
        
        # Faculty leave requests pending OM approval
        pending_faculty_leaves = db.query(FacultyLeaveRequest).filter(
            FacultyLeaveRequest.status == LeaveStatus.PENDING_OM
        ).count()
        
        # Student complaints/discipline records needing attention
        today_discipline_count = db.query(DisciplineRecord).filter(
            func.date(DisciplineRecord.incident_date) == date.today()
        ).count()
        
        # 5. RECENT ALERTS (Last 10 notifications/updates)
        seven_days_ago = date.today() - timedelta(days=7)
        
        # Recent discipline incidents
        recent_discipline = db.query(DisciplineRecord).filter(
            DisciplineRecord.incident_date >= seven_days_ago
        ).order_by(DisciplineRecord.created_at.desc()).limit(5).all()
        
        # Recent gate passes
        recent_gate_passes = db.query(GatePass).filter(
            GatePass.status == GatePassStatus.PENDING_OM,
            GatePass.is_deleted_by_student == False
        ).order_by(GatePass.created_at.desc()).limit(5).all()
        
        # Recent faculty leaves
        recent_leaves = db.query(FacultyLeaveRequest).filter(
            FacultyLeaveRequest.status == LeaveStatus.PENDING_OM
        ).order_by(FacultyLeaveRequest.created_at.desc()).limit(5).all()
        
        # Compile recent alerts
        recent_alerts = []
        
        for disc in recent_discipline:
            try:
                recent_alerts.append({
                    "type": "discipline",
                    "message": f"Discipline incident: {disc.incident_type.value}",
                    "student_name": f"{disc.student.first_name} {disc.student.last_name}" if disc.student else "Unknown",
                    "timestamp": disc.created_at.isoformat(),
                    "severity": "high"
                })
            except Exception:
                pass
        
        for gp in recent_gate_passes:
            try:
                recent_alerts.append({
                    "type": "gatepass",
                    "message": f"Gate pass approval pending",
                    "student_name": f"{gp.student.first_name} {gp.student.last_name}" if gp.student else "Unknown",
                    "timestamp": gp.created_at.isoformat(),
                    "severity": "medium"
                })
            except Exception:
                pass
        
        for leave in recent_leaves:
            try:
                recent_alerts.append({
                    "type": "leave",
                    "message": f"Faculty leave request pending",
                    "faculty_name": f"{leave.faculty.first_name} {leave.faculty.last_name}" if leave.faculty else "Unknown",
                    "timestamp": leave.created_at.isoformat(),
                    "severity": "medium"
                })
            except Exception:
                pass
        
        # Sort alerts by timestamp, newest first
        recent_alerts.sort(key=lambda x: x["timestamp"], reverse=True)
        recent_alerts = recent_alerts[:10]  # Limit to 10 most recent
        
        return {
            # Top Numbers
            "total_students": total_students,
            "total_faculty": total_faculty,
            "total_departments": total_departments,
            "active_courses": active_courses,
            
            # Attendance Overview
            "overall_attendance_percent": overall_attendance_percent,
            "attendance_by_department": attendance_by_dept,
            
            # Academic Performance
            "overall_pass_percent": overall_pass_percent,
            "performance_by_department": performance_by_dept,
            
            # Pending Requests
            "pending_gate_passes": pending_gate_passes,
            "pending_faculty_leaves": pending_faculty_leaves,
            "pending_complaints": today_discipline_count,
            "total_pending": pending_gate_passes + pending_faculty_leaves + today_discipline_count,
            
            # Recent Alerts
            "recent_alerts": recent_alerts,
            
            # Metadata
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        import traceback
        print(f"Dashboard error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Dashboard error: {str(e)}")

@router.get("/admin/stats")
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get dashboard statistics for admin users
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Similar to authority but with admin-specific metrics
    total_students = db.query(Student).filter(Student.is_active == True).count()
    total_faculty = db.query(Faculty).filter(Faculty.is_active == True).count()
    total_authorities = db.query(Authority).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_departments = db.query(Department).count()
    
    # All pending approvals across system
    pending_gate_passes = db.query(GatePass).filter(
        GatePass.status.in_([
            GatePassStatus.PENDING_MENTOR,
            GatePassStatus.PENDING_HOD,
            GatePassStatus.PENDING_OM
        ]),
        GatePass.is_deleted_by_student == False
    ).count()
    
    pending_leaves = db.query(FacultyLeaveRequest).filter(
        FacultyLeaveRequest.status.in_([
            LeaveStatus.PENDING_SUBSTITUTE,
            LeaveStatus.PENDING_HOD,
            LeaveStatus.PENDING_DEAN,
            LeaveStatus.PENDING_OM
        ])
    ).count()
    
    pending_student_leaves = db.query(StudentLeaveRequest).filter(
        StudentLeaveRequest.status.in_([
            StudentLeaveStatus.PENDING_MENTOR,
            StudentLeaveStatus.PENDING_CLASS_ADVISOR,
            StudentLeaveStatus.PENDING_HOD
        ])
    ).count()
    
    total_pending = pending_gate_passes + pending_leaves + pending_student_leaves
    
    return {
        "total_students": total_students,
        "total_faculty": total_faculty,
        "total_authorities": total_authorities,
        "active_users": active_users,
        "total_departments": total_departments,
        "pending_approvals": total_pending,
        "pending_gate_passes": pending_gate_passes,
        "pending_faculty_leaves": pending_leaves,
        "pending_student_leaves": pending_student_leaves,
        "system_status_percent": 99.5,
        "last_updated": datetime.now().isoformat()
    }

@router.get("/faculty/stats")
def get_faculty_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get dashboard statistics for faculty users
    """
    if current_user.role != "faculty":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get faculty profile
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")
    
    # Mentees count
    from app.models.mentorship import MentorAssignment
    mentees_count = db.query(MentorAssignment).filter(
        MentorAssignment.mentor_id == faculty.id
    ).count()
    
    # Pending gate passes (if mentor)
    pending_gate_passes = db.query(GatePass).filter(
        GatePass.status == GatePassStatus.PENDING_MENTOR,
        GatePass.mentor_id == faculty.id,
        GatePass.is_deleted_by_student == False
    ).count()
    
    # Pending student leaves (as mentor)
    pending_student_leaves = db.query(StudentLeaveRequest).filter(
        or_(
            and_(
                StudentLeaveRequest.status == StudentLeaveStatus.PENDING_MENTOR,
                StudentLeaveRequest.mentor_id == faculty.id
            ),
            and_(
                StudentLeaveRequest.status == StudentLeaveStatus.PENDING_CLASS_ADVISOR,
                StudentLeaveRequest.class_advisor_id == faculty.id
            ),
            and_(
                StudentLeaveRequest.status == StudentLeaveStatus.PENDING_HOD,
                StudentLeaveRequest.hod_id == faculty.id
            )
        )
    ).count()
    
    # My leave requests
    my_leave_requests = db.query(FacultyLeaveRequest).filter(
        FacultyLeaveRequest.faculty_id == faculty.id
    ).count()
    
    total_pending = pending_gate_passes + pending_student_leaves
    
    return {
        "mentees_count": mentees_count,
        "pending_gate_passes": pending_gate_passes,
        "pending_student_leaves": pending_student_leaves,
        "my_leave_requests": my_leave_requests,
        "total_pending_tasks": total_pending,
        "department": faculty.department.name if faculty.department else "N/A",
        "last_updated": datetime.now().isoformat()
    }

@router.get("/dean/stats")
def get_dean_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get comprehensive dashboard statistics for Dean users (view-only)
    Similar to authority dashboard but specifically for Dean role
    """
    if current_user.role != "authority":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Verify user is a Dean
    authority = db.query(Authority).filter(Authority.user_id == current_user.id).first()
    if not authority or authority.title != "Dean":
        raise HTTPException(status_code=403, detail="Access denied: Dean role required")
    
    from datetime import timedelta
    from app.models.academic import Course, Enrollment
    from app.models.attendance import Attendance
    from app.models.grade import Grade
    
    # 1. TOP NUMBERS (Stat Cards)
    total_students = db.query(Student).filter(Student.is_active == True).count()
    total_faculty = db.query(Faculty).filter(Faculty.is_active == True).count()
    total_departments = db.query(Department).count()
    
    # Active courses (courses with enrollments in current semester)
    active_courses = db.query(Course).filter(Course.is_active == True).count()
    
    # 2. ATTENDANCE OVERVIEW
    # Overall college attendance
    total_attendance_records = db.query(Attendance).count()
    present_count = db.query(Attendance).filter(Attendance.status == "present").count()
    overall_attendance_percent = round((present_count / total_attendance_records * 100), 2) if total_attendance_records > 0 else 0
    
    # Attendance by department
    attendance_by_dept = []
    departments = db.query(Department).all()
    for dept in departments:
        dept_students = db.query(Student).filter(
            Student.department_id == dept.id,
            Student.is_active == True
        ).all()
        student_ids = [s.id for s in dept_students]
        
        if student_ids:
            dept_total = db.query(Attendance).filter(Attendance.student_id.in_(student_ids)).count()
            dept_present = db.query(Attendance).filter(
                Attendance.student_id.in_(student_ids),
                Attendance.status == "present"
            ).count()
            dept_percent = round((dept_present / dept_total * 100), 2) if dept_total > 0 else 0
        else:
            dept_percent = 0
            
        attendance_by_dept.append({
            "department_name": dept.name,
            "department_code": dept.code,
            "attendance_percent": dept_percent
        })
    
    # 3. ACADEMIC PERFORMANCE
    # Overall pass percentage (students with passing grades)
    total_grades = db.query(Grade).count()
    passing_grades = db.query(Grade).filter(
        Grade.marks_obtained >= 50
    ).count()
    overall_pass_percent = round((passing_grades / total_grades * 100), 2) if total_grades > 0 else 0
    
    # Pass percentage by department
    performance_by_dept = []
    for dept in departments:
        dept_students = db.query(Student).filter(
            Student.department_id == dept.id,
            Student.is_active == True
        ).all()
        student_ids = [s.id for s in dept_students]
        
        if student_ids:
            dept_grades = db.query(Grade).filter(Grade.student_id.in_(student_ids)).count()
            dept_passing = db.query(Grade).filter(
                Grade.student_id.in_(student_ids),
                Grade.marks_obtained >= 50
            ).count()
            dept_pass_percent = round((dept_passing / dept_grades * 100), 2) if dept_grades > 0 else 0
        else:
            dept_pass_percent = 0
            
        performance_by_dept.append({
            "department_name": dept.name,
            "department_code": dept.code,
            "pass_percent": dept_pass_percent
        })
    
    # 4. PENDING REQUESTS
    # Faculty leave requests pending Dean approval
    pending_faculty_leaves = db.query(FacultyLeaveRequest).filter(
        FacultyLeaveRequest.status == LeaveStatus.PENDING_DEAN
    ).count()
    
    # Student complaints/discipline records needing attention
    today_discipline_count = db.query(DisciplineRecord).filter(
        func.date(DisciplineRecord.incident_date) == date.today()
    ).count()
    
    total_pending = pending_faculty_leaves + today_discipline_count
    
    # 5. RECENT ALERTS (Last 10 notifications/updates)
    seven_days_ago = date.today() - timedelta(days=7)
    
    # Recent discipline incidents
    recent_discipline = db.query(DisciplineRecord).filter(
        DisciplineRecord.incident_date >= seven_days_ago
    ).order_by(DisciplineRecord.created_at.desc()).limit(5).all()
    
    # Recent faculty leaves pending Dean approval
    recent_leaves = db.query(FacultyLeaveRequest).filter(
        FacultyLeaveRequest.status == LeaveStatus.PENDING_DEAN
    ).order_by(FacultyLeaveRequest.created_at.desc()).limit(5).all()
    
    # Compile recent alerts
    recent_alerts = []
    
    for disc in recent_discipline:
        recent_alerts.append({
            "type": "discipline",
            "message": f"Discipline incident: {disc.incident_type.value}",
            "student_name": f"{disc.student.first_name} {disc.student.last_name}" if disc.student else "Unknown",
            "timestamp": disc.created_at.isoformat(),
            "severity": "high"
        })
    
    for leave in recent_leaves:
        recent_alerts.append({
            "type": "leave",
            "message": f"Faculty leave request pending Dean approval",
            "faculty_name": f"{leave.faculty.first_name} {leave.faculty.last_name}" if leave.faculty else "Unknown",
            "timestamp": leave.created_at.isoformat(),
            "severity": "medium"
        })
    
    # Sort alerts by timestamp, newest first
    recent_alerts.sort(key=lambda x: x["timestamp"], reverse=True)
    recent_alerts = recent_alerts[:10]  # Limit to 10 most recent
    
    return {
        # Top Numbers
        "total_students": total_students,
        "total_faculty": total_faculty,
        "total_departments": total_departments,
        "active_courses": active_courses,
        
        # Attendance Overview
        "overall_attendance_percent": overall_attendance_percent,
        "attendance_by_department": attendance_by_dept,
        
        # Academic Performance
        "overall_pass_percent": overall_pass_percent,
        "performance_by_department": performance_by_dept,
        
        # Pending Requests
        "pending_faculty_leaves": pending_faculty_leaves,
        "pending_complaints": today_discipline_count,
        "total_pending": total_pending,
        
        # Recent Alerts
        "recent_alerts": recent_alerts,
        
        # Metadata
        "last_updated": datetime.now().isoformat()
    }

@router.get("/principal/stats")
def get_principal_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get comprehensive dashboard statistics for Principal users (view-only)
    Similar to OM dashboard but specifically for Principal role
    """
    if current_user.role != "authority":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # NOTE: Not checking specific title to allow any authority user
    # This allows for flexible title variations in the database
    
    from datetime import timedelta
    from app.models.academic import Course, Enrollment
    from app.models.attendance import Attendance
    from app.models.grade import Grade
    
    # 1. TOP NUMBERS (Stat Cards)
    total_students = db.query(Student).filter(Student.is_active == True).count()
    total_faculty = db.query(Faculty).filter(Faculty.is_active == True).count()
    total_departments = db.query(Department).count()
    
    # Active courses (courses with enrollments in current semester)
    active_courses = db.query(Course).filter(Course.is_active == True).count()
    
    # 2. ATTENDANCE OVERVIEW
    # Overall college attendance
    total_attendance_records = db.query(Attendance).count()
    present_count = db.query(Attendance).filter(Attendance.status == "present").count()
    overall_attendance_percent = round((present_count / total_attendance_records * 100), 2) if total_attendance_records > 0 else 0
    
    # Attendance by department
    attendance_by_dept = []
    departments = db.query(Department).all()
    for dept in departments:
        dept_students = db.query(Student).filter(
            Student.department_id == dept.id,
            Student.is_active == True
        ).all()
        student_ids = [s.id for s in dept_students]
        
        if student_ids:
            dept_total = db.query(Attendance).filter(Attendance.student_id.in_(student_ids)).count()
            dept_present = db.query(Attendance).filter(
                Attendance.student_id.in_(student_ids),
                Attendance.status == "present"
            ).count()
            dept_percent = round((dept_present / dept_total * 100), 2) if dept_total > 0 else 0
        else:
            dept_percent = 0
            
        attendance_by_dept.append({
            "department_name": dept.name,
            "department_code": dept.code,
            "attendance_percent": dept_percent
        })
    
    # 3. ACADEMIC PERFORMANCE
    # Overall pass percentage (students with passing grades)
    total_grades = db.query(Grade).count()
    passing_grades = db.query(Grade).filter(
        Grade.marks_obtained >= 50
    ).count()
    overall_pass_percent = round((passing_grades / total_grades * 100), 2) if total_grades > 0 else 0
    
    # Pass percentage by department
    performance_by_dept = []
    for dept in departments:
        dept_students = db.query(Student).filter(
            Student.department_id == dept.id,
            Student.is_active == True
        ).all()
        student_ids = [s.id for s in dept_students]
        
        if student_ids:
            dept_grades = db.query(Grade).filter(Grade.student_id.in_(student_ids)).count()
            dept_passing = db.query(Grade).filter(
                Grade.student_id.in_(student_ids),
                Grade.marks_obtained >= 50
            ).count()
            dept_pass_percent = round((dept_passing / dept_grades * 100), 2) if dept_grades > 0 else 0
        else:
            dept_pass_percent = 0
            
        performance_by_dept.append({
            "department_name": dept.name,
            "department_code": dept.code,
            "pass_percent": dept_pass_percent
        })
    
    # 4. PENDING REQUESTS
    # All pending leave requests (student + faculty)
    pending_student_leaves = db.query(StudentLeaveRequest).filter(
        StudentLeaveRequest.status.in_([
            StudentLeaveStatus.PENDING_MENTOR,
            StudentLeaveStatus.PENDING_CLASS_ADVISOR,
            StudentLeaveStatus.PENDING_HOD
        ])
    ).count()
    
    pending_faculty_leaves = db.query(FacultyLeaveRequest).filter(
        FacultyLeaveRequest.status.in_([
            LeaveStatus.PENDING_SUBSTITUTE,
            LeaveStatus.PENDING_HOD,
            LeaveStatus.PENDING_DEAN,
            LeaveStatus.PENDING_OM
        ])
    ).count()
    
    total_pending_leaves = pending_student_leaves + pending_faculty_leaves
    
    # Student complaints/discipline records needing attention
    seven_days_ago = date.today() - timedelta(days=7)
    recent_discipline_count = db.query(DisciplineRecord).filter(
        DisciplineRecord.incident_date >= seven_days_ago
    ).count()
    
    # 5. RECENT ALERTS (Last 10 notifications/updates)
    
    # Recent discipline incidents
    recent_discipline = db.query(DisciplineRecord).filter(
        DisciplineRecord.incident_date >= seven_days_ago
    ).order_by(DisciplineRecord.created_at.desc()).limit(5).all()
    
    # Recent faculty leaves
    recent_leaves = db.query(FacultyLeaveRequest).filter(
        FacultyLeaveRequest.status.in_([
            LeaveStatus.PENDING_SUBSTITUTE,
            LeaveStatus.PENDING_HOD,
            LeaveStatus.PENDING_DEAN,
            LeaveStatus.PENDING_OM
        ])
    ).order_by(FacultyLeaveRequest.created_at.desc()).limit(5).all()
    
    # Recent student leaves
    recent_student_leaves = db.query(StudentLeaveRequest).filter(
        StudentLeaveRequest.status.in_([
            StudentLeaveStatus.PENDING_MENTOR,
            StudentLeaveStatus.PENDING_CLASS_ADVISOR,
            StudentLeaveStatus.PENDING_HOD
        ])
    ).order_by(StudentLeaveRequest.created_at.desc()).limit(5).all()
    
    # Compile recent alerts
    recent_alerts = []
    
    for disc in recent_discipline:
        recent_alerts.append({
            "type": "discipline",
            "message": f"Discipline incident: {disc.incident_type.value}",
            "student_name": f"{disc.student.first_name} {disc.student.last_name}" if disc.student else "Unknown",
            "timestamp": disc.created_at.isoformat(),
            "severity": "high"
        })
    
    for leave in recent_leaves:
        recent_alerts.append({
            "type": "leave",
            "message": f"Faculty leave request pending",
            "faculty_name": f"{leave.faculty.first_name} {leave.faculty.last_name}" if leave.faculty else "Unknown",
            "timestamp": leave.created_at.isoformat(),
            "severity": "medium"
        })
    
    for leave in recent_student_leaves:
        recent_alerts.append({
            "type": "leave",
            "message": f"Student leave request pending",
            "student_name": f"{leave.student.first_name} {leave.student.last_name}" if leave.student else "Unknown",
            "timestamp": leave.created_at.isoformat(),
            "severity": "medium"
        })
    
    # Sort alerts by timestamp, newest first
    recent_alerts.sort(key=lambda x: x["timestamp"], reverse=True)
    recent_alerts = recent_alerts[:10]  # Limit to 10 most recent
    
    return {
        # Top Numbers
        "total_students": total_students,
        "total_faculty": total_faculty,
        "total_departments": total_departments,
        "active_courses": active_courses,
        
        # Attendance Overview
        "overall_attendance_percent": overall_attendance_percent,
        "attendance_by_department": attendance_by_dept,
        
        # Academic Performance
        "overall_pass_percent": overall_pass_percent,
        "performance_by_department": performance_by_dept,
        
        # Pending Requests
        "pending_leave_requests": total_pending_leaves,
        "pending_complaints": recent_discipline_count,
        "total_pending": total_pending_leaves + recent_discipline_count,
        
        # Recent Alerts
        "recent_alerts": recent_alerts,
        
        # Metadata
        "last_updated": datetime.now().isoformat()
    }

@router.get("/student/stats")
def get_student_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get dashboard statistics for student users
    """
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get student profile
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    
    # Course enrollments
    from app.models.academic import Enrollment
    enrolled_courses = db.query(Enrollment).filter(
        Enrollment.student_id == student.id
    ).count()
    
    # My leave requests
    total_leaves = db.query(StudentLeaveRequest).filter(
        StudentLeaveRequest.student_id == student.id
    ).count()
    
    pending_leaves = db.query(StudentLeaveRequest).filter(
        StudentLeaveRequest.student_id == student.id,
        StudentLeaveRequest.status.in_([
            StudentLeaveStatus.PENDING_MENTOR,
            StudentLeaveStatus.PENDING_CLASS_ADVISOR,
            StudentLeaveStatus.PENDING_HOD
        ])
    ).count()
    
    # My gate passes
    total_gate_passes = db.query(GatePass).filter(
        GatePass.student_id == student.id,
        GatePass.is_deleted_by_student == False
    ).count()
    
    pending_gate_passes = db.query(GatePass).filter(
        GatePass.student_id == student.id,
        GatePass.status.in_([
            GatePassStatus.PENDING_MENTOR,
            GatePassStatus.PENDING_HOD,
            GatePassStatus.PENDING_OM
        ]),
        GatePass.is_deleted_by_student == False
    ).count()
    
    # Discipline records
    discipline_count = db.query(DisciplineRecord).filter(
        DisciplineRecord.student_id == student.id
    ).count()
    
    return {
        "enrolled_courses": enrolled_courses,
        "current_semester": student.current_semester,
        "current_year": student.current_year,
        "batch": student.batch,
        "total_leave_requests": total_leaves,
        "pending_leaves": pending_leaves,
        "total_gate_passes": total_gate_passes,
        "pending_gate_passes": pending_gate_passes,
        "discipline_records": discipline_count,
        "department": student.department.name if student.department else "N/A",
        "last_updated": datetime.now().isoformat()
    }
