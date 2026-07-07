import os
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:admin@localhost:5432/campus_connect"

def add_columns():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE students ADD COLUMN religion VARCHAR(100)"))
            print("Added religion to students.")
        except Exception as e:
            print(f"Error adding to students: {e}")

        try:
            conn.execute(text("ALTER TABLE faculty ADD COLUMN religion VARCHAR(100)"))
            print("Added religion to faculty.")
        except Exception as e:
            print(f"Error adding to faculty: {e}")
            
        conn.commit()

if __name__ == "__main__":
    add_columns()
