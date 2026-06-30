import os
import sqlalchemy as sa
from sqlalchemy.exc import ProgrammingError
from dotenv import load_dotenv

# Load env variables from backend/.env
env_path = r"c:\Users\Jeeva\My projects\Campus Connect\backend\.env"
load_dotenv(env_path)

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not found in env")
    exit(1)

# Connect to database and alter table
engine = sa.create_engine(db_url)
with engine.connect() as conn:
    print("Connecting to database to run migrations...")
    
    # 1. Add category column
    try:
        conn.execute(sa.text("ALTER TABLE announcements ADD COLUMN category VARCHAR(50) DEFAULT 'General' NOT NULL;"))
        conn.commit()
        print("Successfully added 'category' column to 'announcements' table.")
    except Exception as e:
        print("Error adding 'category' column (it might already exist):", e)
        conn.rollback()

    # 2. Add target_audience column
    try:
        conn.execute(sa.text("ALTER TABLE announcements ADD COLUMN target_audience VARCHAR(50) DEFAULT 'Everyone' NOT NULL;"))
        conn.commit()
        print("Successfully added 'target_audience' column to 'announcements' table.")
    except Exception as e:
        print("Error adding 'target_audience' column (it might already exist):", e)
        conn.rollback()

print("Migrations completed.")
