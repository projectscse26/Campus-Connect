import random
from app.core.database import SessionLocal, engine, Base
from app.models.department import Department
from app.models.student import Student
from app.models.user import User
from app.models.academic import Section, CourseAssignment, MentorAssignment
from app.models.lms import TimetableSlot
from app.core.security import get_password_hash

def seed_students():
    db = SessionLocal()

    print("Fetching CSE Department...")
    cse_dept = db.query(Department).filter(Department.code == 'CSE').first()
    if not cse_dept:
        print("Error: CSE department not found. Please ensure departments are seeded.")
        return

    print("Configuring Batches and Sections...")
    # Definitions
    years = [
        {"year": 4, "batch": "2023-2027", "semester": 7},
        {"year": 3, "batch": "2024-2028", "semester": 5},
        {"year": 2, "batch": "2025-2029", "semester": 3},
        {"year": 1, "batch": "2026-2030", "semester": 1},
    ]
    sections = ['A', 'B']
    STUDENTS_PER_SECTION = 30

    # Clean up existing students and sections in CSE for a fresh start
    print("Cleaning up old CSE students, assignments, and sections...")
    students_to_delete = db.query(Student).filter(Student.department_id == cse_dept.id).all()
    student_ids = [s.id for s in students_to_delete]
    
    if student_ids:
        ma_to_delete = db.query(MentorAssignment).filter(MentorAssignment.student_id.in_(student_ids)).all()
        for ma in ma_to_delete:
            db.delete(ma)
        db.commit()

    for s in students_to_delete:
        db.delete(s)
    db.commit()

    sections_to_delete = db.query(Section).filter(Section.department_id == cse_dept.id).all()
    section_ids = [s.id for s in sections_to_delete]
    
    if section_ids:
        ca_to_delete = db.query(CourseAssignment).filter(CourseAssignment.section_id.in_(section_ids)).all()
        ca_ids = [ca.id for ca in ca_to_delete]
        
        if ca_ids:
            ts_to_delete = db.query(TimetableSlot).filter(TimetableSlot.course_assignment_id.in_(ca_ids)).all()
            for ts in ts_to_delete:
                db.delete(ts)
            db.commit()
            
        for ca in ca_to_delete:
            db.delete(ca)
        db.commit()

    for sec in sections_to_delete:
        db.delete(sec)
    db.commit()

    # Create sections
    section_map = {}
    for y_data in years:
        for s_name in sections:
            sec = Section(
                department_id=cse_dept.id,
                name=s_name,
                year=y_data["year"],
                batch=y_data["batch"]
            )
            db.add(sec)
            db.commit()
            db.refresh(sec)
            section_map[f"{y_data['year']}_{s_name}"] = {
                "id": sec.id,
                "batch": y_data["batch"],
                "semester": y_data["semester"],
                "year": y_data["year"]
            }

    print(f"Created {len(section_map)} sections.")

    first_names = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan", "Shaurya", "Atharv", "Ananya", "Diya", "Sanya", "Kavya", "Isha", "Riya", "Aarohi", "Neha", "Pooja", "Rahul", "Karan", "Rohan", "Vikram", "Sneha", "Nisha", "Swati"]
    last_names = ["Sharma", "Verma", "Reddy", "Kumar", "Singh", "Patel", "Gupta", "Rao", "Nair", "Menon", "Pillai", "Das", "Bose", "Ghosh", "Iyer", "Chandra", "Jain", "Shah"]

    print("Generating 240 Students...")
    student_count = 0
    hashed_pwd = get_password_hash("password123")

    for section_key, s_data in section_map.items():
        for i in range(1, STUDENTS_PER_SECTION + 1):
            fn = random.choice(first_names)
            ln = random.choice(last_names)
            # Register number logic e.g., 23CSE101A
            reg_year = s_data['batch'][2:4] # '23'
            sec_char = section_key.split('_')[1]
            reg_no = f"{reg_year}CSE{i:03d}{sec_char}"
            email = f"{fn.lower()}.{ln.lower()}{reg_year}{i}@svcet.edu"

            # Ensure email is unique across the whole DB
            while db.query(User).filter(User.email == email).first():
                email = f"{fn.lower()}.{ln.lower()}{reg_year}{i}{random.randint(10,99)}@svcet.edu"

            new_user = User(
                email=email,
                hashed_password=hashed_pwd,
                role="student",
                is_active=True
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)

            student = Student(
                user_id=new_user.id,
                department_id=cse_dept.id,
                section_id=s_data['id'],
                first_name=fn,
                last_name=ln,
                register_number=reg_no,
                gender=random.choice(["Male", "Female"]),
                batch=s_data['batch'],
                current_year=s_data['year'],
                current_semester=s_data['semester'],
                college_email=email,
                phone=f"98{random.randint(10000000, 99999999)}",
                is_active=True
            )
            db.add(student)
            student_count += 1
        
        db.commit()

    print(f"Successfully generated {student_count} dummy students for CSE department.")

if __name__ == "__main__":
    seed_students()
