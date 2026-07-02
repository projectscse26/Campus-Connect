"""
Campus Connect ERP — Audit Log Model

Tracks all sensitive operations across the platform for security and compliance.
Records login/logout events, data modifications, and system actions with full context.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Actor information (nullable for anonymous/pre-auth actions)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    actor_name = Column(String(255), nullable=True)
    actor_email = Column(String(255), nullable=True)
    role = Column(String(50), nullable=True)
    
    # Request context
    ip_address = Column(String(50), nullable=True)
    method = Column(String(10), nullable=False)  # GET, POST, PUT, DELETE, PATCH
    endpoint = Column(String(255), nullable=False, index=True)
    module = Column(String(100), nullable=True, index=True)  # derived from endpoint
    
    # Response information
    status_code = Column(Integer, nullable=False, index=True)
    response_time_ms = Column(Integer, nullable=True)
    
    # Traceability
    request_id = Column(String(36), unique=True, default=generate_uuid, nullable=False, index=True)
