"""
Delete all students and faculty (users) of the CSE department.
Handles every FK constraint in the correct dependency order.
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

    # Collect profile IDs and user_ids
    cur.execute("SELECT id, user_id FROM students WHERE department_id = %s", (dept_id,))
    student_rows   = cur.fetchall()
    student_ids    = [r[0] for r in student_rows]
    student_uids   = [r[1] for r in student_rows]
    print(f"Students: {len(student_ids)}")

    cur.execute("SELECT id, user_id FROM faculty WHERE department_id = %s", (dept_id,))
    faculty_rows   = cur.fetchall()
    faculty_ids    = [r[0] for r in faculty_rows]
    faculty_uids   = [r[1] for r in faculty_rows]
    print(f"Faculty:  {len(faculty_ids)}")

    # Collect course_assignment IDs for these faculty (needed for timetable_slots)
    if faculty_ids:
        cur.execute("SELECT id FROM course_assignments WHERE faculty_id = ANY(%s)", (faculty_ids,))
        ca_ids = [r[0] for r in cur.fetchall()]
    else:
        ca_ids = []

    all_uids = student_uids + faculty_uids

    # ── 1. HOD reference ─────────────────────────────────────────────────
    cur.execute("UPDATE departments SET hod_id = NULL WHERE hod_id = ANY(%s)", (faculty_ids,))
    print(f"[1] Cleared HOD ref in {cur.rowcount} dept(s)")

    # ── 2. Delete deepest student-related child rows ──────────────────────
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
        if student_ids:
            cur.execute(f"DELETE FROM {tbl} WHERE {col} = ANY(%s)", (student_ids,))
            if cur.rowcount: print(f"[2] Deleted {cur.rowcount:>4} from {tbl}")

    # ── 3. timetable_slots depends on course_assignments ────────────────
    if ca_ids:
        cur.execute("DELETE FROM timetable_slots WHERE course_assignment_id = ANY(%s)", (ca_ids,))
        if cur.rowcount: print(f"[3] Deleted {cur.rowcount:>4} from timetable_slots")

    # ── 4. Nullify nullable FK references pointing to faculty_ids ────────
    for tbl, col in [
        ("leave_requests",           "mentor_approved_by"),
        ("leave_requests",           "hod_approved_by"),
        ("student_leave_requests",   "mentor_id"),
        ("student_leave_requests",   "class_advisor_id"),
        ("student_leave_requests",   "hod_id"),
        ("gate_passes",              "mentor_id"),
        ("gate_passes",              "hod_id"),
        ("attendance",               "marked_by_id"),
        ("late_entry_notifications", "mentor_id"),
        ("late_entry_notifications", "approved_by_id"),
        ("grades",                   "graded_by_id"),
        ("retest_marks",             "entered_by_id"),
        ("mentoring_meetings",       "mentor_id"),
        ("advising_logs",            "mentor_id"),
        ("sections",                 "class_advisor_id"),
        ("faculty_leave_requests",   "hod_approved_by"),
        ("faculty_duty_arrangements","substitute_faculty_id"),
    ]:
        if faculty_ids:
            cur.execute(f"UPDATE {tbl} SET {col} = NULL WHERE {col} = ANY(%s)", (faculty_ids,))
            if cur.rowcount: print(f"[4] Nulled  {cur.rowcount:>4} in {tbl}.{col}")

    # ── 5. Delete rows OWNED by faculty ──────────────────────────────────
    for tbl, col in [
        ("lms_resources",           "uploaded_by_id"),   # NOT NULL — delete
        ("faculty_duty_arrangements","leave_request_id"), # via faculty_leave_requests
        ("faculty_leave_requests",  "faculty_id"),
        ("faculty_leave_balances",  "faculty_id"),
        ("course_assignments",      "faculty_id"),
        ("mentor_assignments",      "mentor_id"),        # any remaining
    ]:
        if faculty_ids:
            cur.execute(f"DELETE FROM {tbl} WHERE {col} = ANY(%s)", (faculty_ids,))
            if cur.rowcount: print(f"[5] Deleted {cur.rowcount:>4} from {tbl}")

    # ── 5b. faculty_duty_arrangements that referenced leave_requests ──────
    # (handled above via substitute_faculty_id NULL + faculty_id delete)

    # ── 6. Nullify user-level FK references ──────────────────────────────
    # These columns are NOT NULL — delete rows instead of nulling
    for tbl, col in [
        ("discipline_records", "reported_by_id"),
        ("late_records",       "recorded_by_id"),
    ]:
        if all_uids:
            cur.execute(f"DELETE FROM {tbl} WHERE {col} = ANY(%s)", (all_uids,))
            if cur.rowcount: print(f"[6] Deleted {cur.rowcount:>4} from {tbl}")

    # announcements.posted_by_id is NOT NULL — delete announcements by these users
    if all_uids:
        cur.execute("DELETE FROM announcements WHERE posted_by_id = ANY(%s)", (all_uids,))
        if cur.rowcount: print(f"[6] Deleted {cur.rowcount:>4} from announcements")

    # ── 7. Delete student and faculty profile rows ────────────────────────
    if student_ids:
        cur.execute("DELETE FROM students WHERE id = ANY(%s)", (student_ids,))
        print(f"[7] Deleted {cur.rowcount} rows from students")

    if faculty_ids:
        cur.execute("DELETE FROM faculty WHERE id = ANY(%s)", (faculty_ids,))
        print(f"[7] Deleted {cur.rowcount} rows from faculty")

    # ── 8. Delete user accounts ───────────────────────────────────────────
    if all_uids:
        cur.execute("DELETE FROM users WHERE id = ANY(%s)", (all_uids,))
        print(f"[8] Deleted {cur.rowcount} rows from users")

    conn.commit()
    print("\n--- SUCCESS: All CSE students and faculty users deleted. ---")

except Exception as e:
    conn.rollback()
    print(f"\nError: {e}")
    print("Rolled back - no changes made.")
    raise

finally:
    cur.close()
    conn.close()
