import base64
import socketio
from fastapi import FastAPI

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI()
# combine FastAPI and Socket.IO into one ASGI app
socket_app = socketio.ASGIApp(sio, app)

# simple in-memory queue for demonstration; replace with Redis/queue in production
# import aioredis
# redis = await aioredis.from_url("redis://localhost")

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.event
async def stream_frame(sid, data):
    """Receive a base64 JPEG frame from the client.

    1. decode it
    2. enqueue for worker processing (e.g. Redis list)
    3. send back a fake detection result for now.
    """
    try:
        # strip off the data URI prefix if present
        header, encoded = data.split(",", 1) if "," in data else (None, data)
        decoded = base64.b64decode(encoded)
        # here you could write decoded bytes to disk, queue to Redis, etc.
        # await redis.lpush("frame_queue", decoded)
    except Exception as e:
        print("frame decode error", e)

    # simulate processing and respond back to the original client
    await sio.emit(
        "detection_result",
        {"name": "Nikky", "confidence": 0.98},
        to=sid,
    )

# if the file is invoked directly, run uvicorn
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:socket_app", host="0.0.0.0", port=8000, reload=True)
