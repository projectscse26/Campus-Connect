from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

db = SessionLocal()

existing = db.query(User).filter(User.email == 'latetracker@svcet.ac.in').first()
if not existing:
    tracker = User(
        email='latetracker@svcet.ac.in',
        hashed_password=get_password_hash('svcet@123'),
        role=UserRole.LATE_TRACKER
    )
    db.add(tracker)
    db.commit()
    print('Seed: Added latetracker@svcet.ac.in')
else:
    print('Seed: latetracker already exists.')
