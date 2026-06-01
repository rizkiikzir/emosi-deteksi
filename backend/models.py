from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    user_code = Column(String, unique=True, index=True, nullable=True)

    name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=False)

    role = Column(String, default="Konselor / Admin")
    unit = Column(String, default="Unit BK Politeknik Negeri Lhokseumawe")
    status = Column(String, default="Akun Aktif")
    photo_url = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("Session", back_populates="counselor")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_code = Column(String, unique=True, index=True, nullable=False)

    nim = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    program_study = Column(String, nullable=False)
    generation = Column(String, nullable=False)
    status = Column(String, default="Aktif")
    photo_url = Column(String, nullable=True)

    registered_at = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("Session", back_populates="student")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_code = Column(String, unique=True, index=True, nullable=False)

    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    counselor_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    title = Column(String, nullable=False)
    counseling_type = Column(String, nullable=True)
    topic = Column(String, nullable=True)
    goal = Column(Text, nullable=True)
    initial_note = Column(Text, nullable=True)
    location = Column(String, nullable=True)

    scheduled_date = Column(String, nullable=True)
    scheduled_time = Column(String, nullable=True)
    estimated_duration = Column(String, nullable=True)
    actual_duration = Column(String, nullable=True)

    status = Column(String, default="Terjadwal")

    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="sessions")
    counselor = relationship("User", back_populates="sessions")

    emotion_logs = relationship("EmotionLog", back_populates="session", cascade="all, delete-orphan")
    markers = relationship("SessionMarker", back_populates="session", cascade="all, delete-orphan")
    report = relationship("Report", back_populates="session", uselist=False, cascade="all, delete-orphan")


class EmotionLog(Base):
    __tablename__ = "emotion_logs"

    id = Column(Integer, primary_key=True, index=True)

    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)

    timestamp_second = Column(Integer, nullable=False)
    emotion = Column(String, nullable=False)
    confidence = Column(Float, nullable=True)

    probabilities_json = Column(Text, nullable=True)

    detected_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="emotion_logs")


class SessionMarker(Base):
    __tablename__ = "session_markers"

    id = Column(Integer, primary_key=True, index=True)

    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)

    timestamp_second = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    category = Column(String, nullable=True)
    note = Column(Text, nullable=True)
    dominant_emotion_after_marker = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="markers")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_code = Column(String, unique=True, index=True, nullable=False)

    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)

    dominant_emotion = Column(String, nullable=True)
    dominant_percentage = Column(Float, nullable=True)
    total_detections = Column(Integer, default=0)

    emotion_summary_json = Column(Text, nullable=True)
    timeline_summary_json = Column(Text, nullable=True)

    interpretation = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)

    model_name = Column(String, default="LightExNet V2")
    model_accuracy = Column(Float, nullable=True)

    pdf_url = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="report")