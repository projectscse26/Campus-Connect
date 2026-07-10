import os
from sqlalchemy import create_engine, text
from app.core.config import get_settings

settings = get_settings()
engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE students ADD COLUMN aadhar_number VARCHAR(12);"))
        print("Added aadhar_number")
    except Exception as e:
        print("Error on aadhar_number:", e)
        
    try:
        conn.execute(text("ALTER TABLE students ADD COLUMN accommodation VARCHAR(50);"))
        print("Added accommodation")
    except Exception as e:
        print("Error on accommodation:", e)
        
    try:
        conn.execute(text("ALTER TABLE students ADD COLUMN transportation VARCHAR(50);"))
        print("Added transportation")
    except Exception as e:
        print("Error on transportation:", e)
        
    try:
        conn.execute(text("ALTER TABLE students ADD COLUMN bus_number VARCHAR(50);"))
        print("Added bus_number")
    except Exception as e:
        print("Error on bus_number:", e)
        
    conn.commit()
print("Done")
