import numpy as np
import cv2

# Load the cascade once at module level (avoids re-reading the XML on every frame)
_face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)


def extract_face_embedding(image_bytes: bytes):
    """
    Detect the largest face in `image_bytes` and return a dict with:
        embedding  – normalised 128-dim float list for pgvector matching
        bbox       – {x, y, w, h} bounding box in the original image coords
                     (sent back to the frontend to draw the tracking box)

    Returns None if no face is detected or the image cannot be decoded.

    NOTE: For production accuracy replace with dlib / DeepFace / InsightFace.
    """
    try:
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            return None

        h_img, w_img = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Normalise brightness to improve detection in varying light
        gray = cv2.equalizeHist(gray)

        faces = _face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=4,
            minSize=(50, 50),
            flags=cv2.CASCADE_SCALE_IMAGE,
        )

        if len(faces) == 0:
            return None

        # Pick the largest face
        x, y, w, h = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)[0]
        face_roi = gray[y: y + h, x: x + w]

        # Resize to a fixed stamp so the descriptor is always 128-dim
        face_resized = cv2.resize(face_roi, (16, 8))

        # Normalise to [-1, 1]
        embedding = face_resized.flatten().astype(np.float32) / 127.5 - 1.0

        return {
            "embedding": embedding.tolist(),
            "bbox": {
                "x": int(x),
                "y": int(y),
                "w": int(w),
                "h": int(h),
                "img_w": int(w_img),
                "img_h": int(h_img),
            },
        }

    except Exception as e:
        print(f"Error processing image: {e}")
        return None