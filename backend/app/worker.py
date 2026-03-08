import base64

from .ai_engine import extract_face_embedding
from .models import find_nearest_user, insert_attendance


def process_frame(image_bytes):
    """
    Process a single camera frame:
    1. Decode base64 if necessary
    2. Extract face embedding
    3. Find the nearest registered student
    4. Mark attendance (duplicate-prevention is handled inside insert_attendance)
    """
    # Celery may receive a base64 string; decode if necessary
    if isinstance(image_bytes, str):
        try:
            image_bytes = base64.b64decode(image_bytes)
        except Exception:
            pass

    embedding = extract_face_embedding(image_bytes)

    if embedding is None:
        return {"status": "no_face"}

    user = find_nearest_user(embedding)

    if user:
        result = insert_attendance(user["id"])
        response = {
            "status": "matched",
            "name": user["name"],
            "roll_number": user["roll_number"],
        }
        if result == "duplicate":
            response["note"] = "Already marked present today"
        return response

    return {"status": "unknown"}