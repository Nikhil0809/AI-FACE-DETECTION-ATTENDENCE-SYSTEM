from .database import get_db_connection
from .config import MATCH_THRESHOLD
from datetime import datetime
import hashlib
import json
import math


def _hash_password(password: str) -> str:
    """Hash a password using SHA-256."""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def _cosine_distance(a: list, b: list) -> float:
    """Euclidean-style L2 distance between two equal-length float lists."""
    if len(a) != len(b):
        return float('inf')
    total = sum((x - y) ** 2 for x, y in zip(a, b))
    return math.sqrt(total)


def insert_user(roll_number, name, department_id, embedding, section_id=None, phone_number=None):
    """Insert a new student. embedding is a list of floats stored as JSON text."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        face_json = json.dumps(embedding) if embedding is not None else None
        cursor.execute("""
            INSERT INTO users (roll_number, name, department_id, section_id, phone_number, face_vector)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (roll_number, name, department_id, section_id, phone_number, face_json))
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Error inserting user: {e}")
        raise
    finally:
        cursor.close()
        conn.close()


def get_all_users(department_id: int = None):
    """Get all registered students, optionally filtered by department."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        if department_id:
            cursor.execute("""
                SELECT u.id, u.name, u.roll_number,
                       d.name AS dept_name, s.name AS section_name,
                       u.phone_number, u.department_id
                FROM users u
                LEFT JOIN departments d ON u.department_id = d.id
                LEFT JOIN sections    s ON u.section_id    = s.id
                WHERE u.department_id = %s
                ORDER BY u.roll_number
            """, (department_id,))
        else:
            cursor.execute("""
                SELECT u.id, u.name, u.roll_number,
                       d.name AS dept_name, s.name AS section_name,
                       u.phone_number, u.department_id
                FROM users u
                LEFT JOIN departments d ON u.department_id = d.id
                LEFT JOIN sections    s ON u.section_id    = s.id
                ORDER BY u.roll_number
            """)
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return [
            {
                "id": row[0],
                "name": row[1],
                "rollNo": row[2],
                "branch": row[3] or "",
                "section": row[4] or "",
                "phone": row[5] or "",
                "year": "",
                "status": "Active"
            }
            for row in results
        ]
    except Exception as e:
        print(f"Error fetching users: {e}")
        return []


def find_nearest_user(embedding: list):
    """
    Find the closest registered student by L2 distance.
    Embeddings are stored as JSON text; comparison is done in Python.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, name, roll_number, face_vector
        FROM users
        WHERE face_vector IS NOT NULL AND is_active = true
    """)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    if not rows:
        return None

    best_user = None
    best_dist = float('inf')
    for row in rows:
        try:
            stored_vec = json.loads(row[3])
            dist = _cosine_distance(embedding, stored_vec)
            if dist < best_dist:
                best_dist = dist
                best_user = {"id": row[0], "name": row[1], "roll_number": row[2]}
        except Exception:
            continue

    if best_user and best_dist < MATCH_THRESHOLD:
        return {**best_user, "distance": best_dist}

    return None


def insert_attendance(user_id):
    """Insert an attendance record, preventing duplicates within the same calendar day."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check whether this student already has a record for today
        cursor.execute("""
            SELECT id FROM attendance
            WHERE user_id = %s
              AND timestamp::date = CURRENT_DATE
        """, (user_id,))

        if cursor.fetchone():
            # Already marked present today
            cursor.close()
            conn.close()
            return "duplicate"

        cursor.execute("""
            INSERT INTO attendance (user_id)
            VALUES (%s)
        """, (user_id,))

        conn.commit()
        return "ok"
    except Exception as e:
        conn.rollback()
        print(f"Error inserting attendance: {e}")
        return "error"
    finally:
        cursor.close()
        conn.close()


def insert_faculty(email: str, password: str, name: str, department: str, faculty_id: str = None):
    """Register a new faculty member (pending approval)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # department here is a department_id (integer sent as string from form)
        hashed = _hash_password(password)
        cursor.execute("""
            INSERT INTO faculty (email, password_hash, name, department_id, role, faculty_id, is_active, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (email, hashed, name, int(department), 'faculty', faculty_id, False, datetime.now()))

        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error creating faculty: {e}")
        return False


def authenticate_faculty(email: str, password: str):
    """Authenticate faculty member (role = 'faculty' only)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, name, email, department_id, password_hash
            FROM faculty
            WHERE email = %s AND role = 'faculty' AND is_active = true
        """, (email,))

        result = cursor.fetchone()
        cursor.close()
        conn.close()

        if not result:
            return None

        stored_hash = result[4]
        if stored_hash == _hash_password(password):
            return {
                "id": result[0],
                "name": result[1],
                "email": result[2],
                "departmentId": result[3],
                "role": "faculty"
            }

        return None
    except Exception as e:
        print(f"Error authenticating faculty: {e}")
        return None


def authenticate_admin(email: str, password: str):
    """Authenticate admin user – checks DB first, then falls back to superadmin."""
    # Try database-registered admins first
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, name, email, department_id, password_hash
            FROM faculty
            WHERE email = %s AND role = 'admin' AND is_active = true
        """, (email,))

        result = cursor.fetchone()
        cursor.close()
        conn.close()

        if result:
            stored_hash = result[4]
            if stored_hash == _hash_password(password):
                return {
                    "id": result[0],
                    "name": result[1],
                    "email": result[2],
                    "departmentId": result[3],
                    "role": "admin"
                }
            # Email found but password wrong – don't fall through to superadmin
            return None
    except Exception as e:
        print(f"Error authenticating admin from DB: {e}")

    # Fallback: built-in superadmin for first-time / emergency access
    if email == "admin@university.edu" and password == "admin123":
        return {
            "id": 0,
            "name": "Super Admin",
            "email": email,
            "departmentId": None,
            "role": "admin"
        }

    return None


def get_all_faculty():
    """Get all faculty members"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # We also want to fetch the new columns safely. If they don't exist yet, we can catch the error and fallback.
        try:
            cursor.execute("""
                SELECT id, name, email, department_id, role, created_at, faculty_id, is_active
                FROM faculty
                ORDER BY name
            """)
            has_new_cols = True
        except Exception:
            conn.rollback()
            cursor.execute("""
                SELECT id, name, email, department_id, role, created_at
                FROM faculty
                ORDER BY name
            """)
            has_new_cols = False

        results = cursor.fetchall()
        cursor.close()
        conn.close()

        faculty_list = []
        for row in results:
            faculty_list.append({
                "id": row[0],
                "name": row[1],
                "email": row[2],
                "departmentId": row[3],
                "role": row[4],
                "joinDate": row[5].isoformat() if row[5] else None,
                "facultyId": row[6] if has_new_cols else None,
                "isActive": row[7] if has_new_cols else True, # Default to true for old records
            })
        return faculty_list
    except Exception as e:
        print(f"Error fetching faculty: {e}")
        return []


def get_attendance_records(limit: int = 100):
    """Get recent attendance records"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT a.id, u.name, u.roll_number, a.timestamp
            FROM attendance a
            JOIN users u ON a.user_id = u.id
            ORDER BY a.timestamp DESC
            LIMIT %s
        """, (limit,))
        
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        
        records = []
        for row in results:
            records.append({
                "id": row[0],
                "studentName": row[1],
                "rollNumber": row[2],
                "timestamp": row[3].isoformat() if row[3] else None
            })
        return records
    except Exception as e:
        print(f"Error fetching attendance: {e}")
        return []


def insert_admin(email: str, password: str, name: str, department: str):
    """Register a new admin"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        hashed = _hash_password(password)
        cursor.execute("""
            INSERT INTO faculty (email, password_hash, name, department_id, role, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (email, hashed, name, int(department), 'admin', datetime.now()))

        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error creating admin: {e}")
        return False


def update_student_by_id(student_id: int, name: str = None, phone_number: str = None) -> bool:
    """Update a student's name or phone number by ID."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        if name:
            cursor.execute("UPDATE users SET name = %s WHERE id = %s", (name, student_id))
        if phone_number is not None:
            cursor.execute("UPDATE users SET phone_number = %s WHERE id = %s", (phone_number, student_id))
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error updating student {student_id}: {e}")
        return False


def delete_student_by_id(student_id: int) -> bool:
    """Delete a single student and their attendance records (faculty or admin)."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Delete attendance records for this student first (FK constraint)
        cursor.execute("DELETE FROM attendance WHERE user_id = %s", (student_id,))
        # Delete the student
        cursor.execute("DELETE FROM users WHERE id = %s", (student_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error deleting student {student_id}: {e}")
        return False


def delete_all_students():
    """Delete all student records (admin only)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Delete attendance records first
        cursor.execute("DELETE FROM attendance")
        # Delete users (students)
        cursor.execute("DELETE FROM users")
        
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error deleting students: {e}")
        return False


def delete_all_attendance():
    """Delete all attendance records (admin only)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM attendance")
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error deleting attendance: {e}")
        return False


def reset_database():
    """Reset entire database to initial state (admin only)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Delete in correct order due to foreign key constraints
        cursor.execute("DELETE FROM attendance")
        cursor.execute("DELETE FROM users")
        # Keep faculty/admin table
        
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error resetting database: {e}")
        return False