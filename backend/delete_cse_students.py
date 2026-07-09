"""
Delete all STUDENTS (only) belonging to the CSE department.
Faculty are NOT touched. Handles all FK constraints in correct order.
"""
import psycopg2

conn = psycopg2.connect("postgresql://postgres:admin@10.1.10.24:5432/campus_connect")
conn.autocommit = False
cur = conn.cursor()

try:
    cur.execute("SELECT id FROM departments WHERE code = 'CSE'")
    dept = cur.fetchone()
    if not dept:
        print("CSE department not found. Aborting.")
        exit()
    dept_id = dept[0]
    print(f"CSE department_id = {dept_id}")

    # Collect student profile IDs and their user_ids
    cur.execute("SELECT id, user_id FROM students WHERE department_id = %s", (dept_id,))
    student_rows = cur.fetchall()
    student_ids  = [r[0] for r in student_rows]
    student_uids = [r[1] for r in student_rows]
    print(f"Students to delete: {len(student_ids)}")

    if not student_ids:
        print("No CSE students found. Nothing to delete.")
        exit()

    # ── 1. Delete all child rows referencing student_ids ─────────────────
    for tbl, col in [
        ("retest_marks",             "student_id"),
        ("grades",                   "student_id"),
        ("enrollments",              "student_id"),
        ("attendance",               "student_id"),
        ("gate_passes",              "student_id"),
        ("late_entry_notifications", "student_id"),
        ("late_records",             "student_id"),
        ("leave_requests",           "student_id"),
        ("student_leave_requests",   "student_id"),
        ("discipline_records",       "student_id"),
        ("mentoring_meetings",       "student_id"),
        ("advising_logs",            "student_id"),
        ("mentor_assignments",       "student_id"),
    ]:
        cur.execute(f"DELETE FROM {tbl} WHERE {col} = ANY(%s)", (student_ids,))
        if cur.rowcount: print(f"[1] Deleted {cur.rowcount:>4} from {tbl}")

    # ── 2. Handle user-level FK references for student user accounts ──────
    # discipline_records.reported_by_id is NOT NULL — delete those rows
    cur.execute("DELETE FROM discipline_records WHERE reported_by_id = ANY(%s)", (student_uids,))
    if cur.rowcount: print(f"[2] Deleted {cur.rowcount:>4} from discipline_records (reported_by_id)")

    # late_records.recorded_by_id is NOT NULL — delete those rows
    cur.execute("DELETE FROM late_records WHERE recorded_by_id = ANY(%s)", (student_uids,))
    if cur.rowcount: print(f"[2] Deleted {cur.rowcount:>4} from late_records (recorded_by_id)")

    # announcements.posted_by_id is NOT NULL — delete those rows
    cur.execute("DELETE FROM announcements WHERE posted_by_id = ANY(%s)", (student_uids,))
    if cur.rowcount: print(f"[2] Deleted {cur.rowcount:>4} from announcements")

    # audit_logs.user_id has SET NULL rule — handled automatically by DB
    # (no action needed)

    # ── 3. Delete student profile rows ───────────────────────────────────
    cur.execute("DELETE FROM students WHERE id = ANY(%s)", (student_ids,))
    print(f"[3] Deleted {cur.rowcount} rows from students")

    # ── 4. Delete user accounts ───────────────────────────────────────────
    cur.execute("DELETE FROM users WHERE id = ANY(%s)", (student_uids,))
    print(f"[4] Deleted {cur.rowcount} rows from users")

    conn.commit()
    print("\n--- SUCCESS: All CSE students deleted. Faculty untouched. ---")

except Exception as e:
    conn.rollback()
    print(f"\nError: {e}")
    print("Rolled back - no changes made.")
    raise

finally:
    cur.close()
    conn.close()
