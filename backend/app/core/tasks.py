import asyncio
import logging
from datetime import datetime, time as datetime_time, timedelta, date as date_type
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.faculty import Faculty
from app.models.leave import FacultyLeaveRequest, LeaveStatus
from app.models.attendance import FacultyAttendance, FacultyAttendanceStatus

logger = logging.getLogger(__name__)

def process_daily_faculty_attendance(db: Session, target_date: date_type = None):
    """
    Process daily attendance for all active faculty members.
    Marks them as ON_LEAVE if they have an approved leave for the day,
    otherwise marks them as PRESENT.
    """
    if target_date is None:
        target_date = date_type.today()

    logger.info(f"Processing faculty attendance for date: {target_date}")

    # Get all faculty
    all_faculty = db.query(Faculty).all()
    
    # Get all approved leaves that cover target_date
    approved_leaves = db.query(FacultyLeaveRequest).filter(
        FacultyLeaveRequest.status == LeaveStatus.APPROVED,
        FacultyLeaveRequest.from_date <= target_date,
        FacultyLeaveRequest.to_date >= target_date
    ).all()
    
    # Create a mapping of faculty_id -> leave_request_id for fast lookup
    leave_map = {leave.faculty_id: leave.id for leave in approved_leaves}

    records_processed = 0
    for faculty in all_faculty:
        # Check if they already have an attendance record for today (prevent duplicates)
        existing = db.query(FacultyAttendance).filter(
            FacultyAttendance.faculty_id == faculty.id,
            FacultyAttendance.date == target_date
        ).first()
        
        if existing:
            continue
            
        leave_id = leave_map.get(faculty.id)
        
        new_attendance = FacultyAttendance(
            faculty_id=faculty.id,
            date=target_date,
            status=FacultyAttendanceStatus.on_leave if leave_id else FacultyAttendanceStatus.present,
            leave_request_id=leave_id
        )
        db.add(new_attendance)
        records_processed += 1

    db.commit()
    logger.info(f"Successfully processed attendance for {records_processed} faculty members.")


async def faculty_attendance_job():
    """
    Background job that runs indefinitely.
    Checks the time every minute and runs process_daily_faculty_attendance at 08:00 AM.
    """
    logger.info("Faculty Attendance Job started. Waiting for 08:00 AM daily...")
    while True:
        now = datetime.now()
        
        # Check if it's 8:00 AM (hour=8, minute=0)
        if now.hour == 8 and now.minute == 0:
            logger.info("Triggering daily faculty attendance task (08:00 AM)")
            db = SessionLocal()
            try:
                process_daily_faculty_attendance(db, now.date())
            except Exception as e:
                logger.error(f"Error processing faculty attendance: {e}")
            finally:
                db.close()
                
            # Sleep for 61 seconds to ensure we don't trigger again in the same minute
            await asyncio.sleep(61)
        else:
            # Sleep for 30 seconds before checking again
            await asyncio.sleep(30)
