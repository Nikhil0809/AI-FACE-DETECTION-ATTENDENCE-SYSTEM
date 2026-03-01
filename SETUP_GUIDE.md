# Enterprise AI Attendance System - Complete Setup Guide

## System Architecture Overview

```
Frontend (React + TypeScript)  <---WebSocket/HTTP---->  Backend (FastAPI)  <----->  PostgreSQL + pgvector
         (Port 5173)                                        (Port 8000)
```

## Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.10+ (for backend)
- **PostgreSQL** 13+ with pgvector extension
- **Redis** (for Celery task queue)
- **Git**

## Database Setup

### 1. Create PostgreSQL Database

```bash
sudo -u postgres psql

# Inside PostgreSQL:
CREATE DATABASE attendance_system ENCODING 'UTF8';
\c attendance_system
CREATE EXTENSION vector;
```

### 2. Initialize Database Schema

```bash
# Navigate to backend directory
cd backend

# Run initialization script
psql -U postgres -d attendance_system -f ../database_init.sql
```

### 3. Update Database Credentials

Edit `backend/app/config.py`:
```python
DB_HOST = "localhost"
DB_PORT = 5432
DB_NAME = "attendance_system"
DB_USER = "postgres"
DB_PASSWORD = "your_password"
```

## Backend Setup

### 1. Create Python Virtual Environment

```bash
cd backend

# Windows
python -m venv .venv
.\.venv\Scripts\activate

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run Backend Server

```bash
# With hot-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or start Celery worker in another terminal
celery -A app.tasks worker --loglevel=info
```

Backend will be available at: **http://localhost:8000**

## Frontend Setup

### 1. Install Dependencies

```bash
# Navigate to project root
cd ..

npm install
```

### 2. Configure Backend URL

Create `.env.local`:
```
VITE_API_URL=http://localhost:8000
```

or use the default in `src/app/api/apiClient.ts`:
```
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

### 3. Run Development Server

```bash
npm run dev
```

Frontend will be available at: **http://localhost:5173**

## Features & API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/login` | POST | Authenticate admin/faculty |
| `/register-faculty` | POST | Register new faculty |

### Student Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/register` | POST | Register student with face |
| `/students` | GET | Get all students |
| `/recognize` | POST | Recognize face for attendance |

### Attendance

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/attendance` | GET | Get attendance records |
| `/attendance/{id}` | POST | Mark attendance |

### Real-time WebSocket

| Endpoint | Type | Description |
|----------|------|-------------|
| `/ws` | WebSocket | Real-time updates for attendance/registration |

## Demo Credentials

### Admin Login
```
Email: admin@university.edu
Password: admin123
Role: Admin
```

### Faculty Login
```
Email: faculty@university.edu
Password: faculty123
Role: Faculty
```

## Login Feature Details

The login system now validates credentials against:
1. **Admin users**: Hardcoded credentials (can be moved to database)
2. **Faculty users**: Database authentication with password hashing

Credentials are validated using SHA256 hashing:
```python
# Password hashing
hashed_password = hashlib.sha256(password.encode()).hexdigest()

# Verification
if stored_hash == provided_hash:
    # Credentials valid
    return user_data
```

## Real-time Integration

The system uses WebSocket for real-time updates:

```typescript
// Connect to WebSocket
const ws = connectWebSocket((data) => {
  if (data.type === 'attendance_marked') {
    // Update UI with new attendance
  }
  if (data.type === 'student_registered') {
    // Update student list
  }
});
```

## Frontend Components (Updated)

All components now fetch real data from the backend:

### ✅ LoginPage
- Real authentication against backend
- Separate admin/faculty login paths
- Demo credentials button for testing
- Error handling and validation

### ✅ StudentRegistration
- Face capture with camera or file upload
- Two-step registration process
- Real face embedding extraction
- Connected to `/register` endpoint

### ✅ FacultyRegistration
- Email-based registration
- Password validation
- Department selection
- Connected to `/register-faculty` endpoint

### ✅ StudentManagement
- Removed all mock data
- Fetches students from `/students` endpoint
- Real-time updates via WebSocket
- Live search and filtering

### ✅ AttendanceMonitoring
- Real attendance records from database
- Dynamic daily stats
- WebSocket live updates
- Removed dummy present/absent lists

### ✅ Reports
- Real attendance data visualization
- Daily attendance heatmap
- Unique student counting
- Record statistics

### ✅ Dashboard
- Displays user information from login session
- Real attendance statistics
- Session-based user tracking

## Removed Features

❌ All hardcoded mock student data
❌ Duplicate student lists in JSON
❌ Dummy attendance records
❌ Static faculty information
❌ Pre-filled login forms (except demo)

## Database Schema

```sql
-- Users (Students)
users(
  id SERIAL PRIMARY KEY,
  roll_number VARCHAR(50) UNIQUE,
  name VARCHAR(255),
  department VARCHAR(100),
  face_vector vector(128),
  created_at TIMESTAMP
)

-- Faculty
faculty(
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  department VARCHAR(100),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Attendance
attendance(
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users,
  timestamp TIMESTAMP,
  confidence FLOAT
)
```

## Troubleshooting

### Port Already in Use
```bash
# Find process on port 8000
lsof -i :8000
kill -9 <PID>
```

### Database Connection Failed
```bash
# Test PostgreSQL connection
psql -U postgres -h localhost -d attendance_system

# Check pgvector extension
\dx vector
```

### Face Recognition Not Working
```bash
# Reinstall dependencies
pip uninstall -r requirements.txt
pip install -r requirements.txt
```

### WebSocket Connection Failed
Check browser console and ensure backend CORS is properly configured.

## Production Deployment

### Backend (FastAPI)
```bash
# Use Gunicorn with UVicorn workers
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

### Frontend (React)
```bash
# Build for production
npm run build

# Serve static files with your web server
# contents of dist/ folder
```

### Environment Variables (.env)
```
VITE_API_URL=https://api.yourdomain.com
DATABASE_URL=postgresql://user:pass@host:5432/attendance_system
REDIS_URL=redis://host:6379/0
```

## Support & Documentation

- FastAPI Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI Schema: http://localhost:8000/openapi.json

## License

This project is part of Enterprise AI Attendance System UI.
