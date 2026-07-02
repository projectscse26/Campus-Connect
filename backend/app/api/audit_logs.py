"""
Campus Connect ERP — Audit Logs API

Provides:
1. WebSocket endpoint for real-time audit log streaming (admin-only)
   - Keepalive ping every 20 s so connections survive idle periods
   - Broadcasts every incoming audit log to ALL connected admin sessions
2. REST endpoint for paginated audit log retrieval with filters (admin-only)
"""

import asyncio
import logging

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime
from jose import jwt, JWTError

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.config import get_settings
from app.models.audit_log import AuditLog
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)

settings = get_settings()
router = APIRouter()


# ============================================================================
# WebSocket Connection Manager
# ============================================================================

class AuditLogConnectionManager:
    """Manages WebSocket connections for real-time audit log streaming."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"[AuditWS] Client connected — {len(self.active_connections)} active")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"[AuditWS] Client disconnected — {len(self.active_connections)} remaining")

    async def broadcast(self, message: dict):
        """Broadcast a message to ALL connected admin clients."""
        if not self.active_connections:
            return
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as exc:
                logger.warning(f"[AuditWS] Send failed ({exc}), marking for removal")
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)


manager = AuditLogConnectionManager()


async def broadcast_audit_log(audit_entry: AuditLog):
    """Broadcast a new audit log entry to every connected admin dashboard."""
    message = {
        "id": audit_entry.id,
        "timestamp": audit_entry.timestamp.isoformat() if audit_entry.timestamp else None,
        "user_id": audit_entry.user_id,
        "actor_name": audit_entry.actor_name,
        "actor_email": audit_entry.actor_email,
        "role": audit_entry.role,
        "ip_address": audit_entry.ip_address,
        "method": audit_entry.method,
        "endpoint": audit_entry.endpoint,
        "module": audit_entry.module,
        "status_code": audit_entry.status_code,
        "response_time_ms": audit_entry.response_time_ms,
        "request_id": audit_entry.request_id,
    }
    logger.debug(f"[AuditWS] Broadcasting to {len(manager.active_connections)} client(s)")
    await manager.broadcast(message)


# ============================================================================
# WebSocket Endpoint (Admin-only, Real-time)
# ============================================================================

PING_INTERVAL = 20  # seconds — keeps connection alive through idle periods


@router.websocket("/ws/audit-logs")
async def websocket_audit_logs(websocket: WebSocket, token: Optional[str] = Query(None)):
    """
    WebSocket endpoint for real-time audit log streaming.
    - Admin-only: validates JWT on connect.
    - Sends a JSON {"type": "ping"} every PING_INTERVAL seconds so the
      connection is never dropped by proxies / browsers due to inactivity.
    - Any action by ANY user (faculty login, admin creating a student, etc.)
      is broadcast to every connected admin dashboard immediately.
    """
    # ── Auth ──────────────────────────────────────────────────────────────────
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing token")
        return

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        role    = payload.get("role")
        if not user_id or role != "admin":
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Admin access required")
            return
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
        return

    await manager.connect(websocket)

    # ── Keepalive ping task ───────────────────────────────────────────────────
    async def send_pings():
        try:
            while True:
                await asyncio.sleep(PING_INTERVAL)
                await websocket.send_json({"type": "ping"})
        except Exception:
            pass  # connection already gone — outer loop will clean up

    ping_task = asyncio.create_task(send_pings())

    # ── Main receive loop ─────────────────────────────────────────────────────
    try:
        while True:
            # receive_text() blocks; client sends "pong" in response to our ping
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.warning(f"[AuditWS] Unexpected error: {exc}")
    finally:
        ping_task.cancel()
        manager.disconnect(websocket)


# ============================================================================
# REST Endpoint (Admin-only, Paginated with Filters)
# ============================================================================

def require_admin(current_user: User = Depends(get_current_active_user)):
    """Dependency to enforce admin-only access"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.get("")
def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, pattern="^(success|client_error|server_error)$"),
    module: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get paginated audit logs with optional filters.
    Admin-only endpoint.
    
    Query Parameters:
    - page: Page number (default: 1)
    - page_size: Items per page (default: 20, max: 100)
    - search: Search in actor_name, actor_email, endpoint
    - status_filter: Filter by status category (success=2xx, client_error=4xx, server_error=5xx)
    - module: Filter by module name
    - role: Filter by user role
    - date_from: Filter logs from this date (ISO format)
    - date_to: Filter logs until this date (ISO format)
    """
    query = db.query(AuditLog)
    
    # Apply filters
    conditions = []
    
    if search:
        search_pattern = f"%{search}%"
        conditions.append(
            or_(
                AuditLog.actor_name.ilike(search_pattern),
                AuditLog.actor_email.ilike(search_pattern),
                AuditLog.endpoint.ilike(search_pattern),
            )
        )
    
    if status_filter:
        if status_filter == "success":
            conditions.append(and_(AuditLog.status_code >= 200, AuditLog.status_code < 300))
        elif status_filter == "client_error":
            conditions.append(and_(AuditLog.status_code >= 400, AuditLog.status_code < 500))
        elif status_filter == "server_error":
            conditions.append(AuditLog.status_code >= 500)
    
    if module:
        conditions.append(AuditLog.module == module)
    
    if role:
        conditions.append(AuditLog.role == role)
    
    if date_from:
        conditions.append(AuditLog.timestamp >= date_from)
    
    if date_to:
        conditions.append(AuditLog.timestamp <= date_to)
    
    if conditions:
        query = query.filter(and_(*conditions))
    
    # Get total count
    total = query.count()
    
    # Apply pagination and sorting
    logs = query.order_by(AuditLog.timestamp.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    # Format response
    return {
        "logs": [
            {
                "id": log.id,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                "user_id": log.user_id,
                "actor_name": log.actor_name,
                "actor_email": log.actor_email,
                "role": log.role,
                "ip_address": log.ip_address,
                "method": log.method,
                "endpoint": log.endpoint,
                "module": log.module,
                "status_code": log.status_code,
                "response_time_ms": log.response_time_ms,
                "request_id": log.request_id,
            }
            for log in logs
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }
