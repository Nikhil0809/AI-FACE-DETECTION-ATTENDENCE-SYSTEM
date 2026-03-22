# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Install system dependencies required by OpenCV and InsightFace
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    librender1 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Upgrade pip and install cython first (crucial for insightface)
RUN pip install --upgrade pip setuptools wheel cython

# Copy the requirements file into the container
COPY requirements.txt .

# Install necessary Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend codebase
COPY . .

# Expose port (Cloud providers map their incoming port to the container's EXPOSE port)
EXPOSE 8080

# Run uvicorn when the container launches (FastAPI requires uvicorn, not gunicorn)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
