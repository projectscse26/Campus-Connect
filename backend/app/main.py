from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback
from app.api import (
    auth, admin, departments, faculty, 
    students, authorities, discipline, late, leave, class_advisor
)
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Campus Connect ERP API",
    description="Backend API for Campus Connect Education Resource Planning System",
    version="1.0.0",
)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": traceback.format_exc()}
    )

# Configure CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://localhost:4173",
    "https://secure-healing-production-6347.up.railway.app",
    settings.FRONTEND_URL,
    ],
    allow_origin_regex="https://.*\.vercel\.app",
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

from app.api import alumni
app.include_router(alumni.router, prefix="/api/admin", tags=["Alumni"])

from app.api import retest
app.include_router(retest.router, prefix="/api/retest", tags=["Retest Marks"])


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

@app.get("/debug-api")
def debug_api():
    """Diagnostic endpoint - tests students/faculty DB queries without auth"""
    from app.core.database import SessionLocal
    from app.models.student import Student
    from app.models.faculty import Faculty
    import traceback
    
    results = {"students": None, "faculty": None, "cors_origins": None}
    db = SessionLocal()
    
    try:
        # Check CORS config
        for mw in app.user_middleware:
            if "CORS" in str(mw):
                results["cors_origins"] = str(mw.kwargs.get("allow_origins", "NOT_FOUND"))
        
        # Test students query
        try:
            students = db.query(Student).limit(3).all()
            results["students"] = {
                "count": db.query(Student).count(),
                "sample": [{"id": s.id, "name": f"{s.first_name} {s.last_name}", "has_section": s.section_id is not None} for s in students],
                "status": "OK"
            }
        except Exception as e:
            results["students"] = {"status": "ERROR", "error": str(e), "trace": traceback.format_exc()[-500:]}
        
        # Test faculty query
        try:
            faculty = db.query(Faculty).limit(3).all()
            results["faculty"] = {
                "count": db.query(Faculty).count(),
                "sample": [{"id": f.id, "name": f"{f.first_name} {f.last_name}"} for f in faculty],
                "status": "OK"
            }
        except Exception as e:
            results["faculty"] = {"status": "ERROR", "error": str(e), "trace": traceback.format_exc()[-500:]}
        
        # Test the actual serialization that the endpoints do
        try:
            from sqlalchemy.orm import joinedload
            students = db.query(Student).options(joinedload(Student.section)).limit(3).all()
            serialized = [
                {
                    "id": s.id,
                    "section": {"name": s.section.name} if s.section else None,
                }
                for s in students
            ]
            results["student_serialization"] = {"status": "OK", "data": serialized}
        except Exception as e:
            results["student_serialization"] = {"status": "ERROR", "error": str(e), "trace": traceback.format_exc()[-500:]}
            
    finally:
        db.close()
    
    return results
