"""
Preview script: Show CSE department students and faculty before deletion.
This script does NOT delete anything — read-only.
"""
import psycopg2

conn = psycopg2.connect("postgresql://postgres:admin@10.1.10.24:5432/campus_connect")
cur = conn.cursor()

# 1. Find the CSE department
cur.execute("SELECT id, name, code FROM departments WHERE code = 'CSE'")
dept = cur.fetchone()
print("CSE Department:", dept)

if not dept:
    print("No CSE department found!")
    cur.close()
    conn.close()
    exit()

dept_id = dept[0]

# 2. Count students in CSE
cur.execute("SELECT COUNT(*) FROM students WHERE department_id = %s", (dept_id,))
s_count = cur.fetchone()[0]
print(f"\nTotal Students in CSE: {s_count}")

# 3. Count faculty in CSE
cur.execute("SELECT COUNT(*) FROM faculty WHERE department_id = %s", (dept_id,))
f_count = cur.fetchone()[0]
print(f"Total Faculty in CSE:  {f_count}")

# 4. Preview some students
cur.execute("""
    SELECT s.register_number, s.first_name, s.last_name, u.email, u.role
    FROM students s
    JOIN users u ON s.user_id = u.id
    WHERE s.department_id = %s
    LIMIT 10
""", (dept_id,))
rows = cur.fetchall()
print("\nSample Students (up to 10):")
for r in rows:
    print(" ", r)

# 5. Preview some faculty
cur.execute("""
    SELECT f.employee_id, f.first_name, f.last_name, u.email, u.role
    FROM faculty f
    JOIN users u ON f.user_id = u.id
    WHERE f.department_id = %s
    LIMIT 10
""", (dept_id,))
rows = cur.fetchall()
print("\nSample Faculty (up to 10):")
for r in rows:
    print(" ", r)

cur.close()
conn.close()
print("\nDone — no changes made.")
