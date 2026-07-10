import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User
from app.api.students import get_students
from app.api.faculty import get_faculty
from app.api.departments import get_departments
from app.schemas.student import StudentResponse, SectionSimple
from app.schemas.faculty import FacultyResponse
from app.schemas.department import DepartmentResponse

def test_serialization():
    db = SessionLocal()
    admin_user = db.query(User).filter(User.role == 'admin').first()

    depts = get_departments(db=db, current_user=admin_user)
    print(f"Departments from DB: {len(depts)}")
    for d in depts:
        try:
            DepartmentResponse.model_validate(d)
        except Exception as e:
            print(f"Validation error for dept {d.id}: {e}")
            break
    admin_user = db.query(User).filter(User.role == 'admin').first()

    students = get_students(db=db, current_user=admin_user)
    print(f"Students from DB: {len(students)}")
    for s in students:
        try:
            StudentResponse.model_validate(s)
        except Exception as e:
            print(f"Validation error for student {s.id}: {e}")
            break
            
    faculty = get_faculty(db=db, current_user=admin_user)
    print(f"Faculty from DB: {len(faculty)}")
    for f in faculty:
        try:
            FacultyResponse.model_validate(f)
        except Exception as e:
            print(f"Validation error for faculty {f.id}: {e}")
            break

if __name__ == "__main__":
    test_serialization()
