from app.core.database import SessionLocal, engine
from app.models.late import LateRecord, Base
import sqlalchemy as sa
from sqlalchemy.exc import ProgrammingError

with engine.connect() as conn:
    try:
        conn.execute(sa.text("ALTER TYPE userrole ADD VALUE 'late_tracker';"))
        conn.commit()
        print('Added late_tracker to UserRole enum.')
    except ProgrammingError as e:
        if 'already exists' in str(e):
            print('late_tracker already exists in UserRole enum.')
        else:
            print('Error altering enum:', e)
        conn.rollback()

Base.metadata.create_all(bind=engine, tables=[LateRecord.__table__])
print('Late records table created.')
