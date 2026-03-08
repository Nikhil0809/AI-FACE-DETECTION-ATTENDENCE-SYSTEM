import base64

from .ai_engine import extract_face_embedding
from .models import find_nearest_user, insert_attendance


def process_frame(image_bytes):
    """
    Process a single camera frame:
    1. Decode base64 data-URL (strips 'data:image/...;base64,' prefix)
    2. Extract face embedding + bounding box via ai_engine
    3. Find the nearest registered student
    4. Mark attendance (duplicate-prevention handled in insert_attendance)

    Returns a dict always containing 'status'. On a match also includes
    'name', 'roll_number', and 'bbox' (forwarded from ai_engine).
    """
    if isinstance(image_bytes, str):
        try:
            # Browser canvas.toDataURL() returns: 'data:image/jpeg;base64,<data>'
            # Strip the header prefix before decoding
            if "," in image_bytes:
                image_bytes = image_bytes.split(",", 1)[1]
            image_bytes = base64.b64decode(image_bytes)
        except Exception as e:
            print(f"Base64 decode error: {e}")
            return {"status": "error", "message": "Failed to decode frame"}

    # ai_engine returns None (no face) or a dict {embedding, bbox}
    face_data = extract_face_embedding(image_bytes)

    if face_data is None:
        return {"status": "no_face"}

    embedding = face_data["embedding"]
    bbox      = face_data.get("bbox")          # {x, y, w, h, img_w, img_h}

    user = find_nearest_user(embedding)

    if user:
        att_result = insert_attendance(user["id"])
        response = {
            "status": "matched",
            "name": user["name"],
            "roll_number": user["roll_number"],
            "bbox": bbox,
        }
        if att_result == "duplicate":
            response["note"] = "Already marked present today"
        return response

    # Face detected but not in the system
    return {"status": "unknown", "bbox": bbox}