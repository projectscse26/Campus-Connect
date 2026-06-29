# Campus Connect ERP – Development Progress

### How to Run the App Locally
Open two terminal windows from the root `Campus-Connect` folder:

**1. Start the Backend API (FastAPI)**
```powershell
cd backend
& "$env:USERPROFILE\miniconda3\envs\campus_connect\python.exe" -m uvicorn app.main:app --reload --port 8000
```

**2. Start the Frontend UI (React/Vite)**
```powershell
cd frontend
cmd /c "npm run dev"
```
*The app will be available at `http://localhost:5173/`*

---
## Phase 1: Foundation & Base Wiring
- [x] Backend Setup (FastAPI, Python 3.11 venv, dependencies)
- [x] Clean Architecture folder structure
- [x] Frontend Setup (React, Vite, TailwindCSS v4)
- [x] Feature-based folder structure

## Phase 2: Authentication & Role-Based Routing
- [x] Install React Router & UI Icons (`react-router-dom`, `lucide-react`)
- [x] Build global `AuthContext`
- [x] Build base `DashboardLayout` with responsive Sidebar and Header
- [x] Create Login Page UI
- [x] Create placeholder Dashboards (Admin, HOD, Faculty, Student, Authority)
- [x] Configure React Router protected routes

## Phase 2.5: Database Integration & Live Authentication
- [x] Setup PostgreSQL connection (`campus_connect` database)
- [x] Build SQLAlchemy Models (Users, Faculty, Students, Academic Structure)
- [x] Generate Tables & Seed Initial Users
- [x] Implement FastAPI JWT Authentication endpoints
- [x] Connect React Frontend (`AuthContext`, `Login`) to Live Backend API

## Phase 3: Core Infrastructure (Admin Portal)
- [x] Admin Dashboard UI
- [x] Department CRUD
- [x] Faculty Profile Management
- [x] Student Profile Management
- [x] Course Management

## Phase 4: Academic Routing (HOD Portal)
- [x] HOD Dashboard UI
- [x] Faculty to Course Assignment Logic
- [x] Mentor & Class Advisor Assignment
- [x] Department Monitoring Views

## Phase 5: LMS & Teaching Operations (Faculty Portal)
- [ ] Faculty Dashboard UI
- [ ] LMS Course Manager (Resources, Syllabus, Announcements)
- [ ] Attendance Entry Interface
- [ ] Grade Book & Assessment Entry

## Phase 6: Student Access & Leave Workflow (Student Portal)
- [ ] Student Dashboard UI
- [ ] LMS Viewer & Assignment Submission
- [ ] Leave Application Form
- [ ] Multi-step Leave Approval Logic (Student -> HOD)

## Phase 7: Analytics & Dashboards (Higher Authority)
- [ ] Authority Dashboard UI
- [ ] College-wide Analytics
- [ ] Discipline & Attendance Heatmaps
- [ ] Exportable Reports
