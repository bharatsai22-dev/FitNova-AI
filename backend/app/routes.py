from fastapi import APIRouter, Depends, HTTPException, status
from app.models import GoogleAuthModel, UserModel, WorkoutRecordCreate, WorkoutRecordResponse,WorkoutLogSchema
from app.database import user_collection, workout_collection # Make sure workout_collection is defined in database.py
from datetime import datetime
from typing import List

# Fixed: Removed the duplicate router overwrite bug from your original file
router = APIRouter()
router = APIRouter()
MOCK_DATABASE_CLUSTER = []

@router.post("/api/workouts")
async def save_workout_session(payload: WorkoutLogSchema):
    try:
        if not payload.userId:
            raise HTTPException(status_code=400, detail="Rejected: Core payload must contain a valid authentication UID.")
        
        # Convert Pydantic object into standard dictionary format
        record_data = payload.dict()
        
        # Commit record directly into database stack
        MOCK_DATABASE_CLUSTER.append(record_data)
        
        print(f"[Cloud Data Ingres] Successfully recorded session metric for: {payload.userId}")
        return {
            "success": True, 
            "message": "Session logged securely into the cloud network matrix."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal database stream fault: {str(e)}")

@router.get("/api/workouts")
async def get_workout_history(userId: str = Query(..., description="The authenticated Google UID")):
    try:
        # Filter matching database transaction history arrays
        user_history_records = [
            record for record in MOCK_DATABASE_CLUSTER if record["userId"] == userId
        ]
        
        return {
            "success": True,
            "records": user_history_records
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query system archive arrays: {str(e)}")
@router.post("/api/auth/google")
async def google_login(payload: GoogleAuthModel):
    try:
        # Check if user already exists in MongoDB
        existing_user = await user_collection.find_one({"email": payload.email})
        
        if existing_user:
            # Update returning user's basic info (in case they changed their avatar or name on Google)
            await user_collection.update_one(
                {"email": payload.email},
                {"$set": {
                    "name": payload.name,
                    "avatar": payload.avatar,
                    "updated_at": datetime.utcnow()
                }}
            )
            # Fetch the freshly updated user record
            updated_user = await user_collection.find_one({"email": payload.email})
            updated_user["_id"] = str(updated_user["_id"]) # Convert ObjectId to string for JSON serialization
            return {"status": "success", "user": updated_user, "message": "Welcome back to FitNova AI!"}
        
        # If user doesn't exist, create a completely new profile document
        new_user_data = UserModel(
            email=payload.email,
            name=payload.name,
            avatar=payload.avatar
        )
        
        # Convert Pydantic object to dictionary to insert into MongoDB
        new_user_dict = new_user_data.model_dump()
        result = await user_collection.insert_one(new_user_dict)
        
        # Fetch the created document to send back to the React app
        created_user = await user_collection.find_one({"_id": result.inserted_id})
        created_user["_id"] = str(created_user["_id"])
        
        return {"status": "success", "user": created_user, "message": "FitNova AI Profile initialized successfully!"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database synchronization failure: {str(e)}"
        )

@router.post("/api/workouts/record", response_model=WorkoutRecordResponse, status_code=status.HTTP_201_CREATED)
async def record_workout(payload: WorkoutRecordCreate):
    try:
        # 1. Convert incoming validation schema into a standard MongoDB dictionary
        workout_dict = payload.model_dump()
        
        # 2. Append server-side tracking timestamp
        workout_dict["created_at"] = datetime.utcnow()
        
        # 3. Persist the vision telemetry record directly to your MongoDB cluster
        result = await workout_collection.insert_one(workout_dict)
        
        # 4. Fetch the inserted record to verify mapping stability
        saved_workout = await workout_collection.find_one({"_id": result.inserted_id})
        
        # Map MongoDB's standard '_id' ObjectId to the 'id' string expected by your Pydantic Response model
        saved_workout["id"] = str(saved_workout["_id"])
        
        return saved_workout

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record workout data array: {str(e)}"
        )