# server.py
# Run with: export TUTOR_API_KEY=your_key; uvicorn server:app --reload --port 8000

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
import requests
import os
from typing import List

app = FastAPI(title="Tutor Challenge Proxy")

API_BASE = "https://knowunity-agent-olympics-2026-api.vercel.app"
API_KEY = os.getenv("TUTOR_API_KEY") 
HEADERS = {
    "X-Api-Key": API_KEY,
    "Content-Type": "application/json",
    "accept": "application/json"
}

# Request Models
class StartRequest(BaseModel):
    student_id: str
    topic_id: str

class InteractRequest(BaseModel):
    conversation_id: str
    tutor_message: str

class Prediction(BaseModel):
    student_id: str
    topic_id: str
    predicted_level: float

class MSERequest(BaseModel):
    predictions: List[Prediction]
    set_type: str = "mini_dev"

@app.get("/students")
def list_students(set_type: str = Query("mini_dev")):
    """GET students?set_type=mini_dev"""
    resp = requests.get(f"{API_BASE}/students", params={"set_type": set_type}, headers=HEADERS)
    resp.raise_for_status()
    return resp.json()

@app.get("/students/{student_id}/topics")
def get_student_topics(student_id: str):
    """GET topics for a specific student"""
    resp = requests.get(f"{API_BASE}/students/{student_id}/topics", headers=HEADERS)
    resp.raise_for_status()
    return resp.json()

@app.post("/conversations/start")
def start_conversation(req: StartRequest):
    """POST /interact/start"""
    payload = {"student_id": req.student_id, "topic_id": req.topic_id}
    resp = requests.post(f"{API_BASE}/interact/start", json=payload, headers=HEADERS)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()

@app.post("/conversations/interact")
def interact(req: InteractRequest):
    """POST /interact"""
    payload = {"conversation_id": req.conversation_id, "tutor_message": req.tutor_message}
    resp = requests.post(f"{API_BASE}/interact", json=payload, headers=HEADERS)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()

@app.post("/evaluate/mse")
def submit_mse(req: MSERequest):
    """POST /evaluate/mse"""
    resp = requests.post(f"{API_BASE}/evaluate/mse", json=req.dict(), headers=HEADERS)
    return resp.json()

@app.post("/evaluate/tutoring")
def evaluate_tutoring(set_type: str = "mini_dev"):
    """POST /evaluate/tutoring"""
    resp = requests.post(f"{API_BASE}/evaluate/tutoring", json={"set_type": set_type}, headers=HEADERS)
    return resp.json()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
