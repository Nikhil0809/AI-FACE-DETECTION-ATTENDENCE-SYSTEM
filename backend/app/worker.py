import base64

from .tasks import celery
from .ai_engine import extract_face_embedding
from .models import find_nearest_user, insert_attendance

@celery.task

def process_frame(image_bytes):
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
        insert_attendance(user["id"])
        return {
            "status": "matched",
            "name": user["name"],
            "roll_number": user["roll_number"]
        }

    return {"status": "unknown"}