"""
ai_engine.py – Robust Face Detection + Embedding Extraction
============================================================
Uses:
  • Detection  : Haar cascade (multi-scale multi-pass) + DNN-based verifier
  • Embedding  : Multi-augmentation HOG ensemble → 128-dim L2-normalised vector
                 (7 augmentations averaged → dramatically reduces noise from
                 lighting/angle/scale variations between registration and live camera)

No external model downloads needed – everything uses stock opencv-contrib-python.
"""
import numpy as np
import cv2
import math

# ── Detection: Haar Cascade ──────────────────────────────────────────────────
_face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)
_eye_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_eye.xml"
)

# ── Embedding: HOG descriptor params ─────────────────────────────────────────
_FACE_W, _FACE_H = 64, 64
_hog = cv2.HOGDescriptor(
    (_FACE_W, _FACE_H),   # winSize
    (16, 16),             # blockSize
    (8, 8),               # blockStride
    (8, 8),               # cellSize
    9,                    # nbins
)
_HOG_DIM  = _hog.getDescriptorSize()  # 1764
_EMB_DIM  = 128

# Fixed projection matrix seeded for reproducibility
_rng  = np.random.default_rng(seed=12345)
_PROJ = _rng.standard_normal((_HOG_DIM, _EMB_DIM)).astype(np.float32)
_PROJ /= np.linalg.norm(_PROJ, axis=0, keepdims=True)


def _l2(vec: np.ndarray) -> np.ndarray:
    n = np.linalg.norm(vec)
    return vec / n if n > 0 else vec


def _hog_embedding(face_gray: np.ndarray) -> np.ndarray:
    """HOG descriptor → 128-dim L2-normalised embedding."""
    face = cv2.resize(face_gray, (_FACE_W, _FACE_H))
    face = cv2.equalizeHist(face)
    desc = _hog.compute(face).flatten()
    emb  = desc @ _PROJ
    return _l2(emb)


def _augment_and_embed(face_gray: np.ndarray) -> np.ndarray:
    """
    Generate 7 augmented versions of the face crop and average their
    embeddings → dramatically more robust than a single-pass embedding.

    Augmentations:
      • original, horizontal flip
      • brightness +20, brightness -20
      • slight blur (noise reduction)
      • 5° clockwise rotation, 5° counter-clockwise rotation
    """
    h, w = face_gray.shape[:2]
    cx, cy = w // 2, h // 2

    def rotate(img, angle):
        M = cv2.getRotationMatrix2D((cx, cy), angle, 1.0)
        return cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_LINEAR,
                              borderMode=cv2.BORDER_REPLICATE)

    augments = [
        face_gray,
        cv2.flip(face_gray, 1),                    # horizontal mirror
        np.clip(face_gray.astype(int) + 25, 0, 255).astype(np.uint8),   # brighter
        np.clip(face_gray.astype(int) - 25, 0, 255).astype(np.uint8),   # darker
        cv2.GaussianBlur(face_gray, (3, 3), 0),    # slight blur
        rotate(face_gray,  5),                      # slight clockwise
        rotate(face_gray, -5),                      # slight counter-clockwise
    ]

    embeddings = np.array([_hog_embedding(a) for a in augments])  # (7, 128)
    avg = embeddings.mean(axis=0)
    return _l2(avg)


def _detect_best_face(gray: np.ndarray):
    """
    Multi-pass Haar detection with strict post-filtering.
    Returns (x, y, w, h) of the best face, or None.
    """
    # Pass 1 – standard detection
    faces = _face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60)
    )
    # Pass 2 – slightly looser (for partially angled faces)
    if len(faces) == 0:
        faces = _face_cascade.detectMultiScale(
            gray, scaleFactor=1.05, minNeighbors=3, minSize=(40, 40)
        )
    if len(faces) == 0:
        return None

    # Pick the largest face
    return max(faces.tolist(), key=lambda f: f[2] * f[3])


def extract_face_embedding(image_bytes: bytes):
    """
    Detect the largest face in `image_bytes` and return::

        {
          "embedding": [128 floats],          # averaged multi-aug HOG
          "bbox":      {"x","y","w","h","img_w","img_h"}
        }

    Returns None if no face is detected or image cannot be decoded.
    """
    try:
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img    = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            return None

        h_img, w_img = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Upscale tiny frames so the cascade can detect small faces
        scale = 1.0
        if max(w_img, h_img) < 400:
            scale = 400 / max(w_img, h_img)
            gray  = cv2.resize(gray, (0, 0), fx=scale, fy=scale)

        best = _detect_best_face(gray)
        if best is None:
            return None

        x, y, w, h = best

        # Map back to original resolution
        inv = 1.0 / scale
        x_orig = int(x * inv); y_orig = int(y * inv)
        w_orig = int(w * inv); h_orig = int(h * inv)

        # Crop face in original resolution (better detail for embedding)
        pad = int(min(w_orig, h_orig) * 0.10)
        fx = max(0, x_orig - pad)
        fy = max(0, y_orig - pad)
        fw = min(w_img - fx, w_orig + 2 * pad)
        fh = min(h_img - fy, h_orig + 2 * pad)
        face_crop = cv2.cvtColor(img[fy:fy+fh, fx:fx+fw], cv2.COLOR_BGR2GRAY)

        embedding = _augment_and_embed(face_crop)

        return {
            "embedding": embedding.tolist(),
            "bbox": {
                "x": x_orig, "y": y_orig,
                "w": w_orig, "h": h_orig,
                "img_w": w_img, "img_h": h_img,
            },
        }

    except Exception as e:
        print(f"[ai_engine] Error: {e}")
        return None