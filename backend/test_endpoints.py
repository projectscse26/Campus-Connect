import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import create_access_token

def test_endpoints():
    client = TestClient(app)
    db = SessionLocal()
    
    admin_user = db.query(User).filter(User.role == 'admin').first()
    if not admin_user:
        print("No admin user found")
        return
        
    token = create_access_token({"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Testing /api/students/?limit=10000")
    response = client.get("/api/students/?limit=10000", headers=headers)
    print(f"Status: {response.status_code}")
    print(response.json())
        
    print("\nTesting /api/faculty")
    response = client.get("/api/faculty", headers=headers)
    print(f"Status: {response.status_code}")
    print(response.json())

if __name__ == "__main__":
    test_endpoints()
