# server.py
# Run with: export TUTOR_API_KEY=sk_team_...; uvicorn server:app --reload --port 8000

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
import requests
import os

app = FastAPI(title="Verified Tutor Backend")

API_BASE = "https://knowunity-agent-olympics-2026-api.vercel.app"
API_KEY = os.getenv("TUTOR_API_KEY") 
HEADERS = {"X-Api-Key": API_KEY, "Content-Type": "application/json"}

class StartRequest(BaseModel):
    student_id: str
    topic_id: str

class MessageRequest(BaseModel):
    tutor_message: str

@app.get("/students")
def list_students(set_type: str = Query("mini_dev")):
    # Public endpoint uses set_type or settype depending on environment; 
    # matching your working curl's 'set_type'
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
    # Payload verified by your successful POST [attached_file:1]
    payload = {"student_id": req.student_id, "topic_id": req.topic_id}
    resp = requests.post(f"{API_BASE}/interact/start", json=payload, headers=HEADERS)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()

@app.post("/conversations/{conv_id}/send")
def send_message(conv_id: str, req: MessageRequest):
    # Aligning with underscored format for consistency
    payload = {"conversation_id": conv_id, "tutor_message": req.tutor_message}
    resp = requests.post(f"{API_BASE}/interact", json=payload, headers=HEADERS)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
