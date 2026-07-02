"""
Campus Connect ERP — Audit Logs Table Migration

Creates the audit_logs table following the project's standalone migration pattern.
Run this script directly: python migrate_audit_logs.py
"""

import os
import sqlalchemy as sa
from sqlalchemy.exc import ProgrammingError
from dotenv import load_dotenv

# Load environment variables from backend/.env
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path)

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("❌ DATABASE_URL not found in environment variables")
    exit(1)

print("🔌 Connecting to database to create audit_logs table...")
engine = sa.create_engine(db_url)

with engine.connect() as conn:
    # Drop existing table if it exists (to replace old schema)
    try:
        conn.execute(sa.text("DROP TABLE IF EXISTS audit_logs CASCADE;"))
        conn.commit()
        print("🗑️  Dropped existing audit_logs table")
    except Exception as e:
        print(f"⚠️  Error dropping table: {e}")
        conn.rollback()
    
    try:
        # Create audit_logs table
        conn.execute(sa.text("""
            CREATE TABLE audit_logs (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                actor_name VARCHAR(255),
                actor_email VARCHAR(255),
                role VARCHAR(50),
                ip_address VARCHAR(50),
                method VARCHAR(10) NOT NULL,
                endpoint VARCHAR(255) NOT NULL,
                module VARCHAR(100),
                status_code INTEGER NOT NULL,
                response_time_ms INTEGER,
                request_id VARCHAR(36) UNIQUE NOT NULL
            );
        """))
        conn.commit()
        print("✅ Successfully created 'audit_logs' table")
    except Exception as e:
        print(f"❌ Error creating table: {e}")
        conn.rollback()
        exit(1)

    # Create indexes for performance
    indexes = [
        ("idx_audit_logs_timestamp", "CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);"),
        ("idx_audit_logs_user_id", "CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);"),
        ("idx_audit_logs_endpoint", "CREATE INDEX IF NOT EXISTS idx_audit_logs_endpoint ON audit_logs(endpoint);"),
        ("idx_audit_logs_module", "CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);"),
        ("idx_audit_logs_status_code", "CREATE INDEX IF NOT EXISTS idx_audit_logs_status_code ON audit_logs(status_code);"),
        ("idx_audit_logs_request_id", "CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs(request_id);"),
    ]
    
    for idx_name, sql in indexes:
        try:
            conn.execute(sa.text(sql))
            conn.commit()
            print(f"✅ Created index: {idx_name}")
        except Exception as e:
            print(f"⚠️  Error creating index {idx_name} (it might already exist): {e}")
            conn.rollback()

print("\n🎉 Audit logs migration completed successfully!")
print("📝 The system will now track all login, logout, and sensitive actions.")
