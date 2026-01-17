# server.py
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
import requests
import os
import json
from typing import List, Optional
from openai import AsyncOpenAI

app = FastAPI(title="Tutor Challenge Proxy with Analysis")

# Knowunity API Config
API_BASE = "https://knowunity-agent-olympics-2026-api.vercel.app"
API_KEY = os.getenv("TUTOR_API_KEY")
HEADERS = {
    "X-Api-Key": API_KEY,
    "Content-Type": "application/json",
    "accept": "application/json"
}

# OpenAI / Dwani Config
DWANI_API_BASE_URL = os.getenv("DWANI_API_BASE_URL")
if not DWANI_API_BASE_URL:
    raise RuntimeError("DWANI_API_BASE_URL environment variable is required.")
openai_client = AsyncOpenAI(api_key="http", base_url=DWANI_API_BASE_URL)

ANALYSIS_PROMPT_TEMPLATE = """
Analyze this K12 tutoring conversation and infer the student's understanding level (1-5).
1: Struggling, 2: Below grade, 3: At grade, 4: Above grade, 5: Advanced.

Conversation History:
{history_text}

Topic: {topic_name}

Return ONLY a JSON object:
{{
  "understanding_level": int,
  "justification": "short explanation",
  "evidence": ["quote 1", "quote 2"]
}}
"""

# Models
class StartRequest(BaseModel):
    student_id: str
    topic_id: str

class ChatMessage(BaseModel):
    role: str
    content: str

class InteractRequest(BaseModel):
    conversation_id: str
    tutor_message: str
    topic_name: Optional[str] = "Generic Topic"
    history: List[ChatMessage] = []

class Prediction(BaseModel):
    student_id: str
    topic_id: str
    predicted_level: float

class MSERequest(BaseModel):
    predictions: List[Prediction]
    set_type: str = "mini_dev"

async def analyze_understanding(history: List[ChatMessage], topic_name: str):
    if not history:
        return 3, "No interaction yet.", []
    try:
        history_text = "\n".join([f"{'Tutor' if m.role == 'user' else 'Student'}: {m.content}" for m in history])
        prompt = ANALYSIS_PROMPT_TEMPLATE.format(history_text=history_text, topic_name=topic_name)
        response = await openai_client.chat.completions.create(
            model="gemma3",
            messages=[{"role": "system", "content": "You are an expert K12 pedagogy analyzer."},
                      {"role": "user", "content": prompt}],
            response_format={ "type": "json_object" }
        )
        analysis = json.loads(response.choices[0].message.content)
        return analysis.get("understanding_level", 3), analysis.get("justification", "Analysis complete."), analysis.get("evidence", [])
    except Exception as e:
        return 3, f"Analysis Error: {str(e)}", []

@app.get("/students")
def list_students(set_type: str = Query("mini_dev")):
    resp = requests.get(f"{API_BASE}/students", params={"set_type": set_type}, headers=HEADERS)
    resp.raise_for_status()
    return resp.json()

@app.get("/students/{student_id}/topics")
def get_student_topics(student_id: str):
    resp = requests.get(f"{API_BASE}/students/{student_id}/topics", headers=HEADERS)
    resp.raise_for_status()
    return resp.json()

@app.post("/conversations/start")
def start_conversation(req: StartRequest):
    payload = {"student_id": req.student_id, "topic_id": req.topic_id}
    resp = requests.post(f"{API_BASE}/interact/start", json=payload, headers=HEADERS)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()

@app.post("/conversations/interact")
async def interact(req: InteractRequest):
    # 1. Forward interaction to Student API
    payload = {"conversation_id": req.conversation_id, "tutor_message": req.tutor_message}
    resp = requests.post(f"{API_BASE}/interact", json=payload, headers=HEADERS)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    
    student_data = resp.json()
    
    # 2. Build history for analysis
    full_history = req.history + [
        ChatMessage(role="user", content=req.tutor_message),
        ChatMessage(role="assistant", content=student_data.get("student_response", ""))
    ]
    
    # 3. Perform Pedagogical Analysis
    level, justification, evidence = await analyze_understanding(full_history, req.topic_name)
    
    return {
        "student_response": student_data.get("student_response"),
        "turn_number": student_data.get("turn_number"),
        "is_complete": student_data.get("is_complete"),
        "analysis": {
            "understanding_level": level,
            "justification": justification,
            "evidence": evidence
        }
    }

@app.post("/evaluate/mse")
def submit_mse(req: MSERequest):
    resp = requests.post(f"{API_BASE}/evaluate/mse", json=req.dict(), headers=HEADERS)
    return resp.json()

@app.post("/evaluate/tutoring")
def evaluate_tutoring(set_type: str = "mini_dev"):
    resp = requests.post(f"{API_BASE}/evaluate/tutoring", json={"set_type": set_type}, headers=HEADERS)
    return resp.json()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
