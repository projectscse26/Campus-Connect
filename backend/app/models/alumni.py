from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Alumni(Base):
    __tablename__ = "alumni"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)

    # --- Personal Details ---
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    register_number = Column(String(50), unique=True, nullable=False, index=True)
    gender = Column(String(10), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    blood_group = Column(String(5), nullable=True)
    nationality = Column(String(50), default="Indian")
    community = Column(String(50), nullable=True)
    photo_url = Column(String(500), nullable=True)

    # --- Academic Details ---
    batch = Column(String(20), nullable=False)             # e.g., "2020-2024"
    graduation_year = Column(Integer, nullable=False)

    # --- Contact Details ---
    college_email = Column(String(255), unique=True, nullable=False)
    personal_email = Column(String(255), nullable=True)
    phone = Column(String(15), nullable=False)

    # --- Address ---
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", backref="alumni_profile")
    department = relationship("Department")
