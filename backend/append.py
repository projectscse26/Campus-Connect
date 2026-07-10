code = '''

# ----------------------------------------------------------------------
# FACULTY ATTENDANCE
# ----------------------------------------------------------------------

@router.get("/me/my-attendance")
def get_my_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get the daily attendance records for the currently logged in faculty member.
    """
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")
        
    from app.models.attendance import FacultyAttendance
    from sqlalchemy.orm import joinedload
    
    records = db.query(FacultyAttendance).options(
        joinedload(FacultyAttendance.leave_request)
    ).filter(
        FacultyAttendance.faculty_id == faculty.id
    ).order_by(FacultyAttendance.date.desc()).all()
    
    return {
        "faculty_id": faculty.id,
        "name": f"{faculty.first_name} {faculty.last_name}",
        "attendance": [
            {
                "id": r.id,
                "date": r.date.strftime("%Y-%m-%d"),
                "status": r.status.value,
                "leave_type": r.leave_request.leave_type.value if r.leave_request else None
            } for r in records
        ]
    }

@router.post("/trigger-daily-attendance")
def trigger_daily_faculty_attendance(
    target_date: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Manually trigger the daily faculty attendance job.
    Only available to HOD or Admin for testing.
    """
    if current_user.role not in ["hod", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    from app.core.tasks import process_daily_faculty_attendance
    from datetime import datetime
    
    date_obj = None
    if target_date:
        try:
            date_obj = datetime.strptime(target_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
            
    process_daily_faculty_attendance(db, target_date=date_obj)
    
    return {"status": "success", "message": f"Successfully processed attendance for {target_date or 'today'}"}
'''

with open(r'c:\\Users\\SYS5\\Desktop\\Campus-Connect\\backend\\app\\api\\faculty.py', 'a') as f:
    f.write(code)
