"""
Migration script to add viewed tracking columns for GatePass and StudentLeaveRequest.
"""

import sys
from sqlalchemy import create_engine, text
from app.core.config import get_settings

def migrate():
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL)
    
    # SQL queries to add viewed tracking columns to gate_passes and student_leave_requests
    sql_statements = [
        # Gate passes
        "ALTER TABLE gate_passes ADD COLUMN IF NOT EXISTS viewed_by_mentor BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE gate_passes ADD COLUMN IF NOT EXISTS viewed_by_hod BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE gate_passes ADD COLUMN IF NOT EXISTS viewed_by_om BOOLEAN DEFAULT FALSE;",
        
        # Student leave requests
        "ALTER TABLE student_leave_requests ADD COLUMN IF NOT EXISTS viewed_by_mentor BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE student_leave_requests ADD COLUMN IF NOT EXISTS viewed_by_ca BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE student_leave_requests ADD COLUMN IF NOT EXISTS viewed_by_hod BOOLEAN DEFAULT FALSE;"
    ]
    
    try:
        with engine.connect() as conn:
            for sql in sql_statements:
                conn.execute(text(sql))
            conn.commit()
            print("Successfully added viewed tracking columns to gate_passes and student_leave_requests tables.")
    except Exception as e:
        print(f"Error during migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("Starting Unseen Requests Notifications update migration...")
    migrate()
