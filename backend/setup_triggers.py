import asyncio
import asyncpg
import sys
import os
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")

SQL_SETUP = """
-- 1. Create a function that issues pg_notify when called
CREATE OR REPLACE FUNCTION notify_audit_log_insert()
RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify(
        'audit_logs_channel',
        row_to_json(NEW)::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger on the audit_logs table
DROP TRIGGER IF EXISTS audit_logs_notify_trigger ON audit_logs;
CREATE TRIGGER audit_logs_notify_trigger
AFTER INSERT ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION notify_audit_log_insert();
"""

async def main():
    if not DB_URL:
        print("DATABASE_URL not set")
        sys.exit(1)
        
    try:
        conn = await asyncpg.connect(DB_URL)
        await conn.execute(SQL_SETUP)
        print("✅ Successfully created notify_audit_log_insert function and trigger.")
        await conn.close()
    except Exception as e:
        print(f"❌ Error setting up trigger: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
