import psycopg2
from .config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
import sys
import time

def get_db_connection():
    """Get database connection with error handling and retry"""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            conn = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                database=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD,
                connect_timeout=10  # Increased timeout
            )
            return conn
        except psycopg2.OperationalError as e:
            if attempt < max_retries - 1:
                print(f"[DB ERROR] Connection attempt {attempt + 1} failed: {e}. Retrying...", file=sys.stderr)
                time.sleep(2)  # Wait 2 seconds before retry
            else:
                print(f"[DB ERROR] Failed to connect to database after {max_retries} attempts: {e}", file=sys.stderr)
                raise
        except Exception as e:
            print(f"[DB ERROR] Unexpected error: {e}", file=sys.stderr)
            raise

def check_db_connection():
    """Check if database is accessible"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        return True, "Database connection successful"
    except Exception as e:
        return False, f"Database connection failed: {str(e)}"

def init_db():
    """Initialize database tables if they don't exist"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                roll_number VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                department VARCHAR(255),
                face_vector BYTEA,
                section VARCHAR(10),
                year VARCHAR(20),
                phone VARCHAR(20),
                status VARCHAR(20) DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create faculty table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS faculty (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                department VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create attendance table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS attendance (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create admin table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admin (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                department VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Add new columns to faculty safely if they don't exist
        try:
            cursor.execute("ALTER TABLE faculty ADD COLUMN faculty_id VARCHAR(50)")
        except psycopg2.errors.DuplicateColumn:
            conn.rollback() # Reset transaction state
        except Exception as e:
            conn.rollback()
        
        try:
            cursor.execute("ALTER TABLE faculty ADD COLUMN is_active BOOLEAN DEFAULT false")
        except psycopg2.errors.DuplicateColumn:
            conn.rollback()
        except Exception as e:
            conn.rollback()

        try:
            cursor.execute("ALTER TABLE faculty ADD COLUMN role VARCHAR(50) DEFAULT 'faculty'")
        except psycopg2.errors.DuplicateColumn:
            conn.rollback()
        except Exception as e:
            conn.rollback()

        try:
            cursor.execute("ALTER TABLE faculty ADD COLUMN department_id INTEGER")
        except psycopg2.errors.DuplicateColumn:
            conn.rollback()
        except Exception as e:
            conn.rollback()

        
        conn.commit()
        cursor.close()
        conn.close()
        print("[DB] Database tables initialized successfully")
        return True
    except Exception as e:
        print(f"[DB ERROR] Failed to initialize database: {e}", file=sys.stderr)
        return False