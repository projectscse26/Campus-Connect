"""
Migration script to add viewed_by_mentor and viewed_at columns to late_entry_notifications table
"""

import sys
from sqlalchemy import create_engine, text
from app.core.config import get_settings

def migrate():
    """Add viewed_by_mentor and viewed_at columns"""
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL)
    
    # SQL to add the new columns
    add_columns_sql = """
    ALTER TABLE late_entry_notifications 
    ADD COLUMN IF NOT EXISTS viewed_by_mentor BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP WITH TIME ZONE;
    """
    
    try:
        with engine.connect() as conn:
            conn.execute(text(add_columns_sql))
            conn.commit()
            print("✅ Successfully added viewed_by_mentor and viewed_at columns")
            print("✅ Late Entry Notification feature updated!")
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("Starting Late Entry Notifications update migration...")
    migrate()
