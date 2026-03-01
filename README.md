
  # Enterprise AI Attendance System UI

  This is a code bundle for Enterprise AI Attendance System UI. The original project is available at https://www.figma.com/design/zABinUBigs3ey1Sj0mFZuz/Enterprise-AI-Attendance-System-UI.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ### Backend server

  A simple Python **FastAPI + Socket.IO** server is used for frame ingestion and face recognition. To run it:

  ```bash
  # create and activate a virtualenv or use your preferred environment manager
  python -m venv .venv
  .\.venv\Scripts\activate      # PowerShell on Windows
  pip install fastapi "python-socketio[asyncio_server]" uvicorn
  # optional if you intend to enqueue frames in Redis
  pip install aioredis

  python server.py
  ```

Alternatively the `Backend` package implements a more complete service with a Celery worker:

  ```bash
  cd Backend
  python -m venv .venv
  .\.venv\Scripts\activate
  pip install -r requirements.txt
  # start PostgreSQL and Redis before running;
  # update `Backend/App/config.py` with your credentials

  # launch FastAPI application
  cd backend             # make sure you're in the backend directory
  uvicorn app.main:app --reload

  # in a separate shell start the worker
  celery -A app.tasks worker --loglevel=info
  ```

**Notes**

* The `/recognize` endpoint now base64‑encodes images before dispatching to Celery; the worker decodes them back. This avoids JSON serialization errors.  
* If you hit `ImportError: No module named 'cv2'` install `opencv-python` (see `Backend/requirements.txt`).

  The server listens on port 8000 and accepts `stream_frame` events, replying with `detection_result` events.
  