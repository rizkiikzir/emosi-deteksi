from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import random
import time

app = FastAPI(title="Emosi Deteksi API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EMOTIONS = ["Senang", "Sedih", "Marah", "Takut", "Netral"]


@app.get("/")
def root():
    return {
        "message": "Backend Emosi Deteksi aktif",
        "model": "LightExNet",
        "status": "running"
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    emotion = random.choice(EMOTIONS)
    confidence = round(random.uniform(0.65, 0.95), 2)

    scores = {}
    for item in EMOTIONS:
        scores[item] = round(random.uniform(0.01, 0.3), 2)

    scores[emotion] = confidence

    return {
        "timestamp": time.time(),
        "dominant_emotion": emotion,
        "confidence": confidence,
        "scores": scores
    }