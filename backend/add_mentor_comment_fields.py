"""
Migration script to add mentor_comment and mentor_comment_at columns to late_entry_notifications table
"""

import sys
from sqlalchemy import create_engine, text
from app.core.config import get_settings

def migrate():
    """Add mentor comment fields"""
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL)
    
    # SQL to add the new columns
    add_columns_sql = """
    ALTER TABLE late_entry_notifications 
    ADD COLUMN IF NOT EXISTS mentor_comment TEXT,
    ADD COLUMN IF NOT EXISTS mentor_comment_at TIMESTAMP WITH TIME ZONE;
    """
    
    try:
        with engine.connect() as conn:
            conn.execute(text(add_columns_sql))
            conn.commit()
            print("✅ Successfully added mentor_comment and mentor_comment_at columns")
            print("✅ Mentor acknowledgment feature is now available!")
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("Starting mentor comment fields migration...")
    migrate()
