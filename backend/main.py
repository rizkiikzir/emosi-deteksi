from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session as DBSession
from datetime import datetime

from database import engine, get_db, SessionLocal
from models import (
    Base,
    Student,
    Session as CounselingSession,
    EmotionLog,
    SessionMarker,
    Report,
    User,
)
from schemas import (
    StudentCreate,
    StudentUpdate,
    StudentResponse,
    CounselingSessionCreate,
    CounselingSessionUpdate,
    EmotionLogCreate,
    SessionMarkerCreate,
    ReportCreate,
    LoginRequest,
    UserUpdate,
    ChangePasswordRequest,
)

import cv2
import numpy as np
import json
import os
import tensorflow as tf
import uuid
from tensorflow.keras import layers, models
import hashlib


# ============================================================
# APP SETUP
# ============================================================

app = FastAPI(
    title="SERIN API",
    description="Backend API for Smart Emotion Recognition for Integrated Counseling",
    version="1.0.0"
)

Base.metadata.create_all(bind=engine)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    return hash_password(password) == password_hash


def format_user_response(user):
    return {
        "id": user.id,
        "user_code": user.user_code,
        "name": user.name,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "unit": user.unit,
        "status": user.status,
        "photo_url": user.photo_url,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }

def seed_default_user():
    db = SessionLocal()

    try:
        existing_user = db.query(User).filter(User.username == "admin").first()

        if existing_user:
            return

        default_user = User(
            user_code="USR-0001",
            name="M Rizki",
            username="admin",
            email="admin@serin.local",
            password_hash=hash_password("admin123"),
            role="Konselor / Admin",
            unit="Unit BK",
            status="Aktif",
            photo_url=None,
        )

        db.add(default_user)
        db.commit()
    finally:
        db.close()


seed_default_user()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/auth/login")
def login(payload: LoginRequest, db: DBSession = Depends(get_db)):
    username = payload.username.strip()

    user = (
        db.query(User)
        .filter(User.username == username)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Username atau password salah.",
        )

    if user.status != "Aktif":
        raise HTTPException(
            status_code=403,
            detail="Akun tidak aktif.",
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Username atau password salah.",
        )

    return {
        "success": True,
        "message": "Login berhasil.",
        "user": format_user_response(user),
    }

@app.get("/users/me")
def get_current_user(db: DBSession = Depends(get_db)):
    user = db.query(User).filter(User.username == "admin").first()

    if user is None:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")

    return format_user_response(user)

@app.put("/users/me")
def update_current_user(payload: UserUpdate, db: DBSession = Depends(get_db)):
    user = db.query(User).filter(User.username == "admin").first()

    if user is None:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")

    if payload.name is not None:
        user.name = payload.name

    if payload.username is not None:
        existing_username = (
            db.query(User)
            .filter(User.username == payload.username, User.id != user.id)
            .first()
        )

        if existing_username:
            raise HTTPException(
                status_code=400,
                detail="Username sudah digunakan.",
            )

        user.username = payload.username

    if payload.email is not None:
        existing_email = (
            db.query(User)
            .filter(User.email == payload.email, User.id != user.id)
            .first()
        )

        if existing_email:
            raise HTTPException(
                status_code=400,
                detail="Email sudah digunakan.",
            )

        user.email = payload.email

    if payload.role is not None:
        user.role = payload.role

    if payload.unit is not None:
        user.unit = payload.unit

    if payload.status is not None:
        user.status = payload.status

    if payload.photo_url is not None:
        user.photo_url = payload.photo_url

    user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": "Profil berhasil diperbarui.",
        "user": format_user_response(user),
    }

@app.put("/users/me/password")
def change_current_user_password(
    payload: ChangePasswordRequest,
    db: DBSession = Depends(get_db),
):
    user = db.query(User).filter(User.username == "admin").first()

    if user is None:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")

    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Password lama tidak sesuai.")

    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Konfirmasi password baru tidak sesuai.",
        )

    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password baru minimal 6 karakter.",
        )

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=400,
            detail="Password baru tidak boleh sama dengan password lama.",
        )

    user.password_hash = hash_password(payload.new_password)
    user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": "Password berhasil diperbarui.",
    }

# ============================================================
# PATH SETUP
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
STUDENT_UPLOAD_DIR = os.path.join(UPLOAD_DIR, "students")
PROFILE_UPLOAD_DIR = os.path.join(UPLOAD_DIR, "profile")

os.makedirs(STUDENT_UPLOAD_DIR, exist_ok=True)
os.makedirs(PROFILE_UPLOAD_DIR, exist_ok=True)

WEIGHTS_PATH = os.path.join(
    BASE_DIR,
    "model",
    "lightexnet_v2_random_final.h5"
)

CLASS_NAMES_PATH = os.path.join(
    BASE_DIR,
    "model",
    "class_names.json"
)

INPUT_SHAPE = (48, 48, 1)


# ============================================================
# FACE DETECTOR
# ============================================================

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

if face_cascade.empty():
    raise RuntimeError("Haar Cascade gagal dimuat.")


# ============================================================
# LOAD CLASS NAMES
# ============================================================

def load_class_names():
    with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as file:
        data = json.load(file)

    if isinstance(data, list):
        return data

    if isinstance(data, dict):
        sorted_items = sorted(data.items(), key=lambda x: int(x[0]))
        return [item[1] for item in sorted_items]

    raise ValueError("Format class_names.json tidak dikenali.")


CLASS_NAMES = load_class_names()
NUM_CLASSES = len(CLASS_NAMES)

print("Class names:", CLASS_NAMES)
print("Weights path:", WEIGHTS_PATH)


# ============================================================
# CUSTOM LAYER: CHANNEL ATTENTION
# ============================================================

@tf.keras.utils.register_keras_serializable()
class ChannelAttention(layers.Layer):
    def __init__(self, ratio=8, **kwargs):
        super().__init__(**kwargs)
        self.ratio = ratio

    def build(self, input_shape):
        channels = int(input_shape[-1])
        hidden = max(channels // self.ratio, 8)

        self.avg_pool = layers.GlobalAveragePooling2D()
        self.max_pool = layers.GlobalMaxPooling2D()

        self.dense1 = layers.Dense(hidden, activation="relu")
        self.dense2 = layers.Dense(channels)

        self.reshape = layers.Reshape((1, 1, channels))
        self.multiply = layers.Multiply()

    def call(self, inputs):
        avg = self.avg_pool(inputs)
        maxv = self.max_pool(inputs)

        avg = self.dense2(self.dense1(avg))
        maxv = self.dense2(self.dense1(maxv))

        attention = tf.nn.sigmoid(avg + maxv)
        attention = self.reshape(attention)

        return self.multiply([inputs, attention])

    def get_config(self):
        config = super().get_config()
        config.update({"ratio": self.ratio})
        return config


# ============================================================
# CUSTOM LAYER: SPATIAL ATTENTION
# ============================================================

@tf.keras.utils.register_keras_serializable()
class SpatialAttention(layers.Layer):
    def __init__(self, kernel_size=7, **kwargs):
        super().__init__(**kwargs)
        self.kernel_size = kernel_size
        self.conv = layers.Conv2D(
            filters=1,
            kernel_size=kernel_size,
            padding="same",
            activation="sigmoid"
        )
        self.multiply = layers.Multiply()

    def call(self, inputs):
        avg_pool = tf.reduce_mean(inputs, axis=-1, keepdims=True)
        max_pool = tf.reduce_max(inputs, axis=-1, keepdims=True)

        concat = tf.concat([avg_pool, max_pool], axis=-1)
        attention = self.conv(concat)

        return self.multiply([inputs, attention])

    def get_config(self):
        config = super().get_config()
        config.update({"kernel_size": self.kernel_size})
        return config


# ============================================================
# ATTENTION BLOCK
# ============================================================

def attention_block(x, name=None):
    x = ChannelAttention(name=None if name is None else name + "_ca")(x)
    x = SpatialAttention(name=None if name is None else name + "_sa")(x)
    return x


# ============================================================
# CONV BN RELU6
# ============================================================

def conv_bn_relu(x, filters, kernel_size=3, strides=1, name=None):
    x = layers.Conv2D(
        filters,
        kernel_size,
        strides=strides,
        padding="same",
        use_bias=False,
        name=None if name is None else name + "_conv"
    )(x)

    x = layers.BatchNormalization(
        name=None if name is None else name + "_bn"
    )(x)

    x = layers.ReLU(
        max_value=6,
        name=None if name is None else name + "_relu6"
    )(x)

    return x


# ============================================================
# INVERTED RESIDUAL BLOCK
# ============================================================

def inverted_residual_block(x, out_channels, expansion=4, stride=1, name=None):
    in_channels = int(x.shape[-1])
    hidden_dim = in_channels * expansion

    shortcut = x

    if expansion != 1:
        x = layers.Conv2D(
            hidden_dim,
            kernel_size=1,
            padding="same",
            use_bias=False,
            name=None if name is None else name + "_expand_conv"
        )(x)

        x = layers.BatchNormalization(
            name=None if name is None else name + "_expand_bn"
        )(x)

        x = layers.ReLU(
            max_value=6,
            name=None if name is None else name + "_expand_relu6"
        )(x)

    x = layers.DepthwiseConv2D(
        kernel_size=3,
        strides=stride,
        padding="same",
        use_bias=False,
        name=None if name is None else name + "_dw_conv"
    )(x)

    x = layers.BatchNormalization(
        name=None if name is None else name + "_dw_bn"
    )(x)

    x = layers.ReLU(
        max_value=6,
        name=None if name is None else name + "_dw_relu6"
    )(x)

    x = layers.Conv2D(
        out_channels,
        kernel_size=1,
        padding="same",
        use_bias=False,
        name=None if name is None else name + "_project_conv"
    )(x)

    x = layers.BatchNormalization(
        name=None if name is None else name + "_project_bn"
    )(x)

    if stride == 1 and in_channels == out_channels:
        x = layers.Add(
            name=None if name is None else name + "_add"
        )([shortcut, x])

    return x


# ============================================================
# BUILD LIGHTEXNET V2
# ============================================================

def build_lightexnet_v2(input_shape=(48, 48, 1), num_classes=5):
    inputs = layers.Input(shape=input_shape)

    # Augmentation layers ikut arsitektur training.
    # Saat inference/predict, layer ini otomatis tidak aktif seperti saat training.
    aug = layers.RandomFlip("horizontal")(inputs)
    aug = layers.RandomRotation(0.06)(aug)
    aug = layers.RandomZoom(0.08)(aug)
    aug = layers.RandomContrast(0.12)(aug)

    # STAGE 0
    x = conv_bn_relu(aug, 32, kernel_size=3, strides=1, name="stage0")

    # Shallow branch awal
    shallow1 = conv_bn_relu(inputs, 16, kernel_size=3, strides=1, name="shallow1_a")
    shallow1 = conv_bn_relu(shallow1, 24, kernel_size=3, strides=1, name="shallow1_b")

    # STAGE 1: 48x48
    x = inverted_residual_block(x, 32, expansion=2, stride=1, name="ir1_1")
    x = inverted_residual_block(x, 32, expansion=2, stride=1, name="ir1_2")
    x = attention_block(x, name="att1")

    # Fusion 1
    x = layers.Concatenate(name="fusion1")([x, shallow1])
    x = conv_bn_relu(x, 48, kernel_size=1, strides=1, name="fusion1_reduce")
    x = attention_block(x, name="att_fusion1")

    # STAGE 2: 24x24
    x = inverted_residual_block(x, 64, expansion=4, stride=2, name="ir2_1")
    x = inverted_residual_block(x, 64, expansion=4, stride=1, name="ir2_2")
    x = attention_block(x, name="att2")

    # Shallow branch 24x24
    shallow2 = layers.AveragePooling2D(pool_size=2)(shallow1)
    shallow2 = conv_bn_relu(shallow2, 32, kernel_size=3, strides=1, name="shallow2")

    # Fusion 2
    x = layers.Concatenate(name="fusion2")([x, shallow2])
    x = conv_bn_relu(x, 80, kernel_size=1, strides=1, name="fusion2_reduce")
    x = attention_block(x, name="att_fusion2")

    # STAGE 3: 12x12
    x = inverted_residual_block(x, 128, expansion=4, stride=2, name="ir3_1")
    x = inverted_residual_block(x, 128, expansion=4, stride=1, name="ir3_2")
    x = inverted_residual_block(x, 128, expansion=4, stride=1, name="ir3_3")
    x = attention_block(x, name="att3")

    # Shallow branch 12x12
    shallow3 = layers.AveragePooling2D(pool_size=2)(shallow2)
    shallow3 = conv_bn_relu(shallow3, 48, kernel_size=3, strides=1, name="shallow3")

    # Fusion 3
    x = layers.Concatenate(name="fusion3")([x, shallow3])
    x = conv_bn_relu(x, 160, kernel_size=1, strides=1, name="fusion3_reduce")
    x = attention_block(x, name="att_fusion3")

    # STAGE 4: 6x6
    x = inverted_residual_block(x, 192, expansion=4, stride=2, name="ir4_1")
    x = inverted_residual_block(x, 192, expansion=4, stride=1, name="ir4_2")
    x = attention_block(x, name="att4")

    # Classifier
    x = layers.Conv2D(
        256,
        kernel_size=1,
        padding="same",
        use_bias=False,
        name="final_conv"
    )(x)

    x = layers.BatchNormalization(name="final_bn")(x)
    x = layers.ReLU(max_value=6, name="final_relu6")(x)

    x = layers.GlobalAveragePooling2D(name="gap")(x)

    x = layers.Dropout(0.45, name="dropout1")(x)
    x = layers.Dense(256, activation="relu", name="fc1")(x)
    x = layers.BatchNormalization(name="fc1_bn")(x)
    x = layers.Dropout(0.35, name="dropout2")(x)

    outputs = layers.Dense(
        num_classes,
        activation="softmax",
        name="predictions"
    )(x)

    model = models.Model(
        inputs,
        outputs,
        name="LightExNet_V2_RandomSplit_5Class_48x48"
    )

    return model


# ============================================================
# LOAD MODEL WEIGHTS
# ============================================================

print("Membangun arsitektur LightExNet V2...")
model = build_lightexnet_v2(INPUT_SHAPE, NUM_CLASSES)

print("Loading weights:", WEIGHTS_PATH)
model.load_weights(WEIGHTS_PATH)

print("Model berhasil dimuat dari weights.")


# ============================================================
# ROUTES
# ============================================================
def generate_report_code(db: DBSession):
    last_report = (
        db.query(Report)
        .order_by(Report.id.desc())
        .first()
    )

    next_number = 1 if last_report is None else last_report.id + 1
    return f"RPT-{next_number:04d}"


def calculate_report_from_logs(session: CounselingSession, logs, markers):
    emotion_order = ["Senang", "Sedih", "Marah", "Takut", "Netral"]

    counts = {
        "Senang": 0,
        "Sedih": 0,
        "Marah": 0,
        "Takut": 0,
        "Netral": 0,
    }

    for log in logs:
        if log.emotion in counts:
            counts[log.emotion] += 1

    total = sum(counts.values())

    percentages = {}
    for emotion in emotion_order:
        percentages[emotion] = 0 if total == 0 else round((counts[emotion] / total) * 100, 1)

    max_count = max(counts.values()) if total > 0 else 0
    dominant_emotions = [
        emotion for emotion, count in counts.items()
        if count == max_count and total > 0
    ]

    dominant_emotion = " dan ".join(dominant_emotions) if dominant_emotions else "-"
    dominant_percentage = (
        round(sum(percentages[e] for e in dominant_emotions) / len(dominant_emotions), 1)
        if dominant_emotions else 0
    )

    negative_total = (
        percentages.get("Sedih", 0)
        + percentages.get("Marah", 0)
        + percentages.get("Takut", 0)
    )

    if dominant_emotion == "Sedih":
        interpretation = f"Emosi Sedih menjadi emosi dominan selama sesi dengan persentase {percentages['Sedih']}%. Hal ini dapat mengindikasikan adanya tekanan emosional, rasa tidak nyaman, atau beban psikologis yang perlu diperhatikan lebih lanjut oleh konselor."
        recommendation = "Konselor disarankan menggunakan pendekatan yang lebih empatik, memberi ruang mahasiswa untuk bercerita, serta menggali faktor penyebab munculnya emosi sedih selama sesi."
    elif dominant_emotion == "Marah":
        interpretation = f"Emosi Marah menjadi emosi dominan selama sesi dengan persentase {percentages['Marah']}%. Hal ini dapat mengindikasikan adanya resistensi, frustrasi, atau ketegangan emosional pada mahasiswa selama proses konseling."
        recommendation = "Konselor disarankan menurunkan tensi komunikasi, menggunakan pertanyaan terbuka, dan menghindari respons yang berpotensi meningkatkan resistensi mahasiswa."
    elif dominant_emotion == "Takut":
        interpretation = f"Emosi Takut menjadi emosi dominan selama sesi dengan persentase {percentages['Takut']}%. Hal ini dapat mengindikasikan adanya kecemasan, kekhawatiran, atau rasa tidak aman dalam membahas topik tertentu."
        recommendation = "Konselor disarankan menciptakan suasana yang lebih aman dan menenangkan, serta memastikan mahasiswa merasa nyaman sebelum menggali topik yang sensitif."
    elif dominant_emotion == "Senang":
        interpretation = f"Emosi Senang menjadi emosi dominan selama sesi dengan persentase {percentages['Senang']}%. Hal ini menunjukkan respons emosional yang positif dan keterlibatan mahasiswa yang cukup baik selama sesi."
        recommendation = "Konselor dapat mempertahankan pendekatan yang digunakan dan tetap memantau perubahan emosi mahasiswa pada bagian sesi yang lebih sensitif."
    elif dominant_emotion == "Netral":
        if negative_total >= 40:
            interpretation = f"Emosi Netral menjadi emosi dominan selama sesi dengan persentase {percentages['Netral']}%, namun emosi negatif juga muncul dalam proporsi yang cukup terlihat."
            recommendation = "Konselor disarankan meninjau bagian sesi ketika emosi negatif meningkat dan menggali konteks pembicaraan pada momen tersebut."
        else:
            interpretation = f"Emosi Netral menjadi emosi dominan selama sesi dengan persentase {percentages['Netral']}%. Hal ini menunjukkan ekspresi mahasiswa relatif stabil selama sesi."
            recommendation = "Konselor dapat melanjutkan pendekatan konseling sesuai rencana dan tetap memperhatikan perubahan emosi yang signifikan."
    else:
        interpretation = f"Terdapat beberapa emosi dominan dengan proporsi yang seimbang, yaitu {dominant_emotion}. Hal ini menunjukkan respons emosi mahasiswa cukup bervariasi selama sesi."
        recommendation = "Konselor disarankan meninjau grafik sebaran emosi dan momen penting untuk memahami konteks perubahan emosi mahasiswa secara lebih menyeluruh."

    chart_points = []
    for log in logs:
        chart_points.append({
            "x": log.timestamp_second,
            "emotion": log.emotion,
            "confidence": log.confidence,
        })

    marker_items = []
    for marker in markers:
        marker_items.append({
            "id": marker.id,
            "timeSecond": marker.timestamp_second,
            "timeLabel": f"Detik ke-{marker.timestamp_second}",
            "title": marker.title,
            "category": marker.category,
            "note": marker.note,
            "analysis": marker.dominant_emotion_after_marker,
        })

    emotion_summary = {
        "counts": counts,
        "percentages": percentages,
        "chartPoints": chart_points,
        "markers": marker_items,
    }

    return {
        "total": total,
        "counts": counts,
        "percentages": percentages,
        "dominant_emotion": dominant_emotion,
        "dominant_percentage": dominant_percentage,
        "interpretation": interpretation,
        "recommendation": recommendation,
        "emotion_summary": emotion_summary,
        "timeline_summary": [],
    }


def format_report_response(report: Report, session: CounselingSession):
    student = session.student if session else None

    emotion_summary = json.loads(report.emotion_summary_json or "{}")
    timeline_summary = json.loads(report.timeline_summary_json or "[]")

    return {
        "id": report.id,
        "reportId": report.report_code,
        "report_code": report.report_code,

        "session_id": report.session_id,
        "sessionId": session.session_code if session else None,

        "sessionInfo": {
            "id": session.id if session else None,
            "sessionId": session.session_code if session else None,
            "studentName": student.name if student else "-",
            "nim": student.nim if student else "-",
            "programStudy": student.program_study if student else "-",
            "counselorName": "Konselor / Admin",
            "topic": session.topic if session else "-",
            "title": session.title if session else "-",
            "counselingType": session.counseling_type if session else "-",
            "location": session.location if session else "-",
            "purpose": session.goal if session else "-",
            "initialNote": session.initial_note if session else "-",
            "startDate": session.scheduled_date if session else "-",
            "startTime": session.scheduled_time if session else "-",
            "duration": session.actual_duration or session.estimated_duration if session else "-",
            "modelName": report.model_name or "LightExNet V2",
        },

        "total": report.total_detections,
        "counts": emotion_summary.get("counts", {}),
        "percentages": emotion_summary.get("percentages", {}),
        "chartPoints": emotion_summary.get("chartPoints", []),
        "markers": emotion_summary.get("markers", []),
        "timeline": timeline_summary,

        "dominantEmotion": report.dominant_emotion,
        "dominantPercentage": report.dominant_percentage,
        "interpretation": report.interpretation,
        "recommendation": report.recommendation,

        "duration": session.actual_duration if session else "-",
        "totalDuration": session.actual_duration if session else "-",
        "createdAt": report.created_at,
        "status": "Selesai",
    }

def generate_session_code(db: DBSession):
    last_session = (
        db.query(CounselingSession)
        .order_by(CounselingSession.id.desc())
        .first()
    )

    next_number = 1 if last_session is None else last_session.id + 1
    return f"KS-{next_number:04d}"


def format_session_response(session: CounselingSession):
    student = session.student

    return {
        "id": session.id,
        "session_code": session.session_code,

        "student_id": session.student_id,
        "counselor_id": session.counselor_id,

        "student_name": student.name if student else None,
        "student_nim": student.nim if student else None,
        "student_program_study": student.program_study if student else None,

        "title": session.title,
        "counseling_type": session.counseling_type,
        "topic": session.topic,
        "goal": session.goal,
        "initial_note": session.initial_note,
        "location": session.location,

        "scheduled_date": session.scheduled_date,
        "scheduled_time": session.scheduled_time,
        "estimated_duration": session.estimated_duration,
        "actual_duration": session.actual_duration,

        "status": session.status,

        "started_at": session.started_at,
        "ended_at": session.ended_at,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
    }

def generate_student_code(db: DBSession):
    last_student = (
        db.query(Student)
        .order_by(Student.id.desc())
        .first()
    )

    next_number = 1 if last_student is None else last_student.id + 1
    return f"STD-{next_number:04d}"

@app.get("/")
def root():
    return {
        "message": "Backend SERIN aktif",
        "status": "running",
        "database": "SQLite",
        "model": "LightExNet V2 Random Final",
        "classes": CLASS_NAMES,
    }

@app.get("/students", response_model=list[StudentResponse])
def get_students(db: DBSession = Depends(get_db)):
    students = db.query(Student).order_by(Student.id.desc()).all()
    return students


@app.get("/students/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: DBSession = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()

    if student is None:
        raise HTTPException(status_code=404, detail="Mahasiswa tidak ditemukan.")

    return student


@app.post("/students", response_model=StudentResponse)
def create_student(payload: StudentCreate, db: DBSession = Depends(get_db)):
    existing_nim = db.query(Student).filter(Student.nim == payload.nim).first()

    if existing_nim:
        raise HTTPException(status_code=400, detail="NIM sudah terdaftar.")

    new_student = Student(
        student_code=generate_student_code(db),
        nim=payload.nim,
        name=payload.name,
        program_study=payload.program_study,
        generation=payload.generation,
        status=payload.status or "Aktif",
        photo_url=payload.photo_url,
        registered_at=payload.registered_at or datetime.now().strftime("%d %B %Y"),
    )

    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    return new_student


@app.put("/students/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    payload: StudentUpdate,
    db: DBSession = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == student_id).first()

    if student is None:
        raise HTTPException(status_code=404, detail="Mahasiswa tidak ditemukan.")

    if payload.nim is not None and payload.nim != student.nim:
        existing_nim = db.query(Student).filter(Student.nim == payload.nim).first()

        if existing_nim:
            raise HTTPException(
                status_code=400,
                detail="NIM sudah digunakan mahasiswa lain."
            )

        student.nim = payload.nim

    if payload.name is not None:
        student.name = payload.name

    if payload.program_study is not None:
        student.program_study = payload.program_study

    if payload.generation is not None:
        student.generation = payload.generation

    if payload.status is not None:
        student.status = payload.status

    if payload.photo_url is not None:
        student.photo_url = payload.photo_url

    if payload.registered_at is not None:
        student.registered_at = payload.registered_at

    student.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(student)

    return student


@app.delete("/students/{student_id}")
def delete_student(student_id: int, db: DBSession = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()

    if student is None:
        raise HTTPException(status_code=404, detail="Mahasiswa tidak ditemukan.")

    session_count = (
        db.query(CounselingSession)
        .filter(CounselingSession.student_id == student_id)
        .count()
    )

    if session_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Mahasiswa tidak dapat dihapus karena sudah memiliki riwayat sesi konseling.",
        )

    db.delete(student)
    db.commit()

    return {
        "success": True,
        "message": "Mahasiswa berhasil dihapus.",
        "deleted_id": student_id,
    }
    student = db.query(Student).filter(Student.id == student_id).first()

    if student is None:
        raise HTTPException(status_code=404, detail="Mahasiswa tidak ditemukan.")

    db.delete(student)
    db.commit()

    return {
        "success": True,
        "message": "Mahasiswa berhasil dihapus.",
        "deleted_id": student_id,
    }

@app.post("/uploads/users")
async def upload_user_photo(file: UploadFile = File(...)):
    allowed_types = ["image/jpeg", "image/png", "image/webp"]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Format foto harus JPG, PNG, atau WEBP.",
        )

    contents = await file.read()

    max_size = 2 * 1024 * 1024
    if len(contents) > max_size:
        raise HTTPException(
            status_code=400,
            detail="Ukuran foto maksimal 2MB.",
        )

    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in [".jpg", ".jpeg", ".png", ".webp"]:
        extension = ".png"

    filename = f"{uuid.uuid4().hex}{extension}"
    folder_path = os.path.join(UPLOAD_DIR, "profile")
    os.makedirs(folder_path, exist_ok=True)

    file_path = os.path.join(folder_path, filename)

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    photo_url = f"/uploads/profile/{filename}"

    return {
        "success": True,
        "message": "Foto profil berhasil diupload.",
        "photo_url": photo_url,
    }

@app.post("/uploads/students")
async def upload_student_photo(file: UploadFile = File(...)):
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}

    original_name = file.filename or ""
    extension = os.path.splitext(original_name)[1].lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Format foto harus JPG, JPEG, PNG, atau WEBP."
        )

    contents = await file.read()

    max_size = 2 * 1024 * 1024
    if len(contents) > max_size:
        raise HTTPException(
            status_code=400,
            detail="Ukuran foto maksimal 2MB."
        )

    filename = f"{uuid.uuid4().hex}{extension}"
    file_path = os.path.join(STUDENT_UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    photo_url = f"/uploads/students/{filename}"

    return {
        "success": True,
        "message": "Foto mahasiswa berhasil diupload.",
        "photo_url": photo_url,
    }

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/sessions")
def get_sessions(db: DBSession = Depends(get_db)):
    sessions = (
        db.query(CounselingSession)
        .order_by(CounselingSession.id.desc())
        .all()
    )

    return [format_session_response(session) for session in sessions]


@app.get("/sessions/{session_id}")
def get_session(session_id: int, db: DBSession = Depends(get_db)):
    session = (
        db.query(CounselingSession)
        .filter(CounselingSession.id == session_id)
        .first()
    )

    if session is None:
        raise HTTPException(status_code=404, detail="Sesi konseling tidak ditemukan.")

    return format_session_response(session)


@app.post("/sessions")
def create_session(
    payload: CounselingSessionCreate,
    db: DBSession = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == payload.student_id).first()

    if student is None:
        raise HTTPException(status_code=404, detail="Mahasiswa tidak ditemukan.")

    new_session = CounselingSession(
        session_code=generate_session_code(db),
        student_id=payload.student_id,
        counselor_id=payload.counselor_id,

        title=payload.title,
        counseling_type=payload.counseling_type,
        topic=payload.topic,
        goal=payload.goal,
        initial_note=payload.initial_note,
        location=payload.location,

        scheduled_date=payload.scheduled_date,
        scheduled_time=payload.scheduled_time,
        estimated_duration=payload.estimated_duration,
        actual_duration=payload.actual_duration,

        status=payload.status or "Terjadwal",
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return format_session_response(new_session)


@app.put("/sessions/{session_id}")
def update_session(
    session_id: int,
    payload: CounselingSessionUpdate,
    db: DBSession = Depends(get_db)
):
    session = (
        db.query(CounselingSession)
        .filter(CounselingSession.id == session_id)
        .first()
    )

    if session is None:
        raise HTTPException(status_code=404, detail="Sesi konseling tidak ditemukan.")

    if payload.student_id is not None:
        student = db.query(Student).filter(Student.id == payload.student_id).first()

        if student is None:
            raise HTTPException(status_code=404, detail="Mahasiswa tidak ditemukan.")

        session.student_id = payload.student_id

    if payload.counselor_id is not None:
        session.counselor_id = payload.counselor_id

    if payload.title is not None:
        session.title = payload.title

    if payload.counseling_type is not None:
        session.counseling_type = payload.counseling_type

    if payload.topic is not None:
        session.topic = payload.topic

    if payload.goal is not None:
        session.goal = payload.goal

    if payload.initial_note is not None:
        session.initial_note = payload.initial_note

    if payload.location is not None:
        session.location = payload.location

    if payload.scheduled_date is not None:
        session.scheduled_date = payload.scheduled_date

    if payload.scheduled_time is not None:
        session.scheduled_time = payload.scheduled_time

    if payload.estimated_duration is not None:
        session.estimated_duration = payload.estimated_duration

    if payload.actual_duration is not None:
        session.actual_duration = payload.actual_duration

    if payload.status is not None:
        session.status = payload.status

    session.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(session)

    return format_session_response(session)


@app.delete("/sessions/{session_id}")
def delete_session(session_id: int, db: DBSession = Depends(get_db)):
    session = (
        db.query(CounselingSession)
        .filter(CounselingSession.id == session_id)
        .first()
    )

    if session is None:
        raise HTTPException(status_code=404, detail="Sesi konseling tidak ditemukan.")

    db.delete(session)
    db.commit()

    return {
        "success": True,
        "message": "Sesi konseling berhasil dihapus.",
        "deleted_id": session_id,
    }

@app.get("/sessions/{session_id}/emotion-logs")
def get_emotion_logs(session_id: int, db: DBSession = Depends(get_db)):
    session = (
        db.query(CounselingSession)
        .filter(CounselingSession.id == session_id)
        .first()
    )

    if session is None:
        raise HTTPException(status_code=404, detail="Sesi konseling tidak ditemukan.")

    logs = (
        db.query(EmotionLog)
        .filter(EmotionLog.session_id == session_id)
        .order_by(EmotionLog.timestamp_second.asc())
        .all()
    )

    return logs


@app.post("/emotion-logs")
def create_emotion_log(
    payload: EmotionLogCreate,
    db: DBSession = Depends(get_db)
):
    session = (
        db.query(CounselingSession)
        .filter(CounselingSession.id == payload.session_id)
        .first()
    )

    if session is None:
        raise HTTPException(status_code=404, detail="Sesi konseling tidak ditemukan.")

    new_log = EmotionLog(
        session_id=payload.session_id,
        timestamp_second=payload.timestamp_second,
        emotion=payload.emotion,
        confidence=payload.confidence,
        probabilities_json=payload.probabilities_json,
    )

    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return new_log

@app.get("/sessions/{session_id}/markers")
def get_session_markers(session_id: int, db: DBSession = Depends(get_db)):
    session = (
        db.query(CounselingSession)
        .filter(CounselingSession.id == session_id)
        .first()
    )

    if session is None:
        raise HTTPException(status_code=404, detail="Sesi konseling tidak ditemukan.")

    markers = (
        db.query(SessionMarker)
        .filter(SessionMarker.session_id == session_id)
        .order_by(SessionMarker.timestamp_second.asc())
        .all()
    )

    return markers


@app.post("/session-markers")
def create_session_marker(
    payload: SessionMarkerCreate,
    db: DBSession = Depends(get_db)
):
    session = (
        db.query(CounselingSession)
        .filter(CounselingSession.id == payload.session_id)
        .first()
    )

    if session is None:
        raise HTTPException(status_code=404, detail="Sesi konseling tidak ditemukan.")

    new_marker = SessionMarker(
        session_id=payload.session_id,
        timestamp_second=payload.timestamp_second,
        title=payload.title,
        category=payload.category,
        note=payload.note,
        dominant_emotion_after_marker=payload.dominant_emotion_after_marker,
    )

    db.add(new_marker)
    db.commit()
    db.refresh(new_marker)

    return new_marker

@app.post("/reports/generate")
def generate_report(
    payload: ReportCreate,
    db: DBSession = Depends(get_db)
):
    session = (
        db.query(CounselingSession)
        .filter(CounselingSession.id == payload.session_id)
        .first()
    )

    if session is None:
        raise HTTPException(status_code=404, detail="Sesi konseling tidak ditemukan.")

    logs = (
        db.query(EmotionLog)
        .filter(EmotionLog.session_id == payload.session_id)
        .order_by(EmotionLog.timestamp_second.asc())
        .all()
    )

    if len(logs) == 0:
        raise HTTPException(
            status_code=400,
            detail="Belum ada data deteksi untuk membuat laporan."
        )

    markers = (
        db.query(SessionMarker)
        .filter(SessionMarker.session_id == payload.session_id)
        .order_by(SessionMarker.timestamp_second.asc())
        .all()
    )

    calculated = calculate_report_from_logs(session, logs, markers)

    existing_report = (
        db.query(Report)
        .filter(Report.session_id == payload.session_id)
        .first()
    )

    if existing_report:
        report = existing_report
        report.dominant_emotion = calculated["dominant_emotion"]
        report.dominant_percentage = calculated["dominant_percentage"]
        report.total_detections = calculated["total"]
        report.emotion_summary_json = json.dumps(calculated["emotion_summary"])
        report.timeline_summary_json = json.dumps(calculated["timeline_summary"])
        report.interpretation = calculated["interpretation"]
        report.recommendation = calculated["recommendation"]
        report.updated_at = datetime.utcnow()
    else:
        report = Report(
            report_code=generate_report_code(db),
            session_id=payload.session_id,
            dominant_emotion=calculated["dominant_emotion"],
            dominant_percentage=calculated["dominant_percentage"],
            total_detections=calculated["total"],
            emotion_summary_json=json.dumps(calculated["emotion_summary"]),
            timeline_summary_json=json.dumps(calculated["timeline_summary"]),
            interpretation=calculated["interpretation"],
            recommendation=calculated["recommendation"],
            model_name="LightExNet V2",
            model_accuracy=80.55,
        )

        db.add(report)

    session.status = "Selesai"
    session.actual_duration = session.actual_duration or session.estimated_duration
    session.ended_at = datetime.utcnow()
    session.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(report)
    db.refresh(session)

    return format_report_response(report, session)


@app.get("/reports")
def get_reports(db: DBSession = Depends(get_db)):
    reports = (
        db.query(Report)
        .order_by(Report.id.desc())
        .all()
    )

    result = []

    for report in reports:
        session = (
            db.query(CounselingSession)
            .filter(CounselingSession.id == report.session_id)
            .first()
        )

        result.append(format_report_response(report, session))

    return result


@app.get("/reports/{report_id}")
def get_report(report_id: int, db: DBSession = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()

    if report is None:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan.")

    session = (
        db.query(CounselingSession)
        .filter(CounselingSession.id == report.session_id)
        .first()
    )

    return format_report_response(report, session)

@app.delete("/reports/{report_id}")
def delete_report(report_id: int, db: DBSession = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()

    if report is None:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan.")

    db.delete(report)
    db.commit()

    return {
        "success": True,
        "message": "Laporan berhasil dihapus.",
        "deleted_id": report_id,
    }

@app.get("/sessions/{session_id}/report")
def get_report_by_session(session_id: int, db: DBSession = Depends(get_db)):
    session = (
        db.query(CounselingSession)
        .filter(CounselingSession.id == session_id)
        .first()
    )

    if session is None:
        raise HTTPException(status_code=404, detail="Sesi konseling tidak ditemukan.")

    report = (
        db.query(Report)
        .filter(Report.session_id == session_id)
        .first()
    )

    if report is None:
        raise HTTPException(status_code=404, detail="Laporan untuk sesi ini belum tersedia.")

    return format_report_response(report, session)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()

        np_arr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return {
                "success": False,
                "message": "Gambar tidak valid.",
                "dominant_emotion": "-",
                "confidence": 0,
                "scores": {},
            }

        frame_height, frame_width = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=4,
            minSize=(40, 40),
        )

        if len(faces) == 0:
            return {
                "success": False,
                "message": "Wajah tidak terdeteksi.",
                "dominant_emotion": "Tidak Terdeteksi",
                "confidence": 0,
                "scores": {emotion: 0 for emotion in CLASS_NAMES},
                "frame_size": {
                    "width": int(frame_width),
                    "height": int(frame_height),
                },
                "face_box": None,
            }

        faces = sorted(faces, key=lambda box: box[2] * box[3], reverse=True)
        x, y, w, h = faces[0]

        face_roi = gray[y:y + h, x:x + w]

        face_roi = cv2.resize(face_roi, (48, 48))
        face_roi = face_roi.astype("float32") / 255.0

        input_data = np.expand_dims(face_roi, axis=-1)
        input_data = np.expand_dims(input_data, axis=0)

        predictions = model.predict(input_data, verbose=0)[0]

        predicted_index = int(np.argmax(predictions))
        confidence = float(predictions[predicted_index])
        dominant_emotion = CLASS_NAMES[predicted_index]

        scores = {
            CLASS_NAMES[i]: round(float(predictions[i]), 4)
            for i in range(len(CLASS_NAMES))
        }

        return {
            "success": True,
            "message": "Prediksi berhasil.",
            "dominant_emotion": dominant_emotion,
            "confidence": round(confidence, 4),
            "scores": scores,
            "frame_size": {
                "width": int(frame_width),
                "height": int(frame_height),
            },
            "face_box": {
                "x": int(x),
                "y": int(y),
                "w": int(w),
                "h": int(h),
            },
        }

    except Exception as error:
        print("ERROR:", error)
        return {
            "success": False,
            "message": str(error),
            "dominant_emotion": "Error",
            "confidence": 0,
            "scores": {},
            "face_box": None,
        }
