from app.core.database import SessionLocal
from app.models.faculty import Faculty
from app.models.department import Department
from app.models.user import User
from app.models.gatepass import FacultyGatePass, FacultyGatePassStatus
from sqlalchemy.orm import joinedload

db = SessionLocal()

department = db.query(Department).filter(Department.id == 1).first()

print("Executing API query...")
try:
    results = db.query(FacultyGatePass).join(Faculty, FacultyGatePass.faculty_id == Faculty.id).options(
        joinedload(FacultyGatePass.faculty).joinedload(Faculty.department)
    ).filter(
        Faculty.department_id == department.id,
        FacultyGatePass.status == FacultyGatePassStatus.PENDING_HOD
    ).order_by(FacultyGatePass.created_at.desc()).all()
    print(f"Results: {len(results)}")
except Exception as e:
    print(f"Error: {e}")

db.close()