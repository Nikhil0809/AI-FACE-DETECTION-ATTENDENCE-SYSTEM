from fastapi import FastAPI, UploadFile, File, Form, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import base64
import json
import asyncio
from typing import List

from app.ai_engine import extract_face_embedding
from app.models import (
    insert_user, get_all_users, find_nearest_user, insert_attendance,
    insert_faculty, authenticate_faculty, authenticate_admin, get_all_faculty,
    get_attendance_records, insert_admin, delete_all_students, delete_all_attendance,
    reset_database
)
from app.worker import process_frame

app = FastAPI(title="Enterprise AI Attendance System")

# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager for real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting message: {e}")


manager = ConnectionManager()


@app.get("/")
def health_check():
    return {"status": "Backend Running 🚀"}


# -------------------------
# AUTHENTICATION
# -------------------------
@app.post("/login")
async def login(email: str = Form(...), password: str = Form(...), role: str = Form(...)):
    """
    Authenticate user (admin or faculty)
    """
    if role == "admin":
        user = authenticate_admin(email, password)
        if user:
            return {"status": "success", "user": user}
        return {"status": "error", "message": "Invalid admin credentials"}
    
    elif role == "faculty":
        user = authenticate_faculty(email, password)
        if user:
            return {"status": "success", "user": user}
        return {"status": "error", "message": "Invalid faculty credentials"}
    
    return {"status": "error", "message": "Invalid role"}


# -------------------------
# FACULTY MANAGEMENT
# -------------------------
@app.post("/register-faculty")
async def register_faculty(
    email: str = Form(...),
    password: str = Form(...),
    name: str = Form(...),
    department: str = Form(...)
):
    """Register a new faculty member"""
    try:
        if insert_faculty(email, password, name, department):
            return {"status": "success", "message": "Faculty registered successfully"}
        return {"status": "error", "message": "Faculty with this email already exists"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/register-admin")
async def register_admin_endpoint(
    email: str = Form(...),
    password: str = Form(...),
    name: str = Form(...),
    department: str = Form(...)
):
    """Register a new admin"""
    try:
        if insert_admin(email, password, name, department):
            return {"status": "success", "message": "Admin registered successfully"}
        return {"status": "error", "message": "Admin with this email already exists"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/faculty")
def get_faculty():
    """Get all faculty members"""
    faculty = get_all_faculty()
    return {"status": "success", "faculty": faculty}


# -------------------------
# USER REGISTRATION (Students)
# -------------------------
@app.post("/register")
async def register_user(
    roll_number: str = Form(...),
    name: str = Form(...),
    department: str = Form(...),
    file: UploadFile = File(...)
):
    image_bytes = await file.read()
    embedding = extract_face_embedding(image_bytes)

    if embedding is None:
        return {"status": "error", "message": "No face detected"}

    insert_user(roll_number, name, department, embedding)

    # Broadcast student registration event
    await manager.broadcast({
        "type": "student_registered",
        "data": {
            "rollNumber": roll_number,
            "name": name,
            "department": department
        }
    })

    return {"status": "success", "message": "User registered successfully"}


@app.get("/students")
def get_students():
    """Get all registered students"""
    students = get_all_users()
    return {"status": "success", "students": students}


# -------------------------
# REAL-TIME RECOGNITION
# -------------------------
@app.post("/recognize")
async def recognize(file: UploadFile = File(...)):
    image_bytes = await file.read()
    task = process_frame.delay(image_bytes)
    return {"status": "processing", "task_id": task.id}


# -------------------------
# ATTENDANCE
# -------------------------
@app.get("/attendance")
def get_attendance(limit: int = 100):
    """Get recent attendance records"""
    records = get_attendance_records(limit)
    return {"status": "success", "attendance": records}


@app.post("/attendance/{student_id}")
async def mark_attendance(student_id: int):
    """Mark attendance for a student"""
    try:
        insert_attendance(student_id)
        
        # Broadcast attendance event
        await manager.broadcast({
            "type": "attendance_marked",
            "data": {"student_id": student_id}
        })
        
        return {"status": "success", "message": "Attendance marked"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# -------------------------
# ADMIN OPERATIONS
# -------------------------
@app.delete("/admin/delete-students")
async def delete_students_endpoint():
    """Delete all students from database (admin only)"""
    try:
        if delete_all_students():
            await manager.broadcast({"type": "database_reset", "target": "students"})
            return {"status": "success", "message": "All students deleted successfully"}
        return {"status": "error", "message": "Failed to delete students"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.delete("/admin/delete-attendance")
async def delete_attendance_endpoint():
    """Delete all attendance records (admin only)"""
    try:
        if delete_all_attendance():
            await manager.broadcast({"type": "database_reset", "target": "attendance"})
            return {"status": "success", "message": "All attendance records deleted successfully"}
        return {"status": "error", "message": "Failed to delete attendance"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/admin/reset-database")
async def reset_database_final():
    """Reset entire database to initial state (admin only)"""
    try:
        if reset_database():
            await manager.broadcast({"type": "database_reset", "target": "all"})
            return {"status": "success", "message": "Database reset successfully"}
        return {"status": "error", "message": "Failed to reset database"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# -------------------------
# WEBSOCKET - Real-time Updates
# -------------------------
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time attendance and registration updates
    """
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Echo back or process message
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
