from sqlalchemy import create_engine, text  
engine = create_engine('postgresql+psycopg://postgres:admin@10.1.10.24:5432/campus_connect')  
conn = engine.connect()  
conn.execute(text(\" UPDATE sections SET batch=2023-2027 WHERE name=b AND "year=4\))  
conn.commit()  
