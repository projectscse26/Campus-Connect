import sys
import os

# Add the backend directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import engine

def migrate():
    # 1. Update postgres custom ENUM type 'sendertype' first (must run in AUTOCOMMIT mode)
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        try:
            print("Adding 'dean' value to sendertype enum...")
            conn.execute(text("ALTER TYPE sendertype ADD VALUE IF NOT EXISTS 'dean';"))
            print("Enum updated.")
        except Exception as e:
            print(f"Enum update note (might already exist or not exist yet): {e}")

    # 2. Re-run migration tables update
    with engine.connect() as conn:
        try:
            print("Running messaging flow database schema adjustments...")
            conn.execute(text("DELETE FROM msg_messages;"))
            conn.execute(text("DELETE FROM msg_conversations;"))
            
            # Check and rename hod_id to dean_id
            res = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='msg_conversations' AND column_name='hod_id';
            """)).fetchone()
            if res:
                print("Renaming hod_id to dean_id...")
                conn.execute(text("ALTER TABLE msg_conversations RENAME COLUMN hod_id TO dean_id;"))
            
            # Check and rename hod_unread_count to dean_unread_count
            res_unread = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='msg_conversations' AND column_name='hod_unread_count';
            """)).fetchone()
            if res_unread:
                print("Renaming hod_unread_count to dean_unread_count...")
                conn.execute(text("ALTER TABLE msg_conversations RENAME COLUMN hod_unread_count TO dean_unread_count;"))
            
            # Drop old foreign key constraints
            conn.execute(text("ALTER TABLE msg_conversations DROP CONSTRAINT IF EXISTS msg_conversations_hod_id_fkey;"))
            conn.execute(text("ALTER TABLE msg_conversations DROP CONSTRAINT IF EXISTS msg_conversations_dean_id_fkey;"))
            
            # Add new foreign key constraint
            print("Adding foreign key constraint for dean_id -> authorities.id...")
            conn.execute(text("""
                ALTER TABLE msg_conversations 
                ADD CONSTRAINT msg_conversations_dean_id_fkey 
                FOREIGN KEY (dean_id) REFERENCES authorities(id) ON DELETE CASCADE;
            """))
            
            conn.commit()
            print("Database schema successfully migrated.")
        except Exception as e:
            conn.rollback()
            print(f"Error executing schema migration: {e}")

if __name__ == "__main__":
    migrate()
