"""
Script to create Principal user in the database
Run this from the backend directory: python create_principal_user.py
"""

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.authority import Authority
from app.core.security import get_password_hash

def create_principal():
    """Create Principal user if doesn't exist"""
    
    db = SessionLocal()
    
    try:
        email = "principal@svcet.ac.in"
        password = "password123"
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        
        if existing_user:
            print(f"✅ User {email} already exists in users table")
            user = existing_user
        else:
            # Create user in users table
            user = User(
                email=email,
                hashed_password=get_password_hash(password),
                role=UserRole.AUTHORITY,
                is_active=True
            )
            db.add(user)
            db.flush()  # Get the user ID
            print(f"✅ Created user {email} in users table")
        
        # Check if authority profile exists
        existing_authority = db.query(Authority).filter(Authority.email == email).first()
        
        if existing_authority:
            print(f"✅ Authority profile already exists for {email}")
            print(f"   Current title: {repr(existing_authority.title)}")
            
            # Update title if needed
            if existing_authority.title != "Principal":
                existing_authority.title = "Principal"
                db.commit()
                print(f"   ✅ Updated title to 'Principal'")
        else:
            # Create authority profile
            authority = Authority(
                user_id=user.id,
                email=email,
                first_name="Principal",
                last_name="SVCET",
                title="Principal",
                phone="1234567890",
                is_active=True
            )
            db.add(authority)
            db.commit()
            print(f"✅ Created authority profile for {email}")
            print(f"   Title: 'Principal'")
        
        print("\n" + "="*80)
        print("PRINCIPAL USER CREDENTIALS")
        print("="*80)
        print(f"Email: {email}")
        print(f"Password: {password}")
        print(f"Role: authority")
        print(f"Title: Principal")
        print("="*80)
        print("\n✅ You can now login with these credentials!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("\n" + "="*80)
    print("CAMPUS CONNECT - CREATE PRINCIPAL USER")
    print("="*80 + "\n")
    
    create_principal()
