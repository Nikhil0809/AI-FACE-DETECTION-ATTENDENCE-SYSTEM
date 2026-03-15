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
    delete_all_students, delete_all_attendance, reset_database,
    delete_student_by_id, update_student_by_id
)
from app.worker import process_frame
from app.sms_service import send_sms_notification, SMS_LOG_FILE

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
    department: str = Form(...),
    facultyId: str = Form(None)
):
    try:
        success = insert_faculty(email, password, name, department, facultyId)

        if success:
            return {"status": "success", "message": "Faculty registered successfully (pending approval)"}

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
    roll_number:  str = Form(...),
    name:         str = Form(...),
    department_id: str = Form(...),
    section_id:   str = Form(None),
    phone_number: str = Form(None),
    file: UploadFile = File(...)
):
    try:
        image_bytes = await file.read()
        face_data = extract_face_embedding(image_bytes)

        if face_data is None:
            return {"status": "error", "message": "No face detected in the uploaded image"}

        embedding = face_data["embedding"]

        insert_user(
            roll_number,
            name,
            int(department_id),
            embedding,
            section_id=int(section_id) if section_id else None,
            phone_number=phone_number,
        )

        await manager.broadcast({
            "type": "student_registered",
            "data": {
                "rollNumber": roll_number,
                "name": name,
                "departmentId": department_id
            }
        })

        return {"status": "success", "message": "Student registered successfully"}

    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/students")
def get_students(department_id: int = None):
    students = get_all_users(department_id=department_id)
    return {"status": "success", "students": students}


@app.delete("/students/{student_id}")
async def delete_student(student_id: int):
    """Delete a single student by ID (faculty or admin operation)."""
    try:
        success = delete_student_by_id(student_id)
        if success:
            await manager.broadcast({
                "type": "student_deleted",
                "data": {"student_id": student_id}
            })
            return {"status": "success", "message": f"Student {student_id} deleted successfully"}
        return {"status": "error", "message": "Student not found or delete failed"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.put("/students/{student_id}")
async def update_student(
    student_id: int,
    name: str = Form(None),
    phone_number: str = Form(None),
    is_active: str = Form(None)
):
    """Update a student's name / phone (faculty or admin)."""
    try:
        success = update_student_by_id(student_id, name=name, phone_number=phone_number)
        if success:
            return {"status": "success", "message": "Student updated successfully"}
        return {"status": "error", "message": "Update failed"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


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


@app.post("/debug/face")
async def debug_face(file: UploadFile = File(...)):
    """Show distances to all registered students – for threshold tuning."""
    from app.models import get_db_connection
    from app.config import MATCH_THRESHOLD
    import json, math

    try:
        image_bytes = await file.read()
        face_data = extract_face_embedding(image_bytes)
        if face_data is None:
            return {"status": "no_face_detected"}

        emb = face_data["embedding"]
        conn = get_db_connection()
        cur  = conn.cursor()
        cur.execute("SELECT id, name, roll_number, face_vector FROM users WHERE face_vector IS NOT NULL")
        rows = cur.fetchall()
        cur.close(); conn.close()

        results = []
        for row in rows:
            vec = json.loads(row[3])
            dist = math.sqrt(sum((a - b) ** 2 for a, b in zip(emb, vec)))
            results.append({"name": row[1], "roll": row[2], "distance": round(dist, 4), "match": dist < MATCH_THRESHOLD})

        results.sort(key=lambda x: x["distance"])
        return {"status": "ok", "threshold": MATCH_THRESHOLD, "bbox": face_data["bbox"], "candidates": results}
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


# -----------------------------
# SMS NOTIFICATIONS API
# -----------------------------
@app.post("/sms/send")
def send_absent_sms(data: dict):
    """
    Send an SMS to an absent student's parent.
    Payload: { "phone": "...", "name": "...", "rollNo": "..." }
    """
    phone = data.get("phone")
    name = data.get("name")
    roll_no = data.get("rollNo")
    
    if not phone or not name or not roll_no:
        return {"status": "error", "message": "Missing required fields"}
        
    success = send_sms_notification(phone, name, roll_no)
    if success:
        return {"status": "success", "message": f"SMS sent to {name}"}
    return {"status": "error", "message": "Failed to send SMS"}

@app.get("/sms/logs")
def get_sms_logs():
    """Retrieve all logged SMS notifications."""
    try:
        import os, json
        if not os.path.exists(SMS_LOG_FILE):
            return {"status": "success", "logs": []}
        with open(SMS_LOG_FILE, "r") as f:
            logs = json.load(f)
        return {"status": "success", "logs": logs}
    except Exception as e:
        return {"status": "error", "message": str(e), "logs": []}


# -----------------------------
# ATTENDANCE SESSIONS (Admin/Faculty schedule management)
# In-memory store; replace with DB table for production
# -----------------------------
import uuid as _uuid
from datetime import date as _date

_sessions_store: list = []   # list of dicts


@app.post("/attendance-sessions")
async def create_attendance_session(
    name: str = Form(...),
    department_id: str = Form(...),
    start_time: str = Form(...),
    end_time: str = Form(...),
    date: str = Form(...),
    created_by: str = Form(None),
):
    try:
        session = {
            "id": len(_sessions_store) + 1,
            "name": name,
            "departmentId": int(department_id),
            "startTime": start_time,
            "endTime": end_time,
            "date": date,
            "isActive": True,
            "createdAt": str(_date.today()),
        }
        _sessions_store.append(session)
        await manager.broadcast({"type": "session_created", "data": session})
        return {"status": "success", "message": "Session created", "session": session}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/attendance-sessions")
def get_attendance_sessions(department_id: int = None, date: str = None):
    result = _sessions_store
    if department_id:
        result = [s for s in result if s["departmentId"] == department_id]
    if date:
        result = [s for s in result if s["date"] == date]
    return {"status": "success", "sessions": result}


@app.delete("/attendance-sessions/{session_id}")
async def delete_attendance_session(session_id: int):
    global _sessions_store
    before = len(_sessions_store)
    _sessions_store = [s for s in _sessions_store if s["id"] != session_id]
    if len(_sessions_store) < before:
        await manager.broadcast({"type": "session_deleted", "data": {"session_id": session_id}})
        return {"status": "success", "message": "Session deleted"}
    return {"status": "error", "message": "Session not found"}


@app.put("/attendance-sessions/{session_id}")
async def update_attendance_session(
    session_id: int,
    name: str = Form(None),
    start_time: str = Form(None),
    end_time: str = Form(None),
    is_active: str = Form(None),
):
    for session in _sessions_store:
        if session["id"] == session_id:
            if name: session["name"] = name
            if start_time: session["startTime"] = start_time
            if end_time: session["endTime"] = end_time
            if is_active is not None: session["isActive"] = is_active.lower() == "true"
            return {"status": "success", "message": "Session updated", "session": session}
    return {"status": "error", "message": "Session not found"}


# -----------------------------
# FACULTY MANAGEMENT (Admin)
# -----------------------------
@app.delete("/faculty/{faculty_id}")
async def delete_faculty(faculty_id: int):
    """Delete a faculty member by ID (admin only)."""
    try:
        from app.models import get_db_connection
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM faculty WHERE id = %s", (faculty_id,))
        conn.commit()
        cur.close()
        conn.close()
        await manager.broadcast({"type": "faculty_deleted", "data": {"faculty_id": faculty_id}})
        return {"status": "success", "message": f"Faculty {faculty_id} removed"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/faculty/{faculty_id}/approve")
async def approve_faculty(faculty_id: int):
    """Approve a pending faculty account (admin only)."""
    try:
        from app.models import get_db_connection
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE faculty SET is_active = true WHERE id = %s", (faculty_id,))
        conn.commit()
        cur.close()
        conn.close()
        return {"status": "success", "message": f"Faculty {faculty_id} approved"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# -----------------------------
# STUDENT BULK IMPORT (no face required)
# -----------------------------
@app.post("/students/bulk-import")
async def bulk_import_students(data: list):
    """
    Import students from CSV without face data.
    Body: [ {"roll_number": ..., "name": ..., "department_id": ..., "section_id": ..., "phone_number": ...} ]
    """
    success_count = 0
    error_count = 0
    errors = []
    for row in data:
        try:
            from app.models import insert_user
            insert_user(
                row.get("roll_number", ""),
                row.get("name", ""),
                int(row.get("department_id", 1)),
                None,  # No embedding for bulk import
                section_id=int(row["section_id"]) if row.get("section_id") else None,
                phone_number=row.get("phone_number"),
            )
            success_count += 1
        except Exception as e:
            error_count += 1
            errors.append({"row": row, "error": str(e)})

    await manager.broadcast({"type": "bulk_import_complete", "data": {"success": success_count}})
    return {
        "status": "success",
        "message": f"Imported {success_count} students, {error_count} errors",
        "success_count": success_count,
        "error_count": error_count,
        "errors": errors[:10],
    }
