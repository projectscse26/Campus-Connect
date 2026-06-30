from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import (
    auth, admin, departments, faculty, 
    students, authorities, discipline, late, leave, class_advisor
)

app = FastAPI(
    title="Campus Connect ERP API",
    description="Backend API for Campus Connect Education Resource Planning System",
    version="1.0.0",
)

# Configure CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
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

@app.get("/")
def read_root():
    return {"message": "Welcome to Campus Connect ERP API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
