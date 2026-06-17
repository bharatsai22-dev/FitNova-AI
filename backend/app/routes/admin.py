import os
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

router = APIRouter()

# DB Connection Setup
MONGO_DETAILS = os.getenv("MONGO_DETAILS", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_DETAILS)
db = client.fitnova_db
users_collection = db.users

def get_user_query(user_id: str) -> dict:
    try:
        if ObjectId.is_valid(user_id):
            return {"$or": [{"_id": ObjectId(user_id)}, {"_id": user_id}, {"uid": user_id}]}
    except Exception:
        pass
    return {"$or": [{"_id": user_id}, {"uid": user_id}]}

async def verify_admin_privileges(admin_id: str):
    """
    Dependency Guard: Checks if the user requesting access has an 'admin' role.
    """
    user = await users_collection.find_one(get_user_query(admin_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User account not found."
        )
    
    if user.get("role", "user") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access Denied: Administrative privileges required."
        )
    return admin_id


@router.get("/admin/metrics/{admin_id}")
async def get_system_metrics(admin_id: str, current_admin: str = Depends(verify_admin_privileges)):
    """
    Protected Route: Only accessible if verify_admin_privileges passes.
    """
    try:
        total_users = await users_collection.count_documents({})
        
        # Aggregate platform-wide analytics safely
        pipeline = [
            {"$project": {
                "chats_count": {"$size": {"$ifNull": ["$virtual_buddy_chats", []]}},
                "workouts_count": {"$size": {"$ifNull": ["$workout_history", []]}}
            }},
            {"$group": {
                "_id": None,
                "total_chats": {"$sum": "$chats_count"},
                "total_workouts": {"$sum": "$workouts_count"}
            }}
        ]
        
        stats_cursor = users_collection.aggregate(pipeline)
        stats_result = await stats_cursor.to_list(length=1)
        aggregates = stats_result[0] if stats_result else {"total_chats": 0, "total_workouts": 0}

        return {
            "status": "success",
            "metrics": {
                "active_subscribers": total_users,
                "total_synced_workouts": aggregates.get("total_workouts", 0),
                "ai_buddy_interactions": aggregates.get("total_chats", 0),
                "core_engine_load": "nominal"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Metrics aggregation failure: {str(e)}")