# Campus Connect — Team Handover Document

> **Document Type:** Project Handover & Collaboration Guide
> **Version:** 1.0
> **Status:** Active — Base Reference for All Teams
> **Audience:** All Team Members (Faculty Team · Student Team · Admin Team)

---

## 📌 How to Use This Document

This document is the **single source of truth** for the Campus Connect project.

- Read it fully before writing a single line of code
- Upload it to your Antigravity session as context so your AI assistant understands the project
- Refer back to it whenever you are unsure about ownership, conventions, or workflow
- This document will be updated as the project evolves — always use the latest version from the repository

---

## 1. Project Overview

**Campus Connect** is a production-grade **Smart Campus ERP and Learning Management System (LMS)** built for educational institutions.

It is a centralized digital platform that connects all stakeholders — students, faculty, department heads, deans, and institutional leadership — through a single unified system.

### What It Does

| Area | Description |
|---|---|
| **Academic Management** | Departments, programs, courses, semesters, academic years |
| **Learning Management** | Course materials, syllabus, resources, course announcements |
| **Assignment Management** | Creation, submission, grading, and feedback |
| **Attendance Management** | Session recording, tracking, analytics, alerts |
| **Assessment & Results** | Quizzes, internal marks, grade calculation, result publication |
| **Communication** | Announcements, notifications, messaging |
| **Analytics & Reporting** | Dashboards for every role — from faculty to principal |
| **Administrative Operations** | Student requests, approvals, certificate management |

### What It Is NOT (v1 Scope)

- Not a fee payment gateway (may be added later)
- Not a video conferencing tool
- Not a mobile app (web app, mobile-responsive)

---

## 2. Vision

> To create a connected digital campus where academic activities, administrative processes, communication, and learning resources are managed efficiently through one centralized system.

---

## 3. Confirmed Technology Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React + Vite | Fast development, modern tooling |
| **Styling** | Tailwind CSS | Utility-first, mobile responsive by default |
| **State Management** | Zustand | Lightweight, no boilerplate |
| **API Client** | Axios + React Query | Caching, loading states, auto-retry |
| **Backend** | FastAPI (Python) | High performance, async, auto-generates API docs |
| **ORM** | SQLModel | Built alongside FastAPI, combines SQLAlchemy + Pydantic |
| **Database** | PostgreSQL | Production-grade relational database |
| **Migrations** | Alembic | Schema version control for PostgreSQL |
| **Version Control** | Git + GitHub | Collaboration, branching, code review |

> ⚠️ **No Docker** — All team members run services locally. See Section 10 for setup.

---

## 4. User Roles & Permissions

Campus Connect has **7 distinct roles** grouped into **4 categories**.

### Role Definitions

```
┌─────────────────────────────────────────────────────────────┐
│  ADMIN (System Administrator / Developer)                   │
│  • Full platform access                                     │
│  • The ONLY role that can create user accounts              │
│  • Manages all system configuration                         │
│  • Sets up departments, programs, academic structure        │
└────────────────────────┬────────────────────────────────────┘
                         │ creates & manages all users
         ┌───────────────┼──────────────────────┐
         ▼               ▼                      ▼
  ┌────────────┐  ┌────────────┐    ┌──────────────────────────────────────┐
  │  FACULTY   │  │  STUDENT   │    │         HIGH AUTHORITY               │
  │            │  │            │    │                                      │
  │ Manages    │  │ Learns,    │    │  HOD (Head of Department)            │
  │ course     │  │ submits,   │    │  • Creates courses in their dept     │
  │ content,   │  │ views      │    │  • Assigns faculty to courses        │
  │ attendance,│  │ grades &   │    │  • Approves student requests         │
  │ grades     │  │ attendance │    │  • Views department analytics        │
  └────────────┘  └────────────┘    │                                      │
                                    │  DEAN                                │
                                    │  • Cross-department academic         │
                                    │    oversight & day-to-day operations │
                                    │  • Academic calendar management      │
                                    │  • Cross-dept analytics & reports    │
                                    │                                      │
                                    │  PRINCIPAL / VICE PRINCIPAL          │
                                    │  • Institution-wide oversight        │
                                    │  • High-level approvals              │
                                    │  • All analytics & summary reports   │
                                    └──────────────────────────────────────┘
```

### Permission Matrix

| Feature | Student | Faculty | HOD | Dean | Principal/VP | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| View own enrolled courses | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit assignments | ✅ | — | — | — | — | — |
| Create assignments | — | ✅ | — | — | — | ✅ |
| Upload LMS materials | — | ✅ | — | — | — | ✅ |
| Mark attendance | — | ✅ | — | — | — | ✅ |
| View own attendance | ✅ | — | — | — | — | ✅ |
| View dept attendance report | — | — | ✅ | ✅ | ✅ | ✅ |
| Create & run assessments | — | ✅ | — | — | — | ✅ |
| Take quizzes | ✅ | — | — | — | — | — |
| Publish results | — | ✅ | — | — | — | ✅ |
| Create courses | — | — | ✅ | — | — | ✅ |
| Assign faculty to course | — | — | ✅ | — | — | ✅ |
| Enroll students into course | — | — | ✅ | — | — | ✅ |
| Approve student requests | — | — | ✅ | ✅ | ✅ | ✅ |
| View department analytics | — | — | ✅ | ✅ | ✅ | ✅ |
| View institution-wide analytics | — | — | — | ✅ | ✅ | ✅ |
| Create user accounts | — | — | — | — | — | ✅ |
| System configuration | — | — | — | — | — | ✅ |

---

## 5. System Architecture

### High-Level Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                            │
│             React + Vite + Tailwind CSS (Mobile Responsive)      │
│     Student UI | Faculty UI | HOD UI | Dean UI | Principal UI    │
│                        Admin UI                                  │
└─────────────────────────────┬────────────────────────────────────┘
                              │ HTTPS REST API calls
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
│                 FastAPI — REST API /api/v1/                       │
│          JWT Authentication Middleware on every request          │
│             CORS | Rate Limiting | Input Validation              │
└────┬────────┬────────┬────────┬────────┬────────┬────────┬───────┘
     │        │        │        │        │        │        │
  [auth]  [users] [academics] [courses] [lms] [assignments] [attendance]
                                             [assessments] [communication]
                                             [analytics]   [admin_ops]
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                               │
│                   PostgreSQL Database                            │
│              SQLModel ORM | Alembic Migrations                   │
└──────────────────────────────────────────────────────────────────┘
```

### Backend Module Internal Structure

Every module follows this **exact same structure**. Never deviate from it.

```
backend/app/modules/assignments/
├── __init__.py
├── router.py       ← API route definitions
├── models.py       ← SQLModel DB table definitions
├── schemas.py      ← Pydantic request/response shapes
├── service.py      ← All business logic (called by router)
├── dependencies.py ← Module-specific dependency injection
└── exceptions.py   ← Custom HTTP exceptions for this module
```

---

## 6. Complete Module Breakdown

### Modules and What They Contain

| Module | Key Entities | Key Actions |
|---|---|---|
| `auth` | Token, Session | Login, logout, refresh token |
| `users` | User, UserProfile | CRUD users, assign roles, manage profiles |
| `academics` | Department, Program, AcademicYear, Semester | Structure the institution |
| `courses` | Course, CourseAllocation, CourseEnrollment | HOD creates, assigns faculty, enrolls students |
| `lms` | Material, Syllabus, CourseAnnouncement | Faculty uploads content, students view |
| `assignments` | Assignment, Submission | Faculty creates, students submit, faculty grades |
| `attendance` | AttendanceSession, AttendanceRecord | Faculty marks, all roles view their scope |
| `assessments` | Assessment, Question, Result | Faculty creates quiz/test, students take it |
| `communication` | Announcement, Message, Notification | System-wide messaging and alerts |
| `analytics` | (derived data, no own tables) | Reports and dashboards per role |
| `admin_ops` | StudentRequest, Certificate, Approval | Student service operations |

---

## 7. The Core Academic Workflow

This is the fundamental flow everything in the system revolves around:

```
Step 1:  Admin sets up the institution
         └── Creates departments, programs, academic years, semesters
                         ↓
Step 2:  Admin creates user accounts and assigns roles
         └── Faculty, Students, HODs, Deans, Principal, VP
                         ↓
Step 3:  HOD creates courses for their department
         └── "CS301 - Data Structures" under Computer Science, Semester 3
                         ↓
Step 4:  HOD assigns faculty to courses
         └── "Dr. Sharma is assigned to CS301 Section A"
                         ↓
Step 5:  HOD (or Admin) enrolls students into courses
         └── "Students of Batch 2024, Sem 3 enrolled in CS301"
                         ↓
Step 6:  Faculty manages the course
         ├── Uploads LMS materials (PDFs, slides, links)
         ├── Creates and publishes assignments
         ├── Marks attendance every session
         ├── Conducts quizzes and internal assessments
         └── Publishes grades and results
                         ↓
Step 7:  Students access and interact
         ├── View course content and materials
         ├── Submit assignments before deadlines
         ├── Take quizzes
         └── View attendance % and grades
                         ↓
Step 8:  HOD / Dean / Principal view reports
         ├── Department attendance overview
         ├── Course performance analytics
         └── Institution-wide statistics
```

---

## 8. Team Structure & Ownership

### Overview

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────┐
│  FACULTY TEAM   │   │  STUDENT TEAM   │   │    ADMIN TEAM       │
│  (~4 members)   │   │  (~4 members)   │   │    (~4 members)     │
│                 │   │                 │   │                     │
│ Builds:         │   │ Builds:         │   │ Builds:             │
│ • Faculty UI    │   │ • Student UI    │   │ • Admin UI          │
│ • Backend for   │   │ • (No new APIs) │   │ • HOD UI            │
│   content       │   │ • Consumes APIs │   │ • Dean UI           │
│   creation      │   │   from other    │   │ • Principal/VP UI   │
│   modules       │   │   teams         │   │ • Backend core      │
└─────────────────┘   └─────────────────┘   └─────────────────────┘
```

---

### 🔵 Faculty Team

**Owns:** All backend modules where faculty *create* data. Plus the faculty-facing frontend.

**Golden Rule:** If a faculty member is the one creating or managing the data → Faculty Team owns that module's backend.

#### Backend Modules Owned

| Module | What Faculty Team builds |
|---|---|
| `lms/` | Materials upload, syllabus management, course announcements |
| `assignments/` | Assignment creation, submission grading, feedback |
| `attendance/` | Attendance session creation, marking, reports per course |
| `assessments/` | Quiz creation, question bank, assessment runs, result publishing |

#### Frontend Pages Built

- Faculty Dashboard (overview of my courses, today's sessions)
- Course Detail View (for assigned courses)
- LMS material upload & management
- Assignment creation, list, grading interface
- Attendance marking panel (session-by-session)
- Quiz/assessment builder
- Grade entry and result publishing
- Faculty profile

#### APIs Faculty Team Must Expose (for Student Team to consume)

> Faculty Team must document these in `docs/api-contracts.md` before Student Team builds

- `GET /api/v1/lms/materials/?course_id={id}` — list materials for a course
- `GET /api/v1/assignments/?course_id={id}` — list assignments
- `POST /api/v1/assignments/{id}/submit` — student submits
- `GET /api/v1/attendance/student/{student_id}` — student's own attendance
- `GET /api/v1/assessments/?course_id={id}` — list assessments
- `POST /api/v1/assessments/{id}/attempt` — student takes quiz
- `GET /api/v1/assessments/results/{student_id}` — student's results

---

### 🟢 Student Team

**Owns:** The complete student-facing frontend experience. Does NOT build new backend modules.

**Golden Rule:** Student Team consumes APIs from Faculty Team and Admin Team. They build UI only.

#### How Student Team Works

1. Wait for API contracts from Faculty Team and Admin Team
2. Build student UI pages using those contracts
3. Use mock data (or mock API server) while actual APIs are being developed
4. Test with real APIs once Faculty/Admin Teams complete their endpoints

#### Frontend Pages Built

| Page | API Owner |
|---|---|
| Student Dashboard | Admin Team |
| My Courses (enrolled list) | Admin Team (`courses` module) |
| Course Detail (materials, syllabus) | Faculty Team (`lms` module) |
| Assignments — list, view, submit | Faculty Team (`assignments` module) |
| Submission History & Feedback | Faculty Team |
| Attendance — own record, % | Faculty Team (`attendance` module) |
| Quizzes — take quiz, view results | Faculty Team (`assessments` module) |
| Results & Grades | Faculty Team |
| Announcements & Notifications | Admin Team (`communication` module) |
| Student Requests (leave, certificate) | Admin Team (`admin_ops` module) |
| Profile & Settings | Admin Team (`users` module) |

#### Student Team's Dependencies

Before building any page, Student Team needs:
- [ ] Login/Auth working (Admin Team — Sprint 1)
- [ ] Course enrollment API (Admin Team — Sprint 1)
- [ ] API contracts documented (Faculty Team — before Sprint 2)

---

### 🔴 Admin Team

**Owns:** The platform foundation, all system management modules, and the dashboards for Admin, HOD, Dean, Principal, and VP.

**Golden Rule:** System configuration, user management, academic structure, course creation/allocation, analytics, approvals → Admin Team owns all of this.

#### Backend Modules Owned

| Module | What Admin Team builds |
|---|---|
| `core/` | Database engine, JWT security, shared dependencies, global exception handlers |
| `auth/` | Login endpoint, token refresh, logout |
| `users/` | Full user CRUD, profile management, role assignment |
| `academics/` | Departments, programs, academic years, semesters |
| `courses/` | HOD creates courses, HOD assigns faculty, HOD/Admin enrolls students |
| `communication/` | System announcements, push notifications, messaging |
| `analytics/` | Aggregated reports for all authority levels |
| `admin_ops/` | Student requests, approvals, certificate issuance |

#### Frontend Pages Built

| Role | Pages Built by Admin Team |
|---|---|
| **Admin** | User management, role assignment, department setup, system config |
| **HOD** | Create course, assign faculty, enroll students, view dept analytics, approve requests |
| **Dean** | Cross-department dashboard, academic calendar, operational reports |
| **Principal/VP** | Institution dashboard, high-level analytics, approval queue |
| **All roles** | Login page, profile page, notification center |

#### Admin Team Must Build First (Blockers for Other Teams)

> Sprint 1 is owned by Admin Team. Faculty and Student Teams CANNOT start real development until:

- [ ] Auth module complete (login → JWT → role-based access)
- [ ] User module complete (so test accounts can be created)
- [ ] Academic structure module complete (departments, programs, semesters exist)
- [ ] Course module partially complete (create course, assign faculty, enroll students)

---

## 9. Cross-Team Collaboration

This section defines how teams work together without stepping on each other.

### The Dependency Chain

```
Admin Team builds foundation
        ↓
Faculty Team builds content creation APIs
        ↓
Student Team builds consumption UI
```

Teams at the same level can work in parallel. Teams downstream depend on teams upstream.

### API Contract Process

When Faculty Team builds a backend endpoint that Student Team will use:

1. **Faculty Team defines the contract first** (before writing the actual code)
2. Contract is written in `docs/api-contracts.md`
3. Student Team reviews and agrees
4. Both teams build in parallel — Student Team uses mock data
5. Integration and testing once both sides are done

**Contract format:**

```markdown
## Endpoint: List Assignments for a Course
- **URL:** GET /api/v1/assignments/
- **Owner:** Faculty Team
- **Consumer:** Student Team
- **Auth required:** Yes (Student, Faculty, HOD, Admin)
- **Query params:** course_id (required)

**Response 200:**
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Lab Report 1",
      "description": "Write a lab report for experiment 3",
      "due_date": "2026-07-15T23:59:00",
      "max_marks": 20,
      "submitted": false,
      "submission_date": null
    }
  ]
}
```

### Communication Rules

| Situation | What to do |
|---|---|
| You need an API from another team | Open a GitHub Issue, tag the owning team |
| You're changing an existing API contract | Notify all consumer teams BEFORE changing |
| You find a bug in another team's code | Open a GitHub Issue, do NOT fix it yourself |
| You need to share a utility/helper | Add it to `backend/app/core/` (discuss first) |
| A feature needs two teams to build together | Raise it in the team group, plan a sync |

### Shared Code Rules

- **Never modify another team's module files**
- Shared utilities go into `backend/app/core/` or `frontend/src/components/ui/`
- Any change to shared code requires approval from all 3 team leads
- The shared component library (`frontend/src/components/`) is owned by **Admin Team** — raise a PR if you need a new shared component

---

## 10. Project Folder Structure

```
Campus-Connect/                        ← Root of monorepo
│
├── frontend/                          ← React + Vite + Tailwind
│   ├── public/
│   └── src/
│       ├── components/                ← Shared components (Admin Team maintains)
│       │   ├── ui/                    ← Buttons, Inputs, Modals, Tables, Badges
│       │   ├── layout/                ← Navbar, Sidebar, PageWrapper, Footer
│       │   └── common/               ← LoadingSpinner, ErrorBoundary, EmptyState
│       ├── features/                  ← Feature modules, mirroring backend
│       │   ├── auth/
│       │   ├── users/
│       │   ├── academics/
│       │   ├── courses/
│       │   ├── lms/
│       │   ├── assignments/
│       │   ├── attendance/
│       │   ├── assessments/
│       │   ├── communication/
│       │   └── analytics/
│       ├── pages/                     ← Role-specific page components
│       │   ├── auth/                  ← Login, forgot password
│       │   ├── student/               ← Student Team builds here
│       │   ├── faculty/               ← Faculty Team builds here
│       │   ├── hod/                   ← Admin Team builds here
│       │   ├── authority/             ← Admin Team builds here (Dean, Principal, VP)
│       │   ├── admin/                 ← Admin Team builds here
│       │   └── shared/               ← Profile, notifications (Admin Team)
│       ├── hooks/                     ← Custom React hooks
│       ├── services/                  ← Axios API call functions
│       ├── store/                     ← Zustand global state slices
│       ├── utils/                     ← Date formatters, validators, helpers
│       ├── types/                     ← Shared TypeScript/JSDoc types
│       ├── router/                    ← Route definitions + role-based guards
│       ├── App.jsx
│       └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── core/                      ← Admin Team owns — DO NOT MODIFY without discussion
│   │   │   ├── config.py              ← Environment settings
│   │   │   ├── database.py            ← DB session and engine
│   │   │   ├── security.py            ← JWT creation and verification
│   │   │   ├── dependencies.py        ← get_current_user, require_role()
│   │   │   └── exceptions.py          ← Global HTTP exception handlers
│   │   │
│   │   ├── modules/
│   │   │   ├── auth/                  ← Admin Team
│   │   │   ├── users/                 ← Admin Team
│   │   │   ├── academics/             ← Admin Team
│   │   │   ├── courses/               ← Admin Team (HOD workflow)
│   │   │   ├── lms/                   ← Faculty Team
│   │   │   ├── assignments/           ← Faculty Team
│   │   │   ├── attendance/            ← Faculty Team
│   │   │   ├── assessments/           ← Faculty Team
│   │   │   ├── communication/         ← Admin Team
│   │   │   ├── analytics/             ← Admin Team
│   │   │   └── admin_ops/             ← Admin Team
│   │   │
│   │   └── main.py                    ← App init, include all routers
│   │
│   ├── migrations/                    ← Alembic — run by Admin Team, all teams add models
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
│
├── docs/                              ← Project documentation
│   ├── HANDOVER.md                    ← This document
│   ├── api-contracts.md               ← Cross-team API agreements
│   ├── db-schema.md                   ← Full database schema reference
│   └── onboarding.md                  ← New member setup guide
│
├── .github/
│   └── workflows/
│       ├── backend-ci.yml             ← Runs on every PR to develop
│       └── frontend-ci.yml
│
├── .gitignore
└── README.md
```

---

## 11. Git Branching Strategy

### Branch Structure

```
main                          ← Production only. Protected.
  └── develop                 ← All work merges here first. Protected.
        ├── team/faculty      ← Faculty Team integration branch
        │     ├── feature/lms-materials
        │     ├── feature/assignment-system
        │     ├── feature/attendance-module
        │     └── feature/assessment-engine
        │
        ├── team/student      ← Student Team integration branch
        │     ├── feature/student-dashboard
        │     ├── feature/assignment-submission-ui
        │     ├── feature/attendance-view
        │     └── feature/quiz-ui
        │
        └── team/admin        ← Admin Team integration branch
              ├── feature/auth-module
              ├── feature/user-management
              ├── feature/academic-structure
              ├── feature/course-hod-workflow
              ├── feature/communication-hub
              └── feature/analytics-dashboard
```

### Branch Protection Rules

| Branch | Rule |
|---|---|
| `main` | No direct push. PR required. Minimum 2 approvals. CI must pass. |
| `develop` | No direct push. PR required. Minimum 1 cross-team approval. CI must pass. |
| `team/*` | No direct push from non-team members. PR required within team. |
| `feature/*` | Open — individual developer work |

### Day-to-Day Git Workflow

```bash
# 1. Start a new feature — always branch from your team branch
git checkout team/faculty
git pull origin team/faculty
git checkout -b feature/lms-materials

# 2. Work on your feature, commit regularly
git add .
git commit -m "feat(lms): add material upload endpoint"

# 3. Push your feature branch
git push origin feature/lms-materials

# 4. Open PR: feature/lms-materials → team/faculty
#    Get reviewed by a teammate → merge

# 5. When feature is complete and tested on team branch:
#    Open PR: team/faculty → develop
#    Get reviewed by another team → merge

# 6. develop → main happens at release time only
```

### Commit Message Format (Conventional Commits)

All commits must follow this format:

```
<type>(<module>): <short description>

Types:
  feat      → New feature
  fix       → Bug fix
  docs      → Documentation only
  style     → Formatting, no logic change
  refactor  → Code restructure, no feature change
  test      → Adding or updating tests
  chore     → Config, dependencies, build scripts

Examples:
  feat(assignments): add submission deadline enforcement
  fix(attendance): resolve duplicate session creation bug
  docs(api-contracts): add quiz attempt contract
  chore(deps): upgrade sqlmodel to 0.0.18
```

---

## 12. API Design Conventions

All 3 teams must follow these conventions consistently so the system feels uniform.

### URL Structure

```
/api/v1/{module}/{resource}
/api/v1/{module}/{resource}/{id}
/api/v1/{module}/{resource}/{id}/{sub-resource}

Examples:
  GET    /api/v1/courses/                          List all courses
  POST   /api/v1/courses/                          Create a course (HOD only)
  GET    /api/v1/courses/{id}                      Get course details
  PUT    /api/v1/courses/{id}                      Update course
  DELETE /api/v1/courses/{id}                      Soft delete course
  GET    /api/v1/courses/{id}/enrollments          List enrollments
  POST   /api/v1/assignments/{id}/submit           Student submits assignment
  GET    /api/v1/attendance/{course_id}/report     Attendance report for a course
```

### Standard Response Envelope

Every API response must use this wrapper:

```json
// Single resource success
{
  "success": true,
  "data": { },
  "message": "Course created successfully"
}

// List success (paginated)
{
  "success": true,
  "data": [ ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "ASSIGNMENT_NOT_FOUND",
    "message": "Assignment with ID 42 does not exist"
  }
}
```

### HTTP Status Codes

| Code | When to Use |
|---|---|
| `200 OK` | Successful GET or PUT |
| `201 Created` | Successful POST (resource created) |
| `204 No Content` | Successful DELETE |
| `400 Bad Request` | Client sent invalid data |
| `401 Unauthorized` | No token or invalid token |
| `403 Forbidden` | Valid token but wrong role |
| `404 Not Found` | Resource does not exist |
| `422 Unprocessable Entity` | FastAPI validation error (auto-generated) |
| `500 Internal Server Error` | Server-side crash (log and fix immediately) |

### Role-Based Access in FastAPI

```python
# In any router file — how to protect routes by role:
from app.core.dependencies import get_current_user, require_role
from app.modules.users.models import UserRole

@router.post("/")
def create_assignment(
    data: AssignmentCreate,
    current_user = Depends(require_role([UserRole.FACULTY, UserRole.ADMIN]))
):
    ...

@router.get("/{id}/submit")
def submit_assignment(
    id: int,
    current_user = Depends(require_role([UserRole.STUDENT]))
):
    ...
```

---

## 13. Database Conventions

### Every Table Must Have

```python
class BaseModel(SQLModel):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_deleted: bool = Field(default=False)  # Soft delete — never hard delete
```

### Table Naming

- Use `snake_case` for all table names
- Prefix with module name: `lms_materials`, `course_enrollments`, `attendance_sessions`
- Junction tables: `course_enrollments` (not `course_student`)

### User Roles Enum

```python
class UserRole(str, Enum):
    STUDENT = "STUDENT"
    FACULTY = "FACULTY"
    HOD = "HOD"
    DEAN = "DEAN"
    PRINCIPAL = "PRINCIPAL"
    VICE_PRINCIPAL = "VICE_PRINCIPAL"
    ADMIN = "ADMIN"
```

### Migration Rules

- Every model change requires an Alembic migration
- Never edit existing migration files
- Migration file naming: `alembic revision --autogenerate -m "add assignment feedback column"`
- Admin Team runs migrations and shares the migration file via PR — other teams do NOT run `alembic revision` independently for shared tables

---

## 14. Local Development Setup

### Prerequisites (install before anything else)

- **Python 3.11+** — [python.org](https://python.org)
- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **PostgreSQL 15+** — [postgresql.org](https://postgresql.org)
- **Git** — [git-scm.com](https://git-scm.com)
- **pgAdmin 4** (recommended) — GUI for PostgreSQL

### Step 1 — Clone and Setup

```bash
git clone https://github.com/[org]/Campus-Connect.git
cd Campus-Connect

# Switch to develop branch
git checkout develop
```

### Step 2 — Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Now edit .env and fill in your PostgreSQL credentials
```

**Edit `.env`:**
```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/campus_connect
SECRET_KEY=your-secret-key-here-min-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

```bash
# Create the PostgreSQL database (via pgAdmin or psql)
# Database name: campus_connect

# Run migrations
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

### Step 3 — Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit: VITE_API_BASE_URL=http://localhost:8000

# Start the frontend dev server
npm run dev
```

### Step 4 — Verify Everything Works

| Service | URL | Expected |
|---|---|---|
| Frontend | http://localhost:5173 | Login page loads |
| Backend | http://localhost:8000 | `{"message": "Campus Connect API"}` |
| API Docs | http://localhost:8000/docs | Swagger UI |
| API Docs | http://localhost:8000/redoc | Redoc UI |
| pgAdmin | http://localhost:5050 | DB browser |

---

## 15. Sprint Plan

### Sprint 0 — Project Setup (All Teams, Week 1-2)

**All teams complete together before any feature work:**

- [ ] All members clone repo and complete local setup
- [ ] All branches created: `develop`, `team/admin`, `team/faculty`, `team/student`
- [ ] Frontend: Vite + React + Tailwind scaffold, folder structure, shared component library started
- [ ] Backend: FastAPI scaffold, core module, database connection, all module folders created
- [ ] GitHub Actions CI configured (lint + basic checks on PR)
- [ ] Shared design system agreed (colors, fonts, spacing)

---

### Sprint 1 — Foundation (Admin Team leads, Week 3-5)

**Faculty and Student Teams: work on UI wireframes and design during Sprint 1**

- [ ] Auth module: login, JWT, refresh token, logout
- [ ] Users module: CRUD, profile management, role assignment
- [ ] Academics module: departments, programs, academic years, semesters
- [ ] Course module (partial): create course, assign faculty, enroll students
- [ ] Frontend: Login page, role-based routing, shared layout (Navbar, Sidebar)
- [ ] API contracts documented for Sprint 2 (Faculty Team publishes contracts)

**Deliverable:** Any team member can log in with a role and see their dashboard shell.

---

### Sprint 2 — Academic Core (Faculty + Admin Teams, Week 6-9)

- [ ] LMS module: material upload, syllabus, course announcements (Faculty Team)
- [ ] Assignment module: create, list, submit, grade (Faculty Team)
- [ ] Attendance module: sessions, mark, view (Faculty Team)
- [ ] Course module: complete remaining features (Admin Team)
- [ ] Communication: announcements, notifications (Admin Team)
- [ ] Student UI: courses, LMS view, assignments (Student Team — consumes Sprint 1+2 APIs)

**Deliverable:** Faculty can manage a course. Students can view and submit.

---

### Sprint 3 — Assessment & Analytics (All Teams, Week 10-13)

- [ ] Assessments: quiz creation, question bank, student takes quiz (Faculty Team)
- [ ] Results: grade calculation, result publication (Faculty Team)
- [ ] Analytics: HOD, Dean, Principal dashboards (Admin Team)
- [ ] Admin ops: student requests, approvals, certificates (Admin Team)
- [ ] Student UI: quizzes, results, requests (Student Team)

**Deliverable:** Full academic cycle from course creation to result publication.

---

### Sprint 4 — Polish & Production (All Teams, Week 14-16)

- [ ] Cross-team integration testing
- [ ] Mobile responsiveness audit across all pages
- [ ] Performance review (API response times, frontend bundle size)
- [ ] Security audit (authorization checks, input sanitization)
- [ ] Documentation: API docs finalized, user guides written
- [ ] Production deployment

---

## 16. Code Quality Rules

These rules apply to ALL teams, NO exceptions:

### General

- No commented-out code in PRs
- No `print()` debugging in production code — use Python `logging` module
- No `console.log()` debugging left in frontend PRs
- Every function/endpoint must have a docstring or JSDoc comment
- Write code that a teammate can understand without asking you

### Backend

- All endpoints must be protected — no unauth'd route unless it's login
- Always validate inputs using Pydantic schemas — never trust raw request data
- Use the service layer for business logic — routers only handle HTTP
- Handle errors explicitly — never let exceptions silently swallow

### Frontend

- All forms must have validation before submit
- Show loading states during API calls
- Show meaningful error messages to users (not raw API errors)
- Every interactive element must have a unique `id` attribute
- Mobile responsiveness is not optional — test on 375px width

### Git

- Never force-push to `develop` or `main`
- PR must have a clear description of what changed and why
- Link PRs to GitHub Issues
- Do not merge your own PR — always get a review

---

## 17. Open Questions (To Be Decided by Team Leads)

These decisions are pending and will be updated in this document once resolved:

| # | Question | Status |
|---|---|---|
| 1 | File uploads (assignments, LMS materials) — local or cloud storage? | ⏳ Pending |
| 2 | Deployment target — VPS, cloud, or college server? | ⏳ Pending |
| 3 | Email notifications — in-app only or email too for v1? | ⏳ Pending |
| 4 | QR-based attendance — in scope for v1? | ⏳ Pending |
| 5 | TypeScript strict mode or plain JavaScript on frontend? | ⏳ Pending |
| 6 | Dean's specific day-to-day operational features — TBD by Admin Team | ⏳ Pending |

---

## 18. Key Contacts & Resources

> Update this section with actual names and links.

| Role | Name | Team | Responsibility |
|---|---|---|---|
| Project Lead | [Name] | — | Overall decisions, this document |
| Admin Team Lead | [Name] | Admin | Foundation, auth, authority dashboards |
| Faculty Team Lead | [Name] | Faculty | Content modules, faculty UI |
| Student Team Lead | [Name] | Student | Student UI, API contract consumption |

### Important Links

- GitHub Repository: `https://github.com/[org]/Campus-Connect`
- API Documentation (local): `http://localhost:8000/docs`
- Project Board: `[GitHub Projects link]`
- Design Files: `[Figma link if applicable]`

---

## 19. Glossary

| Term | Meaning in Campus Connect |
|---|---|
| **Course** | A subject taught in a semester (e.g., CS301 - Data Structures) |
| **Course Allocation** | HOD assigning a faculty to teach a specific course |
| **Course Enrollment** | A student being added to a course |
| **Session** | A single class/lecture recorded for attendance |
| **Assessment** | A formal evaluation — quiz, internal exam, or test |
| **Submission** | A student's response to an assignment |
| **HOD** | Head of Department — manages one department |
| **API Contract** | An agreed-upon URL + request/response format between two teams |
| **Soft Delete** | Marking a record as deleted without removing it from the database |
| **Module** | A backend folder (`backend/app/modules/x/`) that owns one feature area |
| **Feature Branch** | A short-lived Git branch for one specific piece of work |

---

*This document is maintained in the repository at `docs/HANDOVER.md`.
Always pull the latest version before starting new work.*

*Last updated by: Project Lead | Version 1.0*
