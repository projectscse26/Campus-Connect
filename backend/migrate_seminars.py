"""
Migration: Create seminars table

Run once from the backend directory:
    python migrate_seminars.py
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import engine

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS seminars (
    id                    SERIAL PRIMARY KEY,
    course_assignment_id  INTEGER NOT NULL REFERENCES course_assignments(id) ON DELETE CASCADE,
    student_id            INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    seminar_date          DATE,
    seminar_topic         TEXT,
    marks_obtained        NUMERIC(6, 2),
    max_marks             NUMERIC(6, 2) NOT NULL DEFAULT 100,
    is_topic_published    BOOLEAN NOT NULL DEFAULT FALSE,
    is_marks_published    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ,
    CONSTRAINT uq_seminar_student UNIQUE (course_assignment_id, student_id)
);
"""

CREATE_INDEXES_SQL = [
    "CREATE INDEX IF NOT EXISTS ix_seminars_student_id ON seminars (student_id);",
    "CREATE INDEX IF NOT EXISTS ix_seminars_course_assignment_id ON seminars (course_assignment_id);",
]

def migrate():
    with engine.connect() as conn:
        try:
            print("Creating seminars table...")
            conn.execute(text(CREATE_TABLE_SQL))
            for idx_sql in CREATE_INDEXES_SQL:
                conn.execute(text(idx_sql))
            conn.commit()
            print("Migration complete: seminars table is ready.")
        except Exception as e:
            print(f"Migration failed: {e}")
            raise

if __name__ == "__main__":
    migrate()
