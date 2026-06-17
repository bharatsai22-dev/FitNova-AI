from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class GoogleAuthModel(BaseModel):
    email: EmailStr
    name: str
    avatar: str

class UserModel(BaseModel):
    email: EmailStr
    name: str
    avatar: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Pre-allocating blank placeholders for all your premium features
    virtual_buddy_chats: List[Dict[str, Any]] = []
    workout_history: List[Dict[str, Any]] = []
    dietician_plans: List[Dict[str, Any]] = []
    iot_hub_snapshots: List[Dict[str, Any]] = []
    booked_slots: List[Dict[str, Any]] = []
    pose_analysis_history: List[Dict[str, Any]] = []
class WorkoutRecordCreate(BaseModel):
    workout_type: str            # e.g., "squats", "bicep_curls"
    reps: int
    avg_accuracy: float          # e.g., 88.5
    duration_seconds: int
    telemetry_data: Optional[List[Any]] = None
class WorkoutRecordResponse(WorkoutRecordCreate):
    id: Optional[str] = None     # Will hold MongoDB ObjectId string or Postgres Integer ID
    user_id: str                 # Links back to the Google user
    created_at: datetime

    class Config:
        from_attributes = True
class WorkoutLogSchema(BaseModel):
    userId: str
    userEmail: Optional[str] = None
    date: str
    exercise: str
    reps: int
    score: int
    form: int
    rom: int
    stability: int
    smoothness: int