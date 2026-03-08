import os

# Database Configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))  # Standard PostgreSQL port
DB_NAME = os.getenv("DB_NAME", "attendance_system")  # Dedicated database for the app
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "nikky@123")

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Application Settings
MATCH_THRESHOLD = float(os.getenv("MATCH_THRESHOLD", "0.6"))
VECTOR_DIMENSION = int(os.getenv("VECTOR_DIMENSION", "512"))