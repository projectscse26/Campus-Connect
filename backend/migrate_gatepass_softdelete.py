import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), 'campus_connect.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Add column if it doesn't exist
        cursor.execute("ALTER TABLE gate_passes ADD COLUMN is_deleted_by_student BOOLEAN DEFAULT 0;")
        print("Successfully added is_deleted_by_student column.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Column already exists.")
        else:
            print(f"Error: {e}")
            
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
