import logging
from sqlalchemy import text
from app.core.database import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    with engine.connect() as conn:
        logger.info("Creating faculty_attendance_status enum if not exists...")
        conn.execute(text("DROP TYPE IF EXISTS facultyattendancestatus CASCADE"))
        conn.execute(text("CREATE TYPE facultyattendancestatus AS ENUM ('present', 'absent', 'on_leave')"))
        
        logger.info("Creating faculty_attendance table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS faculty_attendance (
                id SERIAL PRIMARY KEY,
                faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
                date DATE NOT NULL,
                status facultyattendancestatus NOT NULL DEFAULT 'present',
                leave_request_id INTEGER REFERENCES faculty_leave_requests(id) ON DELETE SET NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT uq_faculty_date UNIQUE(faculty_id, date)
            )
        """))
        
        # Add index for faster lookups
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_faculty_attendance_date ON faculty_attendance(date)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_faculty_attendance_faculty_id ON faculty_attendance(faculty_id)"))
        
        conn.commit()
        logger.info("Migration completed successfully.")

if __name__ == "__main__":
    migrate()
