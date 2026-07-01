#!/usr/bin/env python3
"""
Script to fix the GradeType enum in the database after removing CIA3
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import get_settings

def fix_gradetype_enum():
    """Update the GradeType enum to match the new values"""
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as connection:
        # Start a transaction
        trans = connection.begin()
        
        try:
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
            print(f"Current enum values: {current_values}")
            
            # Expected new values (without CIA3/INTERNAL_3)
            expected_values = [
                'internal_1',
                'internal_2', 
                'model_exam',
                'assignment',
                'lab',
                'external'
            ]
            
            # Check if we need to update
            if set(current_values) == set(expected_values):
                print("Enum values are already correct!")
                return
            
            print("Updating enum values...")
            
            # Drop and recreate the enum type
            print("1. Temporarily changing column to text...")
            connection.execute(text("""
                ALTER TABLE grades 
                ALTER COLUMN grade_type TYPE text;
            """))
            
            print("2. Dropping old enum type...")
            connection.execute(text("""
                DROP TYPE IF EXISTS gradetype;
            """))
            
            print("3. Creating new enum type...")
            connection.execute(text("""
                CREATE TYPE gradetype AS ENUM (
                    'internal_1',
                    'internal_2',
                    'model_exam', 
                    'assignment',
                    'lab',
                    'external'
                );
            """))
            
            print("4. Converting column back to enum...")
            connection.execute(text("""
                ALTER TABLE grades 
                ALTER COLUMN grade_type TYPE gradetype USING grade_type::gradetype;
            """))
            
            # Update any existing records that might have old values
            print("5. Updating existing records...")
            
            # Update records that might have uppercase values
            updates = [
                ("INTERNAL_1", "internal_1"),
                ("INTERNAL_2", "internal_2"), 
                ("INTERNAL_3", "internal_2"),  # Convert CIA3 to CIA2 if any exist
                ("MODEL_EXAM", "model_exam"),
                ("ASSIGNMENT", "assignment"),
                ("LAB", "lab"),
                ("EXTERNAL", "external")
            ]
            
            for old_val, new_val in updates:
                connection.execute(text(f"""
                    UPDATE grades 
                    SET grade_type = '{new_val}'::gradetype 
                    WHERE grade_type::text = '{old_val}';
                """))
            
            # Commit the transaction
            trans.commit()
            print("✅ Successfully updated GradeType enum!")
            
        except Exception as e:
            trans.rollback()
            print(f"❌ Error updating enum: {e}")
            raise

if __name__ == "__main__":
    fix_gradetype_enum()