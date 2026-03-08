import numpy as np
import cv2

def extract_face_embedding(image_bytes: bytes):
    """
    Extract a deterministic 128-dimensional face embedding from image bytes
    using OpenCV's LBP face detector + pixel-based feature descriptor.

    This is a lightweight, dependency-free approach that:
    - Detects faces using OpenCV's Haar cascade (included with cv2)
    - Extracts a normalised histogram of the detected face region
    - Returns a consistent 128-dim vector for the same face

    NOTE: For production accuracy, replace with dlib / DeepFace / InsightFace.
    """
    try:
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None:
            return None

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Use OpenCV's bundled Haar cascade for face detection
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        faces = face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60)
        )

        if len(faces) == 0:
            return None

        # Use the largest detected face
        x, y, w, h = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)[0]
        face_roi = gray[y : y + h, x : x + w]

        # Resize to a fixed size so the descriptor is always 128-dim
        face_resized = cv2.resize(face_roi, (16, 8))  # 128 pixels → 128 values

        # Normalise pixel values to [-1, 1] range (same scale as typical embeddings)
        embedding = face_resized.flatten().astype(np.float32) / 127.5 - 1.0

        return embedding.tolist()

    except Exception as e:
        print(f"Error processing image: {e}")
        return None