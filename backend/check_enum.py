from app.core.database import SessionLocal, engine
import sqlalchemy as sa
with engine.connect() as conn:
    try:
        conn.execute(sa.text("ALTER TABLE late_records ADD COLUMN action_status actionstatus DEFAULT 'NOT_INFORMED';"))
        conn.commit()
        print('Added action_status to late_records')
    except Exception as e:
        print('Error:', e)
