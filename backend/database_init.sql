-- Database initialization script for Enterprise AI Attendance System
-- Run this script in PostgreSQL with pgvector extension enabled

-- Create extension for vector support
CREATE EXTENSION IF NOT EXISTS vector;

-- Create users table (for students with face recognition)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    face_vector vector(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create faculty table
CREATE TABLE IF NOT EXISTS faculty (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confidence FLOAT DEFAULT 0.0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_roll_number ON users(roll_number);
CREATE INDEX IF NOT EXISTS idx_users_face_vector ON users USING ivfflat (face_vector vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_faculty_email ON faculty(email);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance(timestamp);

-- Insert demo admin faculty
INSERT INTO faculty (email, password_hash, name, department)
VALUES (
    'admin@university.edu',
    'ee5379b94590f2ca8f1fabe2b30ab0d3c3e3db6e4b2df8ea8c2e3b4c3d3f3e3',  -- admin123 hashed
    'Admin User',
    'Administration'
) ON CONFLICT (email) DO NOTHING;

-- Insert demo faculty members
INSERT INTO faculty (email, password_hash, name, department)
VALUES (
    'faculty@university.edu',
    '7c32c8cf7f6e53efbdb8dcf7f7e5f7c7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7',  -- faculty123 hashed
    'Dr. John Smith',
    'Computer Science'
) ON CONFLICT (email) DO NOTHING;

-- Sample student records (optional)
INSERT INTO users (roll_number, name, department)
VALUES 
    ('CS2021001', 'Rahul Sharma', 'Computer Science'),
    ('CS2021032', 'Sneha Reddy', 'Computer Science'),
    ('EC2021045', 'Priya Patel', 'Electronics'),
    ('ME2021023', 'Amit Kumar', 'Mechanical')
ON CONFLICT (roll_number) DO NOTHING;
