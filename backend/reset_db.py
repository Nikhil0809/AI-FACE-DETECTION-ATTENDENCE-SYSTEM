"""
reset_db.py  –  Drop ALL tables and recreate a fresh schema.

Usage (from the backend/ directory, with the venv active):
    python reset_db.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import get_db_connection

SCHEMA = """
-- ─────────────────────────────────────────────────────────────────────────────
-- Drop existing tables (safe order due to FK constraints)
-- ─────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS attendance        CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;
DROP TABLE IF EXISTS users             CASCADE;
DROP TABLE IF EXISTS faculty           CASCADE;
DROP TABLE IF EXISTS sections          CASCADE;
DROP TABLE IF EXISTS departments       CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Departments
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE departments (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    code            VARCHAR(20)  NOT NULL,
    specialization  VARCHAR(255),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, specialization)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Sections
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE sections (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(10) NOT NULL,
    department_id INT REFERENCES departments(id) ON DELETE CASCADE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, department_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Faculty  (also stores admins via role column)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE faculty (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(255) NOT NULL,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    role          VARCHAR(20)  DEFAULT 'faculty',
    is_active     BOOLEAN      DEFAULT true,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Students  (face_vector stored as TEXT – JSON array of 128 floats)
-- pgvector is optional; if installed the column type can be upgraded later.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    roll_number   VARCHAR(50)  UNIQUE NOT NULL,
    name          VARCHAR(255) NOT NULL,
    phone_number  VARCHAR(20),
    department_id INT REFERENCES departments(id) ON DELETE CASCADE,
    section_id    INT REFERENCES sections(id)    ON DELETE SET NULL,
    face_vector   TEXT,        -- JSON array of 128 floats
    is_active     BOOLEAN   DEFAULT true,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Attendance Sessions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE attendance_sessions (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    department_id INT REFERENCES departments(id) ON DELETE CASCADE,
    start_time    TIME  NOT NULL,
    end_time      TIME  NOT NULL,
    date          DATE  NOT NULL,
    is_active     BOOLEAN   DEFAULT true,
    created_by    INT REFERENCES faculty(id) ON DELETE SET NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Attendance Records
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE attendance (
    id         SERIAL PRIMARY KEY,
    user_id    INT REFERENCES users(id)               ON DELETE CASCADE,
    session_id INT REFERENCES attendance_sessions(id) ON DELETE SET NULL,
    marked_by  INT REFERENCES faculty(id)             ON DELETE SET NULL,
    confidence FLOAT     DEFAULT 0.0,
    timestamp  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX idx_users_roll       ON users(roll_number);
CREATE INDEX idx_users_dept       ON users(department_id);
CREATE INDEX idx_faculty_email    ON faculty(email);
CREATE INDEX idx_faculty_role     ON faculty(role);
CREATE INDEX idx_att_user         ON attendance(user_id);
CREATE INDEX idx_att_ts           ON attendance(timestamp);
CREATE INDEX idx_sessions_dept    ON attendance_sessions(department_id);
CREATE INDEX idx_sections_dept    ON sections(department_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: Departments
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO departments (name, code, specialization) VALUES
  ('Computer Science and Engineering',          'CSE',   'Core'),
  ('Electronics and Communication Engineering', 'ECE',   NULL),
  ('Electrical and Electronics Engineering',    'EEE',   NULL),
  ('Mechanical Engineering',                    'ME',    NULL),
  ('Civil Engineering',                         'CE',    NULL),
  ('Information Technology',                    'IT',    NULL),
  ('Artificial Intelligence & Data Science',    'AICD',  NULL),
  ('Computer Science and Engineering',          'CSE',   'Artificial Intelligence'),
  ('Computer Science and Engineering',          'CSE',   'Data Science'),
  ('Computer Science and Engineering',          'CSE',   'Cyber Security'),
  ('Electronics and Computer Engineering',      'ECM',   NULL),
  ('Engineering & Applied Sciences',            'EAS',   NULL),
  ('Master of Business Administration',         'MBA',   NULL),
  ('Master of Computer Applications',           'MCA',   NULL),
  ('M.Tech - Computer Science',                 'MTECH', 'Computer Science'),
  ('M.Tech - Electronics',                      'MTECH', 'Electronics'),
  ('M.Tech - AI & Machine Learning',            'MTECH', 'AI & Machine Learning'),
  ('M.Tech - Information Technology',           'MTECH', 'Information Technology')
ON CONFLICT (name, specialization) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: 7 default sections (A–G) for every department
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
    dept RECORD;
    sec_name TEXT;
BEGIN
    FOR dept IN SELECT id FROM departments LOOP
        FOREACH sec_name IN ARRAY ARRAY['A','B','C','D','E','F','G'] LOOP
            INSERT INTO sections (name, department_id)
            VALUES (sec_name, dept.id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END;
$$;
"""


def reset_db():
    print("⚡  Connecting to database …")
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        print("🗑   Dropping all tables and recreating schema …")
        cur.execute(SCHEMA)
        conn.commit()

        # Quick verification
        cur.execute("SELECT COUNT(*) FROM departments;")
        dept_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM sections;")
        sec_count = cur.fetchone()[0]

        cur.close()
        print(f"\n✅  Database reset complete!")
        print(f"    • {dept_count} departments")
        print(f"    • {sec_count} sections  (A–G per department)")
        print("\nYou can now register admins/faculty and start the server.")

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"\n❌  Error: {e}")
        raise
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    reset_db()
