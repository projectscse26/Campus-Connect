#!/usr/bin/env python3
"""
Script to check the current GradeType enum values in the database
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import get_settings

def check_gradetype_enum():
    """Check current GradeType enum values in the database"""
    try:
        settings = get_settings()
        engine = create_engine(settings.DATABASE_URL)
        
        with engine.connect() as connection:
            print("Checking current enum values...")
            result = connection.execute(text("""
                SELECT enumlabel 
                FROM pg_enum 
                WHERE enumtypid = (
                    SELECT oid 
                    FROM pg_type 
                    WHERE typname = 'gradetype'
                )
                ORDER BY enumsortorder;
            """))
            
            current_values = [row[0] for row in result]
            print(f"Current database enum values: {current_values}")
            
            # Check a sample Grade record
            result2 = connection.execute(text("""
                SELECT DISTINCT grade_type 
                FROM grades 
                LIMIT 5;
            """))
            
            grade_values = [row[0] for row in result2]
            print(f"Sample grade_type values in grades table: {grade_values}")
            
    except Exception as e:
        print(f"Error checking enum: {e}")

if __name__ == "__main__":
    check_gradetype_enum()