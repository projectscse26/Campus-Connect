"""
Migration: Fix model_exam enum value case in PostgreSQL

The gradetype enum has 'model_exam' (lowercase) but SQLAlchemy sends 'MODEL_EXAM'
(uppercase, matching the Python enum member name). This migration renames the
enum value to match so Model Exam grades can be saved and queried.

Run once:
    python migrate_model_exam_enum.py
"""

import sys
sys.path.append('.')
from sqlalchemy import text
from app.core.database import engine


def migrate():
    with engine.connect() as conn:
        try:
            print("Renaming enum value 'model_exam' → 'MODEL_EXAM'...")
            conn.execute(text("ALTER TYPE gradetype RENAME VALUE 'model_exam' TO 'MODEL_EXAM'"))
            conn.commit()
            print("Done. Model Exam grades will now save and query correctly.")
        except Exception as e:
            print(f"Error: {e}")
            print("(If already renamed, this is safe to ignore)")


if __name__ == "__main__":
    migrate()
