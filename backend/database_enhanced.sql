-- Enhanced Database Schema for Enterprise AI Attendance System
-- Creates fresh tables with proper structure including departments

-- Create extension for vector support
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop old tables if they exist (backup your data first!)
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    specialization VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, specialization)
);

-- Create sections table
CREATE TABLE IF NOT EXISTS sections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(10) NOT NULL,
    department_id INT REFERENCES departments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, department_id)
);

-- Create users table (students with face recognition)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    department_id INT REFERENCES departments(id) ON DELETE CASCADE,
    section_id INT REFERENCES sections(id) ON DELETE SET NULL,
    face_vector vector(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create faculty table (includes admins)
CREATE TABLE IF NOT EXISTS faculty (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    department_id INT REFERENCES departments(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'faculty',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create attendance sessions table (time-based attendance windows)
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department_id INT REFERENCES departments(id) ON DELETE CASCADE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by INT REFERENCES faculty(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(department_id, date)
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    session_id INT REFERENCES attendance_sessions(id) ON DELETE SET NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confidence FLOAT DEFAULT 0.0,
    marked_by INT REFERENCES faculty(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_roll_number ON users(roll_number);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_section ON users(section_id);
CREATE INDEX IF NOT EXISTS idx_users_face_vector ON users USING ivfflat (face_vector vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_faculty_email ON faculty(email);
CREATE INDEX IF NOT EXISTS idx_faculty_department ON faculty(department_id);
CREATE INDEX IF NOT EXISTS idx_faculty_role ON faculty(role);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance(timestamp);
CREATE INDEX IF NOT EXISTS idx_attendance_marked_by ON attendance(marked_by);
CREATE INDEX IF NOT EXISTS idx_sessions_department ON attendance_sessions(department_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON attendance_sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON attendance_sessions(is_active);

-- Insert VIIT departments
-- Core Engineering Departments
INSERT INTO departments (name, code, specialization) VALUES
('Computer Science and Engineering', 'CSE', 'Core'),
('Electronics and Communication Engineering', 'ECE', NULL),
('Electrical and Electronics Engineering', 'EEE', NULL),
('Mechanical Engineering', 'ME', NULL),
('Civil Engineering', 'CE', NULL),
('Information Technology', 'IT', NULL),
-- New / Specialized Technology Departments
('Artificial Intelligence & Data Science', 'AICD', NULL),
('Computer Science and Engineering', 'CSE', 'Artificial Intelligence'),
('Computer Science and Engineering', 'CSE', 'Data Science'),
('Computer Science and Engineering', 'CSE', 'Cyber Security'),
('Electronics and Computer Engineering', 'ECM', NULL),
-- Other Academic Departments
('Engineering & Applied Sciences', 'EAS', NULL),
-- Postgraduate Departments
('Master of Business Administration', 'MBA', NULL),
('Master of Computer Applications', 'MCA', NULL),
('M.Tech - Computer Science', 'MTECH', 'Computer Science'),
('M.Tech - Electronics', 'MTECH', 'Electronics'),
('M.Tech - AI & Machine Learning', 'MTECH', 'AI & Machine Learning'),
('M.Tech - Information Technology', 'MTECH', 'Information Technology')
ON CONFLICT (name, specialization) DO NOTHING;

-- Insert sections for each department (A through G - 7 default sections)
INSERT INTO sections (name, department_id) 
SELECT chr(code), d.id
FROM (SELECT generate_series(65, 71) AS code) AS letters,
      (SELECT DISTINCT id FROM departments) AS d
ON CONFLICT DO NOTHING;
