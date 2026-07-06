from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import (
    auth, admin, departments, faculty, 
    students, authorities, discipline, late, leave, class_advisor, audit_logs
)
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Campus Connect ERP API",
    description="Backend API for Campus Connect Education Resource Planning System",
    version="1.0.0",
)

# Configure CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:3000", 
        "http://10.1.10.24:5173",
        "http://localhost:4173",
        "http://10.1.10.24:4173",
        settings.FRONTEND_URL,
        "https://robust-presence-production-82b0.up.railway.app",
        "https://campus-connect-production-6cbf.up.railway.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(discipline.router, prefix="/api/discipline", tags=["Discipline"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(departments.router, prefix="/api/departments", tags=["Departments"])
app.include_router(faculty.router, prefix="/api/faculty", tags=["Faculty"])
app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(late.router, prefix="/api/late", tags=["Late Tracker"])
app.include_router(authorities.router, prefix="/api/authorities", tags=["Authorities"])
app.include_router(leave.router, prefix="/api/leave", tags=["Leave Management"])
app.include_router(class_advisor.router, prefix="/api/class-advisor", tags=["Class Advisor"])
app.include_router(audit_logs.router, prefix="/api/audit-logs", tags=["Audit Logs"])
from app.api import courses
app.include_router(courses.router, prefix="/api/courses", tags=["Courses"])
from app.api import hod
app.include_router(hod.router, prefix="/api/hod", tags=["HOD"])
from app.api import announcements
app.include_router(announcements.router, prefix="/api/announcements", tags=["Announcements"])
from app.api import student_portal
app.include_router(student_portal.router, prefix="/api/student-portal", tags=["Student Portal"])

from app.api import gatepass
app.include_router(gatepass.router, prefix="/api/gatepass", tags=["Gate Pass"])

from app.api import retest
app.include_router(retest.router, prefix="/api/retest", tags=["Retest Marks"])

from app.middleware.audit_middleware import AuditLoggingMiddleware
app.add_middleware(AuditLoggingMiddleware)

@app.get("/")
def read_root():
    return {"message": "Welcome to Campus Connect ERP API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/import-db")
def import_db():
    from app.import_db_python import run_import
    result = run_import()
    if result == "success":
        return {"status": "success", "message": "Database imported perfectly!"}
    else:
        return {"status": "error", "error": result}

@app.get("/test-jwt")
def test_jwt(token: str):
    from jose import jwt
    from app.core.config import get_settings
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return {"status": "success", "payload": payload, "secret": settings.SECRET_KEY[:3] + "..."}
    except Exception as e:
        return {"status": "error", "error": str(e), "secret": settings.SECRET_KEY[:3] + "..."}



