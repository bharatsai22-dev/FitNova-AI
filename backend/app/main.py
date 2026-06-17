import os
import asyncio
import random
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from google import genai

# Clean Phase 3 Imports
from app.routes import workouts, buddy, admin, support

# =====================================================================
# 1. CORE ENGINE & THIRD-PARTY SERVICE INITIALIZATION
# =====================================================================
app = FastAPI(
    title="FitNova AI Core Engine",
    description="High-Performance Machine Learning & Fitness Synchronization Architecture",
    version="1.0.0"
)

# Shared CORS Configuration for your React UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connectivity setup
MONGO_DETAILS = os.getenv("MONGO_DETAILS", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_DETAILS)
db = client.fitnova_db
users_collection = db.users 

# Initialize Gemini Client once for all modules
client_ai = genai.Client()

# =====================================================================
# 2. DATA VALIDATION SCHEMAS (Pydantic Layer Models)
# =====================================================================
class GoogleAuthRequest(BaseModel):
    uid: Optional[str] = None  
    email: EmailStr
    name: str
    avatar: Optional[str] = ""

class ChatMessageSchema(BaseModel):
    user_id: str   
    message: str
    conversation_id: Optional[str] = None  

class DietPlanRequestSchema(BaseModel):
    user_id: str
    weight: float
    height: float
    age: int
    goal: str

class TelemetryLogSchema(BaseModel):
    user_id: str
    calories: int
    time_spent: int

class WorkoutGoal(BaseModel):
    user_id: str
    target_mode: str  

# =====================================================================
# 3. BACKGROUND HELPER UTILITIES
# =====================================================================
def get_user_query(user_id: str) -> dict:
    """
    Dynamically builds a database selector matching native ObjectIds 
    or custom Firebase UID strings without crashing.
    """
    try:
        if ObjectId.is_valid(user_id):
            return {"$or": [{"_id": ObjectId(user_id)}, {"_id": user_id}, {"uid": user_id}]}
    except Exception:
        pass
    return {"$or": [{"_id": user_id}, {"uid": user_id}]}

async def generate_ai_coaching_adjustment(heart_rate: int, bp_systolic: int, current_resistance: int, target_mode: str) -> str:
    """
    Asynchronously passes immediate real-time metrics into Gemini to prevent event-loop blocking.
    """
    try:
        prompt = f"""
        You are an embedded Smart Gym IoT Assistant. A user is training on a smart cable machine under '{target_mode}' mode.
        Current Hardware Metrics:
        - Heart Rate: {heart_rate} bpm
        - Blood Pressure (Systolic): {bp_systolic} mmHg
        - Current Machine Resistance Level: {current_resistance}/10

        Analyze these vitals instantly. Provide a brief 2-sentence maximum instruction. 
        Specify if the machine should: 'INCREASE RESISTANCE', 'DECREASE RESISTANCE', or 'MAINTAIN & START REST'. 
        Keep your tone authoritative, precise, and safety-focused.
        """
        
        response = await client_ai.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        print(f"IoT AI Stream Exception: {str(e)}")
        if heart_rate > 155:
            return "SAFETY ALERT: Heart rate elevated. Automatically decreasing machine resistance by 3 levels. Take deep breaths."
        return "Metrics normalized. Maintain current velocity and posture."

# =====================================================================
# 4. CORE ROUTE PROCESSING SYSTEM
# =====================================================================

@app.get("/", tags=["System"])
async def health_check():
    return {
        "status": "ONLINE",
        "system": "FitNova Core Backend Engine",
        "protocol": "Nominal"
    }

@app.post("/api/auth/google", status_code=status.HTTP_200_OK, tags=["Authentication"])
async def sync_google_user(user_data: GoogleAuthRequest):
    try:
        search_query = {"email": user_data.email}
        if user_data.uid:
            search_query = {"$or": [{"email": user_data.email}, {"_id": user_data.uid}, {"uid": user_data.uid}]}
            
        existing_user = await users_collection.find_one(search_query)
        
        if existing_user:
            existing_user["_id"] = str(existing_user["_id"])
            update_data = {"name": user_data.name, "avatar": user_data.avatar}
            if user_data.uid:
                update_data["uid"] = user_data.uid
                
            await users_collection.update_one(
                {"email": user_data.email},
                {"$set": update_data}
            )
            return {"status": "success", "message": "Welcome back!", "user": existing_user}
        
        # Added 'role': 'user' here to safely establish RBAC profiles
        new_user_document = {
            "email": user_data.email,
            "name": user_data.name,
            "avatar": user_data.avatar,
            "role": "user",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "virtual_buddy_chats": [],
            "workout_history": [],
            "dietician_plans": [],
            "habit_logs": [],
            "iot_telemetry": []
        }
        
        if user_data.uid:
            new_user_document["_id"] = user_data.uid
            new_user_document["uid"] = user_data.uid
            
        result = await users_collection.insert_one(new_user_document)
        if "_id" not in new_user_document:
            new_user_document["_id"] = str(result.inserted_id)
            
        return {"status": "success", "message": "Profile initialized.", "user": new_user_document}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database sync failed: {str(e)}")


@app.post("/api/buddy/chat", tags=["Buddy"])
async def process_buddy_chat(payload: ChatMessageSchema):
    try:
        user_message = payload.message
        user_id = payload.user_id
        conv_id = payload.conversation_id
        
        system_instruction = (
            "You are an elite, high-energy Virtual Gym Buddy and personal fitness trainer. "
            "Your tone is motivational, professional, and slightly intense. You give expert fitness, "
            "workout split, and physiological advice. Keep answers clear, tactical, and punchy."
        )
        
        contents_payload = []
        if conv_id:
            user_query = get_user_query(user_id)
            user_query["virtual_buddy_chats.conversation_id"] = conv_id
            
            user_doc = await users_collection.find_one(
                user_query,
                {"virtual_buddy_chats.$": 1}
            )
            if user_doc and "virtual_buddy_chats" in user_doc:
                past_messages = user_doc["virtual_buddy_chats"][0].get("messages", [])
                for msg in past_messages[-12:]:
                    role_mapping = "model" if msg["role"] == "ai" else "user"
                    contents_payload.append({"role": role_mapping, "parts": [{"text": msg["content"]}]})
        
        if not contents_payload:
            contents_payload = [user_message]
        else:
            contents_payload.append({"role": "user", "parts": [{"text": user_message}]})

        ai_reply = None
        max_retries = 3
        
        for attempt in range(max_retries):
            try:
                response = await client_ai.aio.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=contents_payload,
                    config={
                        'system_instruction': system_instruction,
                        'temperature': 0.7,
                    }
                )
                ai_reply = response.text
                break
            except Exception as gemini_err:
                err_str = str(gemini_err)
                if "503" in err_str or "UNAVAILABLE" in err_str:
                    print(f"⚠️ Gemini servers busy (Attempt {attempt + 1}/{max_retries}). Retrying...")
                    await asyncio.sleep(1.5)
                else:
                    raise gemini_err
        
        if not ai_reply:
            ai_reply = "Hey! My connection stuttered for a second. Don't lose focus—send your message one more time and let's get after it!"

        user_msg = {"role": "user", "content": user_message, "timestamp": datetime.now(timezone.utc).isoformat()}
        ai_msg = {"role": "ai", "content": ai_reply, "timestamp": datetime.now(timezone.utc).isoformat()}
        
        try:
            if not conv_id:
                conv_id = str(ObjectId())
                title = user_message[:28] + "..." if len(user_message) > 28 else user_message
                
                new_conversation = {
                    "conversation_id": conv_id,
                    "title": title,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "messages": [user_msg, ai_msg]
                }
                
                await users_collection.update_one(
                    get_user_query(user_id),
                    {"$push": {"virtual_buddy_chats": new_conversation}}
                )
            else:
                update_query = get_user_query(user_id)
                update_query["virtual_buddy_chats.conversation_id"] = conv_id
                await users_collection.update_one(
                    update_query,
                    {"$push": {"virtual_buddy_chats.$.messages": {"$each": [user_msg, ai_msg]}}}
                )
        except Exception as db_err:
            print(f"Database Session Logging Bypassed: {str(db_err)}")
            if not conv_id:
                conv_id = "temp_session_id"
            
        return {"status": "success", "reply": ai_reply, "conversation_id": conv_id}
        
    except Exception as e:
        print(f"CHATTING ROUTE CRASHED: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gym Buddy Engine error: {str(e)}")


@app.get("/api/buddy/history/{user_id}", tags=["Buddy"])
async def get_buddy_history(user_id: str):
    try:
        user = await users_collection.find_one(get_user_query(user_id))
        if not user:
            return {"status": "success", "history": []}
            
        return {"status": "success", "history": user.get("virtual_buddy_chats", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/buddy/conversation/{user_id}/{conversation_id}", tags=["Buddy"])
async def delete_buddy_conversation(user_id: str, conversation_id: str, timestamp: Optional[str] = None):
    try:
        query = get_user_query(user_id)
        if conversation_id == "legacy" and timestamp:
            await users_collection.update_one(query, {"$pull": {"virtual_buddy_chats": {"timestamp": timestamp}}})
        elif conversation_id == "legacy":
            await users_collection.update_one(query, {"$pull": {"virtual_buddy_chats": {"conversation_id": {"$exists": False}}}})
        else:
            await users_collection.update_one(query, {"$pull": {"virtual_buddy_chats": {"conversation_id": conversation_id}}})
            
        return {"status": "success", "message": "Conversation context dropped successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# FEATURE MODULE 2: AI Dietician Dynamic Generator
@app.post("/api/dietician/generate", tags=["Dietician"])
async def generate_diet_plan(payload: DietPlanRequestSchema):
    try:
        height_meters = payload.height / 100
        bmi = round(payload.weight / (height_meters ** 2), 1)
        
        prompt = (
            f"You are FitNova's Senior AI Dietician. Generate a structured, professional dietary plan for a user with these metrics:\n"
            f"- Age: {payload.age} years old\n"
            f"- Height: {payload.height} cm\n"
            f"- Weight: {payload.weight} kg\n"
            f"- Calculated BMI: {bmi}\n"
            f"- Training Core Goal: {payload.goal}\n\n"
            f"Provide target daily calories, custom macronutrient ratios (Protein, Carbs, Fats), and a 3-meal structured breakdown template."
        )
        
        response = await client_ai.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={'temperature': 0.6}
        )
        ai_diet_plan_text = response.text
        
        generated_plan_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "bmi_calculated": bmi,
            "raw_ai_diet_plan": ai_diet_plan_text
        }
        
        try:
            await users_collection.update_one(
                get_user_query(payload.user_id),
                {"$push": {"dietician_plans": generated_plan_entry}}
            )
        except Exception as db_err:
            print(f"Database Logging Bypassed (Dietician History): {str(db_err)}")
            
        return {"status": "success", "plan": ai_diet_plan_text}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dietician Matrix failure: {str(e)}")


@app.get("/api/dietician/history/{user_id}", tags=["Dietician"])
async def get_dietician_history(user_id: str):
    try:
        user = await users_collection.find_one(get_user_query(user_id))
        if not user:
            return {"status": "success", "history": []}
            
        return {"status": "success", "history": user.get("dietician_plans", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# FEATURE MODULE 3: Telemetry Activity Sync Tracker
@app.post("/api/tracker/log-workout", tags=["Tracker"])
async def log_workout_session(payload: TelemetryLogSchema):
    try:
        session_entry = {
            "date": datetime.now(timezone.utc).date().isoformat(),
            "calories_burned": payload.calories,
            "duration_minutes": payload.time_spent
        }
        
        await users_collection.update_one(
            get_user_query(payload.user_id),
            {"$push": {"workout_history": session_entry}}
        )
        return {"status": "success", "message": "Telemetry matrix payload saved."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tracker sync failed: {str(e)}")


@app.get("/api/tracker/history/{user_id}", tags=["Tracker"])
async def get_workout_history(user_id: str):
    try:
        user = await users_collection.find_one(get_user_query(user_id))
        if not user:
            return {"status": "success", "history": []}
            
        return {"status": "success", "history": user.get("workout_history", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# FEATURE MODULE 4: REAL-TIME WEBSOCKET STREAM (Smart Gym IoT Ecosystem)
@app.websocket("/ws/iot/smart-gym")
async def websocket_smart_gym_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    current_resistance = 5
    target_mode = "FatBurn"
    
    try:
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_json(), timeout=0.1)
                target_mode = data.get("target_mode", target_mode)
            except asyncio.TimeoutError:
                pass 

            heart_rate = random.randint(110, 165) if target_mode == "CardioEndurance" else random.randint(95, 145)
            bp_systolic = random.randint(120, 145)
            rep_velocity = round(random.uniform(0.4, 1.2), 2)
            
            ai_guidance = await generate_ai_coaching_adjustment(heart_rate, bp_systolic, current_resistance, target_mode)
            
            if "DECREASE" in ai_guidance.upper() and current_resistance > 1:
                current_resistance -= 1
            elif "INCREASE" in ai_guidance.upper() and current_resistance < 10:
                current_resistance += 1

            telemetry_packet = {
                "heart_rate": heart_rate,
                "blood_pressure": f"{bp_systolic}/{random.randint(75, 88)}",
                "rep_velocity": f"{rep_velocity} m/s",
                "current_resistance": current_resistance,
                "ai_coaching_feedback": ai_guidance,
                "connection_status": "ONLINE (BLE Connected)"
            }

            await websocket.send_json(telemetry_packet)
            await asyncio.sleep(2.5)
            
    except WebSocketDisconnect:
        print("Smart Device Disconnected from Bluetooth Host Hub Gateway Node.")


@app.post("/api/auth/logout", tags=["Authentication"])
async def logout_user(payload: dict):
    try:
        user_id = payload.get("user_id")
        print(f"🔒 Security event: User session {user_id} disconnected from client side.")
        return {"status": "success", "message": "Backend authorization reference cleared successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================================
# 5. EXTERNAL ROUTER ATTACHMENTS (Cleaned & De-duplicated)
# =====================================================================
app.include_router(workouts.router, prefix="/api", tags=["Workouts"])
app.include_router(buddy.router, prefix="/api", tags=["GymBuddy"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])
app.include_router(support.router, prefix="/api", tags=["Support"])