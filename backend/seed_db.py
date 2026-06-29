"""
Script to seed the database with initial users for testing.
Creates one user for each role.
"""

from sqlalchemy.orm import Session
from app.core.database import engine, SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

def seed_users(db: Session):
    roles = [
        (UserRole.ADMIN, "admin@svcet.edu", "admin123"),
        (UserRole.HOD, "hod@svcet.edu", "hod123"),
        (UserRole.FACULTY, "faculty@svcet.edu", "faculty123"),
        (UserRole.STUDENT, "student@svcet.edu", "student123"),
        (UserRole.AUTHORITY, "authority@svcet.edu", "auth123"),
        (UserRole.LATE_TRACKER, "latetracker@svcet.ac.in", "svcet@123"),
    ]
    
    for role, email, password in roles:
        existing = db.query(User).filter(User.email == email).first()
        if not existing:
            user = User(
                email=email,
                hashed_password=get_password_hash(password),
                role=role,
                is_active=True
            )
            db.add(user)
            print(f"Created {role.value} user: {email}")
        else:
            print(f"User {email} already exists")
            
    db.commit()

if __name__ == "__main__":
    print("Seeding database...")
    db = SessionLocal()
    try:
        seed_users(db)
        print("Done!")
    finally:
        db.close()
