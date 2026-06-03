from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StudentBase(BaseModel):
    nim: str
    name: str
    program_study: str
    generation: str
    status: Optional[str] = "Aktif"
    photo_url: Optional[str] = None
    registered_at: Optional[str] = None


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    nim: Optional[str] = None
    name: Optional[str] = None
    program_study: Optional[str] = None
    generation: Optional[str] = None
    status: Optional[str] = None
    photo_url: Optional[str] = None
    registered_at: Optional[str] = None


class StudentResponse(StudentBase):
    id: int
    student_code: str
    registered_at: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class CounselingSessionBase(BaseModel):
    student_id: int
    counselor_id: Optional[int] = None

    title: str
    counseling_type: Optional[str] = None
    topic: Optional[str] = None
    goal: Optional[str] = None
    initial_note: Optional[str] = None
    location: Optional[str] = None

    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    estimated_duration: Optional[str] = None
    actual_duration: Optional[str] = None

    status: Optional[str] = "Terjadwal"


class CounselingSessionCreate(CounselingSessionBase):
    pass


class CounselingSessionUpdate(BaseModel):
    student_id: Optional[int] = None
    counselor_id: Optional[int] = None

    title: Optional[str] = None
    counseling_type: Optional[str] = None
    topic: Optional[str] = None
    goal: Optional[str] = None
    initial_note: Optional[str] = None
    location: Optional[str] = None

    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    estimated_duration: Optional[str] = None
    actual_duration: Optional[str] = None

    status: Optional[str] = None


class CounselingSessionResponse(CounselingSessionBase):
    id: int
    session_code: str

    student_name: Optional[str] = None
    student_nim: Optional[str] = None
    student_program_study: Optional[str] = None

    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class EmotionLogCreate(BaseModel):
    session_id: int
    timestamp_second: int
    emotion: str
    confidence: Optional[float] = None
    probabilities_json: Optional[str] = None


class EmotionLogResponse(EmotionLogCreate):
    id: int
    detected_at: datetime

    class Config:
        from_attributes = True


class SessionMarkerCreate(BaseModel):
    session_id: int
    timestamp_second: int
    title: str
    category: Optional[str] = None
    note: Optional[str] = None
    dominant_emotion_after_marker: Optional[str] = None


class SessionMarkerResponse(SessionMarkerCreate):
    id: int
    created_at: datetime

class ReportCreate(BaseModel):
    session_id: int


class ReportResponse(BaseModel):
    id: int
    report_code: str
    session_id: int

    dominant_emotion: Optional[str] = None
    dominant_percentage: Optional[float] = None
    total_detections: int = 0

    emotion_summary_json: Optional[str] = None
    timeline_summary_json: Optional[str] = None

    interpretation: Optional[str] = None
    recommendation: Optional[str] = None

    model_name: Optional[str] = "LightExNet V2"
    model_accuracy: Optional[float] = None
    pdf_url: Optional[str] = None

    created_at: datetime
    updated_at: datetime

class UserUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    unit: Optional[str] = None
    status: Optional[str] = None
    photo_url: Optional[str] = None

    class Config:
        from_attributes = True

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str
class LoginRequest(BaseModel):
    username: str
    password: str