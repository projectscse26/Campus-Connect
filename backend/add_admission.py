from sqlalchemy import create_engine, text; engine = create_engine('postgresql://postgres:admin@localhost/campus_connect'); 
with engine.connect() as conn:
    try: conn.execute(text('ALTER TABLE students ADD COLUMN admission_type VARCHAR(50);')); conn.commit(); print('Added admission_type')
    except Exception as e: print(e)
