# Campus Connect ERP

A modern Education Resource Planning (ERP) system built for colleges and universities to manage students, faculty, departments, courses, attendance, and more. 

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** FastAPI, Python, SQLAlchemy
- **Database:** PostgreSQL (using SQLAlchemy ORM)

---

## Developer Setup Instructions

Follow these steps to run the Campus Connect ERP on your local machine.

### Prerequisites (Crucial for AI Agents & Developers)
To ensure complete compatibility and avoid confusion during setup or agent execution, ensure the following software versions are used:
- **Node.js**: v18.0.0 or higher (Tested with v22.x)
- **Python**: v3.10 or higher (Tested with v3.11.x)
- **PostgreSQL**: v14.0 or higher
- **Package Managers**: `npm` (for frontend) and `pip` (for backend)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Campus-Connect
```

### 2. Backend Setup (FastAPI)
Open a terminal and navigate to the `backend` folder. We will set up a Python virtual environment and install the required dependencies.

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Database Setup (PostgreSQL)
1. Install PostgreSQL (v14+) on your machine.
2. Create a new database named `campus_connect` using pgAdmin or the `psql` CLI.
3. In the `backend` folder, creates a file named `.env` and strictly use this format (replace username/password with your local postgres credentials):

```env
DATABASE_URL=postgresql://<username>:<password>@localhost:5432/campus_connect
SECRET_KEY=your_super_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

4. Initialize the Database tables (this will run SQLAlchemy `create_all` and seed default admins):
```bash
python init_db.py
```

#### Run the Backend Server
```bash
uvicorn app.main:app --reload --port 8000
```
> **Note for AI Agents**: Always ensure the virtual environment is activated before running any `pip` or `python` commands in the backend directory.

The backend API will be running at [http://localhost:8000](http://localhost:8000).
Interactive API Docs (Swagger UI) are available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 3. Frontend Setup (React / Vite)
Open a *new* terminal, separate from your backend, and navigate to the `frontend` folder.

```bash
cd frontend

# Install Node dependencies
npm install

# Start the development server
npm run dev
```
The frontend application will be running at [http://localhost:5173](http://localhost:5173).

---

## Default Login Credentials
Use the following credentials to access the different portals for testing:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@svcet.edu` | `admin123` |
| **Student** | (Import a student or create one via Admin) | `Welcome123` |
| **Faculty** | (Import a faculty or create one via Admin) | `Welcome123` |

*(Note: Faculty and Students can be easily imported using the "Bulk Import CSV" feature inside the Admin Dashboard).*
