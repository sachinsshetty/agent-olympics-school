#!/usr/bin/env python3
"""
Tutor Orchestrator FastAPI Server (port 8000)
FIXED: Correct parameter name set_type + improved students endpoint
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
import os
import uvicorn
from typing import Optional, List
from enum import Enum
from contextlib import asynccontextmanager

# ========================================
# CONFIGURATION
# ========================================
SIM_API_BASE = os.environ.get("SIM_API_BASE", "https://knowunity-agent-olympics-2026-api.vercel.app")
TEAM_API_KEY = os.environ["SIM_TEAM_API_KEY"]

client = httpx.AsyncClient(base_url=SIM_API_BASE, timeout=httpx.Timeout(10.0, read=30.0))

def sim_headers():
    return {"X-Api-Key": TEAM_API_KEY}

# ========================================
# Pydantic Models
# ========================================
class SetType(str, Enum):
    MINIDEV = "minidev"
    DEV = "dev"
    EVAL = "eval"

class StartLocalConversationRequest(BaseModel):
    set_type: Optional[SetType] = Field(default="dev", alias="settype")  # accept both in request
    student_id: Optional[str] = None
    topic_id: Optional[str] = None

class LocalConversationInfo(BaseModel):
    conversation_id: str
    student_id: str
    topic_id: str
    topic_name: str
    student_name: str
    gradelevel: int
    max_turns: int

class SendMessageRequest(BaseModel):
    conversation_id: str
    message: str = Field(..., min_length=1, max_length=5000)

class SendMessageResponse(BaseModel):
    conversation_id: str
    interaction_id: str
    turn_number: int
    student_response: str
    is_complete: bool

class StudentInfo(BaseModel):
    id: str
    name: str
    gradelevel: int

# ========================================
# FastAPI App + CORS
# ========================================
app = FastAPI(title="Tutor Orchestrator API", version="0.2.2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:7860", "http://127.0.0.1:7860", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        r = await client.get("/", headers=sim_headers())
        print(f"✅ Connected to simulator: {r.status_code}")
    except Exception as e:
        print(f"❌ Simulator connection failed: {e}")
    yield
    await client.aclose()

app.router.lifespan_context = lifespan

# ========================================
# Students endpoints - both return normalized format
# ========================================
@app.get("/health")
async def health():
    return {"status": "healthy", "sim_api": SIM_API_BASE}

@app.get("/students", response_model=List[StudentInfo])
async def list_students(set_type: Optional[str] = "dev"):
    """GET /students?set_type=dev"""
    params = {"set_type": set_type} if set_type else {}
    r = await client.get("/students", params=params, headers=sim_headers())
    r.raise_for_status()
    data = r.json()
    students = data.get("students", [])
    return [
        StudentInfo(id=s["id"], name=s["name"], gradelevel=s["grade_level"])
        for s in students
    ]

@app.post("/students/list", response_model=List[StudentInfo])
async def list_students_post(set_type: SetType = SetType.DEV):
    """POST version - same output format"""
    r = await client.get("/students", params={"set_type": set_type}, headers=sim_headers())
    r.raise_for_status()
    students = r.json().get("students", [])
    return [
        StudentInfo(id=s["id"], name=s["name"], gradelevel=s["grade_level"])
        for s in students
    ]

# ========================================
# Helpers & Core Endpoints
# ========================================
async def choose_student_and_topic(set_type: str = "dev") -> tuple[str, str, dict, dict]:
    r = await client.get("/students", params={"set_type": set_type}, headers=sim_headers())
    r.raise_for_status()
    students = r.json().get("students", [])
    if not students:
        raise HTTPException(404, f"No students found for set_type={set_type}")
    
    student = students[0]
    student_id = student["id"]
    student_info = {"name": student["name"], "gradelevel": student["grade_level"]}
    
    r = await client.get(f"/students/{student_id}/topics", headers=sim_headers())
    r.raise_for_status()
    topics = r.json().get("topics", [])
    if not topics:
        raise HTTPException(404, f"No topics for student {student_id}")
    
    topic = topics[0]
    return student_id, topic["id"], student_info, {
        "name": topic["name"],
        "subjectname": topic.get("subjectname", "Unknown")
    }

@app.post("/start", response_model=LocalConversationInfo)
async def start_conversation(req: StartLocalConversationRequest):
    set_type = req.set_type.value if isinstance(req.set_type, SetType) else req.set_type
    
    if req.student_id is None or req.topic_id is None:
        student_id, topic_id, student_info, topic_info = await choose_student_and_topic(set_type)
    else:
        student_id = req.student_id
        topic_id = req.topic_id
        # Basic validation
        r = await client.get(f"/students/{student_id}/topics", headers=sim_headers())
        r.raise_for_status()
        valid_topic_ids = {t["id"] for t in r.json().get("topics", [])}
        if topic_id not in valid_topic_ids:
            raise HTTPException(400, f"Topic {topic_id} not valid for student {student_id}")
        
        # Get student info
        r_students = await client.get("/students", params={"set_type": set_type}, headers=sim_headers())
        student_info = next(
            ({"name": s["name"], "gradelevel": s["grade_level"]} 
             for s in r_students.json().get("students", []) if s["id"] == student_id),
            {"name": "Unknown", "gradelevel": 0}
        )
        # Get topic info
        topic_info = next(
            ({"name": t["name"], "subjectname": t.get("subjectname", "Unknown")}
             for t in r.json().get("topics", []) if t["id"] == topic_id),
            {"name": "Unknown", "subjectname": "Unknown"}
        )

    payload = {"studentid": student_id, "topicid": topic_id}
    r = await client.post("/interact/start", json=payload, headers=sim_headers())
    r.raise_for_status()
    data = r.json()
    
    return LocalConversationInfo(
        conversation_id=data["conversationid"],
        student_id=student_id,
        topic_id=topic_id,
        topic_name=topic_info["name"],
        student_name=student_info["name"],
        gradelevel=student_info["gradelevel"],
        max_turns=data["maxturns"]
    )

@app.post("/send", response_model=SendMessageResponse)
async def send_message(req: SendMessageRequest):
    payload = {"conversationid": req.conversation_id, "tutormessage": req.message}
    r = await client.post("/interact", json=payload, headers=sim_headers())
    
    if r.status_code == 404: raise HTTPException(404, "Conversation not found")
    if r.status_code == 403: raise HTTPException(403, "Wrong team API key")
    if r.status_code == 429: raise HTTPException(429, "Turn limit / rate limit exceeded")
    r.raise_for_status()
    
    data = r.json()
    return SendMessageResponse(
        conversation_id=data["conversationid"],
        interaction_id=data["interactionid"],
        turn_number=data["turnnumber"],
        student_response=data["studentresponse"],
        is_complete=data.get("iscomplete", False)
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)