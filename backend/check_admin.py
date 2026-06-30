import os
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import verify_password

session = SessionLocal()
admin = session.query(User).filter(User.email == 'admin@svcet.edu').first()
print('Admin user:', admin)
if admin:
    print('Is active:', admin.is_active)
    print('Role:', admin.role)
    print('Hashed password:', admin.hashed_password)
    print('Password matches admin123?', verify_password('admin123', admin.hashed_password))
