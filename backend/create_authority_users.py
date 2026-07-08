"""
Script to create all Authority users (Principal, OM, Dean, Vice Principal)
Run this from the backend directory: python create_authority_users.py
"""

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.authority import Authority
from app.core.security import get_password_hash

def create_authority_user(db: Session, email: str, first_name: str, last_name: str, title: str, password: str = "password123"):
    """Create or update an authority user"""
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    
    if existing_user:
        print(f"✅ User {email} already exists")
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
        print(f"✅ Created user: {email}")
    
    # Check if authority profile exists
    existing_authority = db.query(Authority).filter(Authority.email == email).first()
    
    if existing_authority:
        print(f"   Authority profile exists. Current title: {repr(existing_authority.title)}")
        
        # Update title if different
        if existing_authority.title != title:
            old_title = existing_authority.title
            existing_authority.title = title
            existing_authority.first_name = first_name
            existing_authority.last_name = last_name
            print(f"   ✅ Updated title from {repr(old_title)} to {repr(title)}")
    else:
        # Create authority profile
        authority = Authority(
            user_id=user.id,
            email=email,
            first_name=first_name,
            last_name=last_name,
            title=title,
            phone="1234567890",
            employee_id=f"EMP_{title.replace(' ', '_').upper()}",
            is_active=True
        )
        db.add(authority)
        print(f"   ✅ Created authority profile with title: {repr(title)}")
    
    return user

def create_all_authorities():
    """Create all authority users"""
    
    db = SessionLocal()
    
    try:
        print("\n" + "="*80)
        print("CREATING AUTHORITY USERS")
        print("="*80 + "\n")
        
        authorities = [
            ("principal@svcet.ac.in", "Principal", "SVCET", "Principal"),
            ("om@svcet.ac.in", "Office", "Manager", "Office Manager"),
            ("dean@svcet.ac.in", "Dean", "SVCET", "Dean"),
            ("viceprincipal@svcet.ac.in", "Vice", "Principal", "Vice Principal"),
        ]
        
        created_users = []
        
        for email, first_name, last_name, title in authorities:
            print(f"\n{title}:")
            user = create_authority_user(db, email, first_name, last_name, title)
            created_users.append((email, title))
            print()
        
        # Commit all changes
        db.commit()
        
        print("\n" + "="*80)
        print("ALL AUTHORITY USERS CREATED SUCCESSFULLY")
        print("="*80)
        
        print("\nLOGIN CREDENTIALS:")
        print("-" * 80)
        for email, title in created_users:
            print(f"{title:20} | Email: {email:30} | Password: password123")
        
        print("\n" + "="*80)
        print("✅ Done! You can now login with any of these credentials.")
        print("   All authority users use the same password: password123")
        print("="*80 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_all_authorities()
