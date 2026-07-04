import os
import sys
from sqlalchemy import create_engine, text
from app.core.config import get_settings

def add_holiday_to_enum():
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as connection:
        try:
            connection.execute(text("ALTER TYPE attendancestatus ADD VALUE IF NOT EXISTS 'holiday';"))
            print("Successfully added 'holiday'.")
        except Exception as e:
            print(f"Error adding 'holiday': {e}")
            
if __name__ == '__main__':
    add_holiday_to_enum()
