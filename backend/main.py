# server.py
# Run with: export TUTOR_API_KEY=your_key; uvicorn server:app --reload --port 8000

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
import requests
import os
from typing import List, Optional

app = FastAPI(title="Knowunity Tutor Backend")

API_BASE = "https://knowunity-agent-olympics-2026-api.vercel.app"
# Ensure you set this environment variable
API_KEY = os.getenv("TUTOR_API_KEY", "your_api_key_here") 
HEADERS = {"X-Api-Key": API_KEY}

class StartRequest(BaseModel):
    student_id: str
    topic_id: str

class MessageRequest(BaseModel):
    tutor_message: str

@app.get("/students")
def list_students(set_type: str = Query("mini_dev")):
    """Proxies student list. Supports set_type=mini_dev, dev, eval."""
    # Note: Challenge API uses 'settype' as the query param internally
    resp = requests.get(f"{API_BASE}/students", params={"settype": set_type}, headers=HEADERS)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()

@app.get("/students/{student_id}/topics")
def get_student_topics(student_id: str):
    """Fetches topics specifically available for a student."""
    resp = requests.get(f"{API_BASE}/students/{student_id}/topics", headers=HEADERS)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()

@app.post("/conversations/start")
def start_conversation(req: StartRequest):
    """Starts a new tutoring session."""
    payload = {"studentid": req.student_id, "topicid": req.topic_id}
    resp = requests.post(f"{API_BASE}/interact/start", json=payload, headers=HEADERS)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()

@app.post("/conversations/{conv_id}/send")
def send_message(conv_id: str, req: MessageRequest):
    """Sends a message and receives the student's simulated response."""
    payload = {"conversationid": conv_id, "tutormessage": req.tutor_message}
    resp = requests.post(f"{API_BASE}/interact", json=payload, headers=HEADERS)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
