import sys
from sqlalchemy import text
from app.core.database import engine

def migrate():
    print("Running migration to add new columns to faculty_leave_balances...")
    new_cols = [
        ("restricted_leaves_total", "INTEGER DEFAULT 2"),
        ("restricted_leaves_used", "INTEGER DEFAULT 0"),
        ("vacation_leaves_total", "INTEGER DEFAULT 14"),
        ("vacation_leaves_used", "INTEGER DEFAULT 0"),
        ("compensation_leaves_total", "INTEGER DEFAULT 5"),
        ("compensation_leaves_used", "INTEGER DEFAULT 0"),
        ("academic_leaves_total", "INTEGER DEFAULT 10"),
        ("academic_leaves_used", "INTEGER DEFAULT 0"),
    ]
    
    with engine.begin() as conn:
        for col_name, col_type in new_cols:
            try:
                conn.execute(text(f"ALTER TABLE faculty_leave_balances ADD COLUMN {col_name} {col_type};"))
                print(f"Added column {col_name} successfully.")
            except Exception as e:
                print(f"Column {col_name} not added (might already exist).")
        
        # Alter casual_leaves_total default if postgres
        try:
            conn.execute(text("ALTER TABLE faculty_leave_balances ALTER COLUMN casual_leaves_total SET DEFAULT 12;"))
            print("Updated casual_leaves_total default to 12.")
        except Exception as e:
            print("Note: Could not alter casual_leaves_total default.")

if __name__ == "__main__":
    migrate()
