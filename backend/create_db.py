import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

try:
    conn = psycopg2.connect(dbname="postgres", user="postgres", password="admin", host="localhost")
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    cur.execute('CREATE DATABASE campus_connect')
    print("Database campus_connect created successfully.")
    cur.close()
    conn.close()
except psycopg2.errors.DuplicateDatabase:
    print("Database campus_connect already exists.")
except Exception as e:
    print(f"Error creating database: {e}")
