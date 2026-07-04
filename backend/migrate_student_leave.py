"""
Migration: Create student_leave_requests table
Run from the backend/ directory:
    python migrate_student_leave.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import engine, Base
from app.models.leave import StudentLeaveRequest   # registers the model

def run():
    print("Creating student_leave_requests table…")
    Base.metadata.create_all(bind=engine, tables=[StudentLeaveRequest.__table__])
    print("Done.")

if __name__ == "__main__":
    run()
