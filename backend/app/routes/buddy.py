import os
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

# This is exactly what main.py line 445 is looking for!
router = APIRouter()

# DB Connection Setup
MONGO_DETAILS = os.getenv("MONGO_DETAILS", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_DETAILS)
db = client.fitnova_db
users_collection = db.users

class ChatMessageSchema(BaseModel):
    message: str

@router.get("/buddy/chat/{user_id}")
async def get_buddy_chat_history(user_id: str):
    """
    Fetch history for the Virtual GymBuddy AI chat.
    """
    try:
        user = await users_collection.find_one({"$or": [{"_id": user_id}, {"uid": user_id}]})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {"status": "success", "chats": user.get("virtual_buddy_chats", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/buddy/chat/{user_id}")
async def send_buddy_message(user_id: str, payload: ChatMessageSchema):
    """
    Send a message to the AI GymBuddy.
    """
    return {
        "status": "success",
        "reply": f"Hey! I received your message: '{payload.message}'. Let's crush this workout!"
    }