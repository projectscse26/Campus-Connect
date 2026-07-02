"""
Campus Connect ERP — Audit Logging Middleware

Automatically logs every request to the audit_logs table with:
- Authentication context (user, role, email)
- Request details (method, endpoint, IP)
- Response details (status code, timing)
- Real-time WebSocket broadcast to admin dashboards

This middleware wraps ALL routes except excluded paths (docs, websockets, health checks).
"""

import time
import uuid
import re
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from typing import Optional

from app.core.database import SessionLocal
from app.models.audit_log import AuditLog
from app.models.user import User
from app.core.config import get_settings

settings = get_settings()

# Paths to exclude from audit logging (to avoid noise and circular dependencies)
EXCLUDED_PATTERNS = [
    r"^/docs",
    r"^/redoc",
    r"^/openapi\.json",
    r"^/api/audit-logs",  # Avoid logging audit log fetches
    r"^/ws/",             # WebSocket connections
    r"^/health$",         # Health checks
    r"^/$",               # Root endpoint
]

# Specifically ignore GET requests to these endpoints (background polling)
IGNORED_GET_ENDPOINTS = [
    r"^/api/announcements",
    r"^/api/auth/me"
]

def should_exclude_path(path: str, method: str) -> bool:
    """Check if path should be excluded from audit logging"""
    if method == "OPTIONS":
        return True
        
    for pattern in EXCLUDED_PATTERNS:
        if re.match(pattern, path):
            return True
            
    if method == "GET":
        for pattern in IGNORED_GET_ENDPOINTS:
            if re.match(pattern, path):
                return True
                
    return False


def extract_module_from_path(path: str) -> Optional[str]:
    """Extract module name from API path (e.g., /api/auth/login → auth)"""
    match = re.match(r"^/api/([^/]+)", path)
    if match:
        return match.group(1)
    return None


def get_user_from_token(authorization: Optional[str], db: Session) -> Optional[tuple]:
    """
    Decode JWT token and fetch user details.
    Returns: (user_id, name, email, role) or None
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role")
        
        if not user_id:
            return None
        
        # Fetch user from database to get email
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            return None
        
        # Derive name from email (no explicit name field in User model)
        name = user.email.split("@")[0] if user.email else "Unknown"
        
        return (int(user_id), name, user.email, role or user.role.value)
    except (JWTError, ValueError, KeyError):
        return None


class AuditLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that logs all requests to audit_logs table and broadcasts to WebSocket clients
    """
    
    async def dispatch(self, request: Request, call_next):
        # Skip excluded paths
        if should_exclude_path(request.url.path, request.method):
            return await call_next(request)
        
        # Start timing
        start_time = time.time()
        request_id = str(uuid.uuid4())
        
        # Extract request details
        method = request.method
        endpoint = request.url.path
        module = extract_module_from_path(endpoint)
        ip_address = request.client.host if request.client else "unknown"
        
        # Try to extract user from JWT
        authorization = request.headers.get("authorization")
        db = SessionLocal()
        user_data = get_user_from_token(authorization, db)
        
        # Process the actual request
        response = await call_next(request)
        
        # Calculate response time
        response_time_ms = int((time.time() - start_time) * 1000)
        status_code = response.status_code
        
        # Create audit log entry
        try:
            audit_entry = AuditLog(
                request_id=request_id,
                timestamp=None,  # Will use server default (now())
                user_id=user_data[0] if user_data else None,
                actor_name=user_data[1] if user_data else "anonymous",
                actor_email=user_data[2] if user_data else None,
                role=user_data[3] if user_data else None,
                ip_address=ip_address,
                method=method,
                endpoint=endpoint,
                module=module,
                status_code=status_code,
                response_time_ms=response_time_ms,
            )
            
            db.add(audit_entry)
            db.commit()
            db.refresh(audit_entry)
            
            # Local broadcast removed:
            # We now rely on the Postgres trigger 'audit_logs_notify_trigger' 
            # to broadcast this insert via LISTEN/NOTIFY. The 'postgres_listener' 
            # task in main.py will pick it up and broadcast to WebSockets.
        except Exception as e:
            print(f"❌ Error logging audit entry: {e}")
            db.rollback()
        finally:
            db.close()
        
        return response
