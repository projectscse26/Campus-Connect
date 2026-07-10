"""
Migration: Create assignment_grades table

Run once from the backend directory:
    python migrate_assignment_grades.py
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import engine

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS assignment_grades (
    id              SERIAL PRIMARY KEY,
    assignment_id   INTEGER NOT NULL REFERENCES lms_resources(id) ON DELETE CASCADE,
    student_id      INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained  NUMERIC(6, 2),
    max_marks       NUMERIC(6, 2) NOT NULL DEFAULT 100,
    is_absent       BOOLEAN NOT NULL DEFAULT FALSE,
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,
    remarks         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ,
    CONSTRAINT uq_assignment_grade_student UNIQUE (assignment_id, student_id)
);
"""

CREATE_INDEXES_SQL = [
    "CREATE INDEX IF NOT EXISTS ix_assignment_grades_student_id ON assignment_grades (student_id);",
    "CREATE INDEX IF NOT EXISTS ix_assignment_grades_assignment_id ON assignment_grades (assignment_id);",
]

def migrate():
    with engine.connect() as conn:
        try:
            print("Creating assignment_grades table...")
            conn.execute(text(CREATE_TABLE_SQL))
            for idx_sql in CREATE_INDEXES_SQL:
                conn.execute(text(idx_sql))
            conn.commit()
            print("Migration complete: assignment_grades table is ready.")
        except Exception as e:
            print(f"Migration failed: {e}")
            raise

if __name__ == "__main__":
    migrate()
