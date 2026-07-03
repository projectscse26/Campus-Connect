import os
import sys
from sqlalchemy import create_engine, text
from app.core.config import get_settings

def check_enum():
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'leavestatus') ORDER BY enumsortorder"))
        print([row[0] for row in res])

if __name__ == '__main__':
    check_enum()
