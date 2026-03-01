import numpy as np
import face_recognition

def extract_face_embedding(image_bytes):
    np_arr = np.frombuffer(image_bytes, np.uint8)
    import cv2
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    encodings = face_recognition.face_encodings(rgb_img)

    if len(encodings) == 0:
        return None

    return encodings[0].tolist()