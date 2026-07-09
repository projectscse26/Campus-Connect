from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import verify_password

db = SessionLocal()
try:
    principal = db.query(User).filter(User.email == 'principal@svcet.ac.in').first()
    if principal:
        print(f"Email: {principal.email}")
        print(f"Role: {principal.role}")
        print(f"Title: {principal.title}")
        print(f"Is Active: {principal.is_active}")
        print(f"Has password: {bool(principal.hashed_password)}")
        
        # Test password verification
        test_password = "password123"
        is_valid = verify_password(test_password, principal.hashed_password)
        print(f"Password 'password123' is valid: {is_valid}")
    else:
        print("Principal user not found!")
finally:
    db.close()
