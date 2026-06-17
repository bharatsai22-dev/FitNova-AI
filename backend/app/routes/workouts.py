import os
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

router = APIRouter()

# DB Connection Setup (Consistent with admin.py)
MONGO_DETAILS = os.getenv("MONGO_DETAILS", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_DETAILS)
db = client.fitnova_db
users_collection = db.users

# --- Pydantic Schemas ---

class ExerciseModel(BaseModel):
    name: str = Field(..., example="Bench Press")
    sets: int = Field(..., gt=0, example=4)
    reps: int = Field(..., gt=0, example=10)
    weight_kg: float = Field(..., ge=0, example=60.0)

class WorkoutSessionSchema(BaseModel):
    title: str = Field(..., example="Push Day Power")
    duration_minutes: int = Field(..., gt=0, example=45)
    exercises: List[ExerciseModel]
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow)

# --- Helper Functions ---

def get_user_query(user_id: str) -> dict:
    try:
        if ObjectId.is_valid(user_id):
            return {"$or": [{"_id": ObjectId(user_id)}, {"_id": user_id}, {"uid": user_id}]}
    except Exception:
        pass
    return {"$or": [{"_id": user_id}, {"uid": user_id}]}

# --- Routes ---

@router.post("/workouts/{user_id}", status_code=status.HTTP_201_CREATED)
async def log_workout(user_id: str, session: WorkoutSessionSchema):
    """
    Log a new completed workout session and append it to the user's workout history.
    """
    query = get_user_query(user_id)
    user = await users_collection.find_one(query)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found."
        )
    
    # Convert Pydantic model to dictionary, formatting the datetime for Mongo
    session_data = session.dict()
    if isinstance(session_data["timestamp"], datetime):
        session_data["timestamp"] = session_data["timestamp"].isoformat()

    try:
        # Push the new workout into the user's workout_history array
        result = await users_collection.update_one(
            query,
            {"$push": {"workout_history": session_data}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to log workout session.")

        return {
            "status": "success",
            "message": "Workout session logged seamlessly.",
            "session": session_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database operational error: {str(e)}")


@router.get("/workouts/{user_id}", response_model=List[WorkoutSessionSchema])
async def get_workout_history(user_id: str):
    """
    Retrieve the entire tracking history of workouts logged by a user.
    """
    query = get_user_query(user_id)
    user = await users_collection.find_one(query, {"workout_history": 1, "_id": 0})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found."
        )
        
    # Return the history array, defaulting to an empty list if it doesn't exist yet
    return user.get("workout_history", [])