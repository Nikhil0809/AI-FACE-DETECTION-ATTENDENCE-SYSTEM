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
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Upgrade pip and install cython first (crucial for insightface)
RUN pip install --upgrade pip setuptools wheel cython

# Write requirements directly (bypasses COPY path issues)
RUN echo "twilio" > requirements.txt && \
    echo "fastapi" >> requirements.txt && \
    echo "uvicorn[standard]" >> requirements.txt && \
    echo "psycopg2-binary" >> requirements.txt && \
    echo "opencv-python-headless" >> requirements.txt && \
    echo "numpy<2" >> requirements.txt && \
    echo "python-multipart" >> requirements.txt && \
    echo "insightface==0.7.3" >> requirements.txt && \
    echo "onnx>=1.16.0" >> requirements.txt && \
    echo "onnxruntime" >> requirements.txt && \
    echo "ml_dtypes>=0.4.0" >> requirements.txt

# Install necessary Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend codebase
COPY backend/ .

# Expose port
EXPOSE 8080

# Run uvicorn when the container launches
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
