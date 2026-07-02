#!/usr/bin/env python3
import os
import sys
from sqlalchemy import create_engine, text
from app.core.config import get_settings

def fix_leave_enum():
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as connection:
        trans = connection.begin()
        try:
            print("1. Temporarily changing columns to text...")
            connection.execute(text("""
                ALTER TABLE faculty_leave_requests ALTER COLUMN status TYPE text;
            """))
            connection.execute(text("""
                ALTER TABLE leave_requests ALTER COLUMN status TYPE text;
            """))
            
            print("2. Dropping old enum type...")
            connection.execute(text("""
                DROP TYPE IF EXISTS leavestatus CASCADE;
            """))
            
            print("3. Creating new enum type...")
            connection.execute(text("""
                CREATE TYPE leavestatus AS ENUM (
                    'pending_substitute',
                    'pending_hod',
                    'pending_dean',
                    'pending_om',
                    'approved',
                    'rejected',
                    'withdrawn',
                    'pending'
                );
            """))
            
            print("4. Updating existing records in faculty_leave_requests...")
            updates = [
                ("PENDING", "pending_substitute"),
                ("APPROVED_MENTOR", "pending_hod"),
                ("APPROVED_HOD", "pending_dean"),
                ("APPROVED", "approved"),
                ("REJECTED", "rejected"),
                ("CANCELLED", "withdrawn")
            ]
            
            for old_val, new_val in updates:
                connection.execute(text(f"""
                    UPDATE faculty_leave_requests 
                    SET status = '{new_val}'
                    WHERE status = '{old_val}';
                """))
                
                # Also for leave_requests
                if old_val == "PENDING":
                    connection.execute(text(f"UPDATE leave_requests SET status = 'pending' WHERE status = 'PENDING';"))
                elif old_val == "APPROVED_MENTOR" or old_val == "APPROVED_HOD" or old_val == "APPROVED":
                    connection.execute(text(f"UPDATE leave_requests SET status = 'approved' WHERE status = '{old_val}';"))
                elif old_val == "REJECTED":
                    connection.execute(text(f"UPDATE leave_requests SET status = 'rejected' WHERE status = 'REJECTED';"))
                elif old_val == "CANCELLED":
                    connection.execute(text(f"UPDATE leave_requests SET status = 'withdrawn' WHERE status = 'CANCELLED';"))
                
            print("5. Converting columns back to enum...")
            connection.execute(text("""
                ALTER TABLE faculty_leave_requests 
                ALTER COLUMN status TYPE leavestatus USING status::leavestatus;
            """))
            connection.execute(text("""
                ALTER TABLE leave_requests 
                ALTER COLUMN status TYPE leavestatus USING status::leavestatus;
            """))
            
            trans.commit()
            print("Successfully updated leavestatus enum!")
        except Exception as e:
            trans.rollback()
            print(f"Error updating enum: {e}")
            raise

if __name__ == "__main__":
    fix_leave_enum()
