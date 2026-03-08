from fastapi import FastAPI, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import json
import asyncio


from app.ai_engine import extract_face_embedding
from app.models import (
    insert_user, get_all_users, insert_attendance,
    insert_faculty, authenticate_faculty, authenticate_admin,
    get_all_faculty, get_attendance_records, insert_admin,
    delete_all_students, delete_all_attendance, reset_database
)
from app.worker import process_frame

app = FastAPI(title="Enterprise AI Attendance System")

# -----------------------------
# CORS CONFIGURATION
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# WEBSOCKET CONNECTION MANAGER
# -----------------------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections.copy():
            try:
                await connection.send_json(message)
            except:
                self.active_connections.remove(connection)


manager = ConnectionManager()


# -----------------------------
# HEALTH CHECK
# -----------------------------
@app.get("/")
def health_check():
    return {"status": "Backend Running 🚀"}


# -----------------------------
# DEPARTMENTS API
# -----------------------------
@app.get("/departments")
def get_departments():
    departments = [
        # Core Engineering Departments
        {"id": 1, "name": "Computer Science and Engineering (CSE)"},
        {"id": 2, "name": "Electronics and Communication Engineering (ECE)"},
        {"id": 3, "name": "Electrical and Electronics Engineering (EEE)"},
        {"id": 4, "name": "Mechanical Engineering (ME)"},
        {"id": 5, "name": "Civil Engineering"},
        {"id": 6, "name": "Information Technology (IT)"},
        # New / Specialized Technology Departments
        {"id": 7, "name": "Artificial Intelligence & Data Science (AI & DS)"},
        {"id": 8, "name": "CSE – Artificial Intelligence"},
        {"id": 9, "name": "CSE – Data Science"},
        {"id": 10, "name": "CSE – Cyber Security"},
        {"id": 11, "name": "Electronics and Computer Engineering (ECM)"},
        # Other Academic Departments
        {"id": 12, "name": "Engineering & Applied Sciences (Mathematics, Physics, Chemistry, English, etc.)"},
        # Postgraduate Departments
        {"id": 13, "name": "MBA (Master of Business Administration)"},
        {"id": 14, "name": "MCA (Master of Computer Applications)"},
        {"id": 15, "name": "M.Tech - Computer Science"},
        {"id": 16, "name": "M.Tech - Electronics"},
        {"id": 17, "name": "M.Tech - AI & Machine Learning"},
        {"id": 18, "name": "M.Tech - Information Technology"},
    ]
    return {"status": "success", "departments": departments}

# -----------------------------
# SECTIONS API (Default 7 sections)
# -----------------------------
@app.get("/departments/{department_id}/sections")
def get_sections(department_id: int):
    sections = [
        {"id": i+1, "name": chr(65+i)} for i in range(7)
    ]
    return {"status": "success", "sections": sections}


# -----------------------------
# AUTHENTICATION
# -----------------------------
@app.post("/login")
async def login(
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form(...)
):
    try:
        if role == "admin":
            user = authenticate_admin(email, password)

        elif role == "faculty":
            user = authenticate_faculty(email, password)

        else:
            return {"status": "error", "message": "Invalid role"}

        if user:
            return {"status": "success", "user": user}

        return {"status": "error", "message": "Invalid credentials"}

    except Exception as e:
        return {"status": "error", "message": str(e)}


# -----------------------------
# FACULTY MANAGEMENT
# -----------------------------
@app.post("/register-faculty")
async def register_faculty(
    email: str = Form(...),
    password: str = Form(...),
    name: str = Form(...),
    department: str = Form(...)
):
    try:
        success = insert_faculty(email, password, name, department)

        if success:
            return {"status": "success", "message": "Faculty registered successfully"}

        return {"status": "error", "message": "Faculty already exists"}

    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/register-admin")
async def register_admin(
    email: str = Form(...),
    password: str = Form(...),
    name: str = Form(...),
    department: str = Form(...)
):
    try:
        success = insert_admin(email, password, name, department)

        if success:
            return {"status": "success", "message": "Admin registered successfully"}

        return {"status": "error", "message": "Admin already exists"}

    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/faculty")
def get_faculty():
    faculty = get_all_faculty()
    return {"status": "success", "faculty": faculty}


# -----------------------------
# STUDENT REGISTRATION
# -----------------------------
@app.post("/register")
async def register_student(
    roll_number: str = Form(...),
    name: str = Form(...),
    department: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        image_bytes = await file.read()
        embedding = extract_face_embedding(image_bytes)

        if embedding is None:
            return {"status": "error", "message": "No face detected"}

        insert_user(roll_number, name, department, embedding)

        await manager.broadcast({
            "type": "student_registered",
            "data": {
                "rollNumber": roll_number,
                "name": name,
                "department": department
            }
        })

        return {"status": "success", "message": "Student registered successfully"}

    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/students")
def get_students():
    students = get_all_users()
    return {"status": "success", "students": students}


# -----------------------------
# FACE RECOGNITION
# -----------------------------
@app.post("/recognize")
async def recognize_face(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        result = process_frame(image_bytes)

        return {
            "status": "success",
            "result": result
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


# -----------------------------
# ATTENDANCE
# -----------------------------
@app.get("/attendance")
def get_attendance(limit: int = 100):
    records = get_attendance_records(limit)
    return {"status": "success", "attendance": records}


@app.post("/attendance/{student_id}")
async def mark_attendance(student_id: int):
    try:
        insert_attendance(student_id)

        await manager.broadcast({
            "type": "attendance_marked",
            "data": {"student_id": student_id}
        })

        return {"status": "success", "message": "Attendance marked"}

    except Exception as e:
        return {"status": "error", "message": str(e)}


# -----------------------------
# ADMIN OPERATIONS
# -----------------------------
@app.delete("/admin/delete-students")
async def delete_students():
    try:
        if delete_all_students():

            await manager.broadcast({
                "type": "database_reset",
                "target": "students"
            })

            return {"status": "success", "message": "Students deleted"}

        return {"status": "error", "message": "Delete failed"}

    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.delete("/admin/delete-attendance")
async def delete_attendance():
    try:
        if delete_all_attendance():

            await manager.broadcast({
                "type": "database_reset",
                "target": "attendance"
            })

            return {"status": "success", "message": "Attendance deleted"}

        return {"status": "error", "message": "Delete failed"}

    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/admin/reset-database")
async def reset_db():
    try:
        if reset_database():

            await manager.broadcast({
                "type": "database_reset",
                "target": "all"
            })

            return {"status": "success", "message": "Database reset"}

        return {"status": "error", "message": "Reset failed"}

    except Exception as e:
        return {"status": "error", "message": str(e)}


# -----------------------------
# WEBSOCKET ENDPOINT
# -----------------------------
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

    loop = asyncio.get_event_loop()

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")

            # ── Keep-alive ────────────────────────────────────────────────────
            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})

            # ── Process a camera frame from the client ─────────────────────────
            elif msg_type == "stream_frame":
                frame_data = message.get("data", "")

                # offload CPU-heavy work to a thread pool so the event loop stays free
                result = await loop.run_in_executor(
                    None, process_frame, frame_data
                )

                # Send detection result back to THIS client only (not broadcast)
                await websocket.send_json({
                    "type": "detection_result",
                    **result
                })

                # If a student was matched, also broadcast so other pages update
                if result.get("status") == "matched" and result.get("note") != "Already marked present today":
                    await manager.broadcast({
                        "type": "attendance_marked",
                        "data": {
                            "name": result.get("name"),
                            "roll_number": result.get("roll_number"),
                        }
                    })

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)
