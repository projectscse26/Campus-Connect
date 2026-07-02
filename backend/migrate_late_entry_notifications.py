"""
Migration script to create late_entry_notifications table
Run this script to add the Late Entry Notification feature to your database.
"""

import sys
from sqlalchemy import create_engine, text
from app.core.config import get_settings

def migrate():
    """Add late_entry_notifications table"""
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL)
    
    # SQL to create the new table
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS late_entry_notifications (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        mentor_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
        date DATE NOT NULL,
        expected_arrival_time TIME NOT NULL,
        reason TEXT NOT NULL,
        acknowledged_by_security BOOLEAN DEFAULT FALSE,
        acknowledged_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Ensure student can only submit one notification per date
        UNIQUE(student_id, date)
    );
    
    -- Index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_late_entry_student_date 
        ON late_entry_notifications(student_id, date);
    
    CREATE INDEX IF NOT EXISTS idx_late_entry_date 
        ON late_entry_notifications(date);
    
    CREATE INDEX IF NOT EXISTS idx_late_entry_mentor 
        ON late_entry_notifications(mentor_id);
    """
    
    try:
        with engine.connect() as conn:
            conn.execute(text(create_table_sql))
            conn.commit()
            print("✅ Successfully created late_entry_notifications table")
            print("✅ Added indexes for better performance")
            print("\nThe Late Entry Notification feature is now ready to use!")
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("Starting Late Entry Notifications migration...")
    migrate()
