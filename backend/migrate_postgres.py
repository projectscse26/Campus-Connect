import sys
import os

# Add the backend directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import engine

def migrate():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE gate_passes ADD COLUMN is_deleted_by_student BOOLEAN DEFAULT FALSE;"))
            conn.commit()
            print("Successfully added is_deleted_by_student column.")
        except Exception as e:
            print(f"Error executing migration: {e}")

if __name__ == "__main__":
    migrate()
