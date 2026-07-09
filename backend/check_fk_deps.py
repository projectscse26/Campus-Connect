"""
Find ALL FK chains recursively from students, faculty, users.
"""
import psycopg2

conn = psycopg2.connect("postgresql://postgres:admin@10.1.10.24:5432/campus_connect")
cur = conn.cursor()

cur.execute("""
    SELECT
        tc.table_name AS child_table,
        kcu.column_name AS child_column,
        ccu.table_name AS parent_table,
        ccu.column_name AS parent_column,
        rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name AND tc.table_schema = rc.constraint_schema
    JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = rc.unique_constraint_name AND ccu.table_schema = rc.unique_constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
    ORDER BY ccu.table_name, tc.table_name
""")
rows = cur.fetchall()
print(f"{'Child Table':<35} {'Child Col':<30} {'Parent Table':<30} {'Parent Col':<15} Delete Rule")
print("-"*125)
for r in rows:
    print(f"{r[0]:<35} {r[1]:<30} {r[2]:<30} {r[3]:<15} {r[4]}")

cur.close()
conn.close()
