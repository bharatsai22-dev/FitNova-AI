import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_DETAILS = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_DETAILS)
database = client.fitnova_db

# Collections
user_collection = database.get_collection("users")
stats_collection = database.get_collection("daily_stats")
workout_collection = database.get_collection("workouts")  # Added for Phase 2 Workout Memory