import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.student import Student
from app.models.faculty import Faculty
from app.schemas.student import StudentResponse
from app.schemas.faculty import FacultyResponse
from sqlalchemy.orm import joinedload

def test_all():
    db = SessionLocal()
    
    # Test ALL students with their sections
    students = db.query(Student).options(joinedload(Student.section)).all()
    print(f"Total students in DB: {len(students)}")
    
    errors = 0
    for s in students:
        try:
            StudentResponse.model_validate(s, from_attributes=True)
        except Exception as e:
            errors += 1
            print(f"ERROR Student #{s.id} ({s.first_name} {s.last_name}): {e}")
            if errors >= 5:
                print("... stopping after 5 errors")
                break
    
    if errors == 0:
        print("All students validate OK!")
    
    # Test ALL faculty
    faculty = db.query(Faculty).all()
    print(f"\nTotal faculty in DB: {len(faculty)}")
    
    errors = 0
    for f in faculty:
        try:
            FacultyResponse.model_validate(f, from_attributes=True)
        except Exception as e:
            errors += 1
            print(f"ERROR Faculty #{f.id} ({f.first_name} {f.last_name}): {e}")
            if errors >= 5:
                print("... stopping after 5 errors")
                break
    
    if errors == 0:
        print("All faculty validate OK!")
    
    db.close()

if __name__ == "__main__":
    test_all()
