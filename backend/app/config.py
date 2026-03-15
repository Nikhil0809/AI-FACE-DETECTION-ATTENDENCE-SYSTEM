import os
from datetime import time

# Database Configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "attendance_system")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "nikky@123")

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Face Recognition
MATCH_THRESHOLD = float(os.getenv("MATCH_THRESHOLD", "0.50"))
VECTOR_DIMENSION = int(os.getenv("VECTOR_DIMENSION", "128"))

# ── Attendance Session Windows ──────────────────────────────────────────────────
# Morning: 8:45 AM – 9:15 AM
MORNING_START = time(8, 45)
MORNING_END   = time(9, 15)

# Evening: 3:30 PM – 4:15 PM
EVENING_START = time(15, 30)
EVENING_END   = time(16, 15)

# Set to False to disable time enforcement (useful for testing / admin override)
ENFORCE_TIME_SESSIONS = os.getenv("ENFORCE_TIME_SESSIONS", "true").lower() == "true"

# ── Twilio SMS Configuration ────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID  = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN   = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")