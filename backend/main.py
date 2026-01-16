#!/usr/bin/env python3
"""
Minimal FastAPI wrapper for Knowunity Student Simulation API.
Handles student/topic discovery, conversation start, and message exchange.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import httpx
import os
import uvicorn
from typing import Optional
from enum import Enum

# ========================================
# CONFIGURATION (set your values)
# ========================================
SIM_API_BASE = os.environ.get("SIM_API_BASE", "https://api.knowunity-studentsim.com")  # Update with actual base URL
TEAM_API_KEY = os.environ["SIM_TEAM_API_KEY"]  # Required: your team's X-Api-Key
SET_TYPE_DEFAULT = "dev"  # minidev | dev | eval

# ========================================
# FastAPI App
# ========================================
app = FastAPI(
    title="Tutor Orchestrator",
    description="Minimal proxy for student simulation API",
    version="0.1.0"
)

# Shared HTTP client
client = httpx.AsyncClient(
    base_url=SIM_API_BASE,
    timeout=httpx.Timeout(10.0, read=30.0)
)

def sim_headers():
    """Headers for simulator API calls."""
    return {"X-Api-Key": TEAM_API_KEY}

# ========================================
# Pydantic Models (DTOs)
# ========================================
class SetType(str, Enum):
    MINIDEV = "minidev"
    DEV = "dev"
    EVAL = "eval"

class StartLocalConversationRequest(BaseModel):
    settype: Optional[SetType] = Field(default_factory=lambda: SetType(SET_TYPE_DEFAULT))
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
    conversations_remaining: Optional[int] = None

class SendMessageRequest(BaseModel):
    conversation_id: str
    message: str = Field(..., min_length=1, max_length=5000)

class SendMessageResponse(BaseModel):
    conversation_id: str
    interaction_id: str
    turn_number: int
    student_response: str
    is_complete: bool

class ListStudentsRequest(BaseModel):
    settype: Optional[SetType] = Field(default_factory=lambda: SetType(SET_TYPE_DEFAULT))

class StudentInfo(BaseModel):
    id: str
    name: str
    gradelevel: int

class ListTopicsRequest(BaseModel):
    student_id: str
    subject_id: Optional[str] = None

# ========================================
# Helper: Auto-discover first student+topic
# ========================================
async def choose_student_and_topic(settype: str) -> tuple[str, str, dict, dict]:
    """Get first available student and first topic for that student."""
    
    # GET /students?settype=...
    r = await client.get("/students", params={"settype": settype}, headers=sim_headers())
    r.raise_for_status()
    data = r.json()
    students = data.get("students", [])
    if not students:
        raise HTTPException(404, f"No students available for settype={settype}")
    
    student = students[0]
    student_id = student["id"]
    student_info = {"name": student["name"], "gradelevel": student["gradelevel"]}
    
    # GET /students/{studentid}/topics
    r = await client.get(f"/students/{student_id}/topics", headers=sim_headers())
    r.raise_for_status()
    data = r.json()
    topics = data.get("topics", [])
    if not topics:
        raise HTTPException(404, f"No topics available for student {student_id}")
    
    topic = topics[0]
    topic_id = topic["id"]
    topic_info = {
        "name": topic["name"],
        "subjectname": topic["subjectname"]
    }
    
    return student_id, topic_id, student_info, topic_info

# ========================================
# API Endpoints
# ========================================

@app.get("/health")
async def health():
    """Health check."""
    return {"status": "healthy", "api_base": SIM_API_BASE}

@app.post("/students/list", response_model=list[StudentInfo])
async def list_students(req: ListStudentsRequest):
    """List available students for a settype."""
    r = await client.get("/students", params={"settype": req.settype}, headers=sim_headers())
    r.raise_for_status()
    data = r.json()
    return [
        StudentInfo(id=s["id"], name=s["name"], gradelevel=s["gradelevel"])
        for s in data.get("students", [])
    ]

@app.post("/start", response_model=LocalConversationInfo)
async def start_conversation(req: StartLocalConversationRequest):
    """Start a new conversation. Auto-picks first student/topic if none specified."""
    
    student_id = req.student_id
    topic_id = req.topic_id
    
    if student_id is None or topic_id is None:
        student_id, topic_id, student_info, topic_info = await choose_student_and_topic(req.settype)
    else:
        # Validate student has this topic (minimal check)
        r = await client.get(f"/students/{student_id}/topics", headers=sim_headers())
        r.raise_for_status()
        topics = [t["id"] for t in r.json().get("topics", [])]
        if topic_id not in topics:
            raise HTTPException(400, f"Topic {topic_id} not available for student {student_id}")
        # Fetch names for response
        r_student = await client.get(f"/students/{student_id}", headers=sim_headers())
        r_student.raise_for_status()
        student_info = r_student.json()["students"][0] if r_student.json().get("students") else {"name": "Unknown", "gradelevel": 0}
        r_topic = await client.get("/topics", headers=sim_headers())
        r_topic.raise_for_status()
        topic_info = next((t for t in r_topic.json().get("topics", []) if t["id"] == topic_id), {"name": "Unknown", "subjectname": "Unknown"})
    
    # POST /interact/start
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
        max_turns=data["maxturns"],
        conversations_remaining=data.get("conversationsremaining")
    )

@app.post("/send", response_model=SendMessageResponse)
async def send_message(req: SendMessageRequest):
    """Send a tutor message and get student response."""
    
    payload = {
        "conversationid": req.conversation_id,
        "tutormessage": req.message
    }
    
    # POST /interact
    r = await client.post("/interact", json=payload, headers=sim_headers())
    if r.status_code == 404:
        raise HTTPException(404, "Conversation not found")
    if r.status_code == 403:
        raise HTTPException(403, "Conversation does not belong to this team")
    if r.status_code == 429:
        raise HTTPException(429, "Turn limit exceeded")
    r.raise_for_status()
    
    data = r.json()
    return SendMessageResponse(
        conversation_id=data["conversationid"],
        interaction_id=data["interactionid"],
        turn_number=data["turnnumber"],
        student_response=data["studentresponse"],
        is_complete=data.get("iscomplete", False)
    )

# ========================================
# Convenience endpoint: Auto-chat (3 turns)
# ========================================
@app.post("/quick-chat")
async def quick_chat(req: StartLocalConversationRequest):
    """Quick demo: start conversation + 3 diagnostic turns."""
    
    # Start
    conv = await start_conversation(req)
    
    conversation_history = []
    
    # 3 diagnostic turns
    for turn in range(1, 4):
        message = f"Hello! Let's practice [topic]. Solve this: 2x + 3 = 7. Show your steps."
        if turn > 1:
            message = f"Good try. Now try a variation: 3x - 2 = 10. Explain why you chose that step."
        
        resp = await send_message(SendMessageRequest(
            conversation_id=conv.conversation_id,
            message=message
        ))
        
        conversation_history.append({
            "turn": resp.turn_number,
            "tutor": message[:100] + "..." if len(message) > 100 else message,
            "student": resp.student_response[:100] + "..."
        })
        
        if resp.is_complete:
            break
    
    return {
        "conversation": conv,
        "history": conversation_history,
        "status": "complete" if conv.max_turns <= 3 else "partial"
    }

# ========================================
# Startup/shutdown
# ========================================
@app.on_event("startup")
async def startup():
    # Test API connectivity
    try:
        r = await client.get("/", headers=sim_headers())
        print(f"✅ Connected to simulator API: {r.status_code}")
    except Exception as e:
        print(f"❌ Failed to connect to simulator API: {e}")

@app.on_event("shutdown")
async def shutdown():
    await client.aclose()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        reload=True
    )
