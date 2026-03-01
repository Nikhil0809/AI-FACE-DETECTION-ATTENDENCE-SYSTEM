from .database import get_db_connection
from .config import MATCH_THRESHOLD
import hashlib
from datetime import datetime

def insert_user(roll_number, name, department, embedding):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO users (roll_number, name, department, face_vector)
        VALUES (%s, %s, %s, %s)
    """, (roll_number, name, department, embedding))

    conn.commit()
    cursor.close()
    conn.close()


def get_all_users():
    """Get all registered users"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, name, roll_number, department
            FROM users
            ORDER BY roll_number
        """)

        results = cursor.fetchall()
        cursor.close()
        conn.close()

        users = []
        for row in results:
            users.append({
                "id": row[0],
                "name": row[1],
                "rollNo": row[2],
                "department": row[3],
                "status": "Active"
            })
        return users
    except Exception as e:
        print(f"Error fetching users: {e}")
        return []


def find_nearest_user(embedding):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, name, roll_number,
               face_vector <-> %s AS distance
        FROM users
        ORDER BY face_vector <-> %s
        LIMIT 1;
    """, (embedding, embedding))

    result = cursor.fetchone()

    cursor.close()
    conn.close()

    if result and result[3] < MATCH_THRESHOLD:
        return {
            "id": result[0],
            "name": result[1],
            "roll_number": result[2],
            "distance": result[3]
        }

    return None


def insert_attendance(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO attendance (user_id)
        VALUES (%s)
    """, (user_id,))

    conn.commit()
    cursor.close()
    conn.close()


def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()


def insert_faculty(email: str, password: str, name: str, department: str):
    """Register a new faculty member"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        hashed_password = hash_password(password)
        
        cursor.execute("""
            INSERT INTO faculty (email, password_hash, name, department, created_at)
            VALUES (%s, %s, %s, %s, %s)
        """, (email, hashed_password, name, department, datetime.now()))
        
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error creating faculty: {e}")
        return False


def authenticate_faculty(email: str, password: str):
    """Authenticate faculty member"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, name, email, department, password_hash, created_at
            FROM faculty
            WHERE email = %s
        """, (email,))
        
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not result:
            return None
        
        stored_hash = result[4]
        provided_hash = hash_password(password)
        
        if stored_hash == provided_hash:
            return {
                "id": result[0],
                "name": result[1],
                "email": result[2],
                "department": result[3],
                "role": "faculty"
            }
        
        return None
    except Exception as e:
        print(f"Error authenticating faculty: {e}")
        return None


def authenticate_admin(email: str, password: str):
    """Authenticate admin user"""
    # Hardcoded admin credentials for initial setup
    admin_credentials = {
        "admin@university.edu": hash_password("admin123")
    }
    
    if email in admin_credentials:
        if hash_password(password) == admin_credentials[email]:
            return {
                "id": 1,
                "name": "Admin",
                "email": email,
                "department": "Administration",
                "role": "admin"
            }
    return None


def get_all_faculty():
    """Get all faculty members"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, name, email, department, created_at
            FROM faculty
            ORDER BY name
        """)
        
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        
        faculty_list = []
        for row in results:
            faculty_list.append({
                "id": row[0],
                "name": row[1],
                "email": row[2],
                "department": row[3],
                "joinDate": row[4].isoformat() if row[4] else None
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
        
        hashed_password = hash_password(password)
        
        cursor.execute("""
            INSERT INTO faculty (email, password_hash, name, department, created_at, role)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (email, hashed_password, name, department, datetime.now(), 'admin'))
        
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error creating admin: {e}")
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