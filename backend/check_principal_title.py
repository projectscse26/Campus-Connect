"""
Check what title is stored for principal@svcet.ac.in
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User
from app.models.authority import Authority

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost/campus_connect")

# Create database connection
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    # Find the user by email
    user = db.query(User).filter(User.email == "principal@svcet.ac.in").first()
    
    if not user:
        print("❌ User not found: principal@svcet.ac.in")
    else:
        print(f"\n✅ User found:")
        print(f"   Email: {user.email}")
        print(f"   Role: {user.role}")
        print(f"   Active: {user.is_active}")
        
        # Get authority profile
        if user.role == "authority":
            authority = db.query(Authority).filter(Authority.user_id == user.id).first()
            
            if authority:
                print(f"\n📋 Authority Profile:")
                print(f"   Name: {authority.first_name} {authority.last_name}")
                print(f"   Title: '{authority.title}'")
                print(f"   Title Length: {len(authority.title)}")
                print(f"   Title (repr): {repr(authority.title)}")
                print(f"   Title (lowercase): '{authority.title.lower()}'")
                print(f"   Title (trimmed): '{authority.title.strip()}'")
                print(f"   Employee ID: {authority.employee_id}")
                
                # Check what the routing logic would see
                normalized = authority.title.lower().strip()
                print(f"\n🔍 Routing Logic Check:")
                print(f"   Normalized title: '{normalized}'")
                print(f"   Matches 'principal': {normalized == 'principal'}")
                print(f"   Contains 'principal': {'principal' in normalized}")
                print(f"   Contains 'office': {'office' in normalized}")
                print(f"   Contains 'manager': {'manager' in normalized}")
                
                # Determine where they should be routed
                if normalized == 'principal' or 'principal' in normalized:
                    print(f"   ✅ Should route to: /principal")
                elif 'office' in normalized or normalized == 'om' or 'manager' in normalized:
                    print(f"   ✅ Should route to: /authority (OM)")
                else:
                    print(f"   ⚠️  Would fallback to: /authority")
            else:
                print("\n❌ Authority profile not found!")
        else:
            print(f"\n❌ User is not an authority (role: {user.role})")
            
except Exception as e:
    print(f"\n❌ Error: {e}")
finally:
    db.close()

print("\n" + "="*60)
