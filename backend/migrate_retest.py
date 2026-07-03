"""
Migration: Create retest_marks table

Run once from the backend directory:
    python migrate_retest.py

Creates the retest_marks table with all required columns and constraints.
Safe to run multiple times — uses CREATE TABLE IF NOT EXISTS.
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import engine


CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS retest_marks (
    id              SERIAL PRIMARY KEY,
    grade_id        INTEGER NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    student_id      INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id       INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    marks_obtained  NUMERIC(6, 2),
    max_marks       NUMERIC(6, 2) NOT NULL,
    entered_by_id   INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
    remarks         TEXT,
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ,
    CONSTRAINT uq_retest_grade_student UNIQUE (grade_id, student_id)
);
"""

CREATE_INDEXES_SQL = [
    "CREATE INDEX IF NOT EXISTS ix_retest_marks_student_id ON retest_marks (student_id);",
    "CREATE INDEX IF NOT EXISTS ix_retest_marks_course_id  ON retest_marks (course_id);",
    "CREATE INDEX IF NOT EXISTS ix_retest_marks_grade_id   ON retest_marks (grade_id);",
]


def migrate():
    with engine.connect() as conn:
        try:
            print("Creating retest_marks table...")
            conn.execute(text(CREATE_TABLE_SQL))
            for idx_sql in CREATE_INDEXES_SQL:
                conn.execute(text(idx_sql))
            conn.commit()
            print("Migration complete: retest_marks table is ready.")
        except Exception as e:
            print(f"Migration failed: {e}")
            raise


if __name__ == "__main__":
    migrate()
