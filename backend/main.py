# server.py
from fastapi import FastAPI, HTTPException, Request, Query
from pydantic import BaseModel
import requests
import os
import json
from typing import List, Optional
from openai import AsyncOpenAI

app = FastAPI(title="AI Tutor Challenge")

# API Configuration
API_BASE = "https://knowunity-agent-olympics-2026-api.vercel.app"
API_KEY = os.getenv("TUTOR_API_KEY")
HEADERS = {"X-Api-Key": API_KEY, "Content-Type": "application/json", "accept": "application/json"}

# OpenAI / Dwani Configuration
DWANI_API_BASE_URL = os.getenv("DWANI_API_BASE_URL")
if not DWANI_API_BASE_URL:
    raise RuntimeError("DWANI_API_BASE_URL environment variable is required.")
openai_client = AsyncOpenAI(api_key="http", base_url=DWANI_API_BASE_URL)

# HIGH ACCURACY PROMPTS - Escaped with {{ }} for .format() compatibility
ANALYSIS_PROMPT = """You are an expert K12 tutor coach. Your task is to analyze a full tutoring conversation and infer the student's understanding level (1-5).
1 - Struggling: needs fundamentals; major misconceptions.
2 - Below grade: frequent mistakes; partial understanding.
3 - At grade: core concepts mostly correct.
4 - Above grade: generally solid; occasional mistakes.
5 - Advanced: deep, robust understanding; explains reasoning clearly.

History:
{history_text}

Topic: {topic_name}

Return ONLY JSON:
{{
  "understanding_level": int,
  "justification": "str",
  "evidence": []
}}
"""

TUTORING_PROMPT = """You are an expert K12 pedagogical advisor. Suggest the next tutoring step.
Level: {level}
Topic: {topic_name}
Last Student Response: "{last_response}"

Return ONLY JSON:
{{
  "suggested_response": "str",
  "strategy_note": "str"
}}
"""

class StartRequest(BaseModel):
    student_id: str
    topic_id: str

@app.get("/students")
def list_students(set_type: str = Query("mini_dev")):
    return requests.get(f"{API_BASE}/students", params={"set_type": set_type}, headers=HEADERS).json()

@app.get("/students/{student_id}/topics")
def get_student_topics(student_id: str):
    return requests.get(f"{API_BASE}/students/{student_id}/topics", headers=HEADERS).json()

@app.post("/conversations/start")
def start_conversation(req: StartRequest):
    # UPDATED: Use model_dump() instead of dict() for Pydantic V2 compatibility
    return requests.post(f"{API_BASE}/interact/start", json=req.model_dump(), headers=HEADERS).json()

@app.post("/conversations/interact")
async def interact(request: Request):
    """Bypasses strict Pydantic validation for the history state."""
    data = await request.json()
    conv_id = data.get("conversation_id")
    tutor_msg = data.get("tutor_message")
    topic_name = data.get("topic_name", "Topic")
    history = data.get("history", [])
    
    # 1. Forward to Knowunity API
    resp = requests.post(f"{API_BASE}/interact", json={"conversation_id": conv_id, "tutor_message": tutor_msg}, headers=HEADERS)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    
    student_data = resp.json()
    student_reply = student_data.get("student_response", "")

    # 2. Build Transcript for LLM
    history_text = "\n".join([f"{'Tutor' if m.get('role') == 'user' else 'Student'}: {m.get('content')}" for m in history])
    history_text += f"\nTutor: {tutor_msg}\nStudent: {student_reply}"

    # 3. LLM Analysis
    try:
        a_prompt = ANALYSIS_PROMPT.format(history_text=history_text, topic_name=topic_name)
        a_res = await openai_client.chat.completions.create(
            model="gemma3", 
            messages=[{"role": "user", "content": a_prompt}],
            response_format={"type": "json_object"}
        )
        analysis = json.loads(a_res.choices[0].message.content)
    except Exception as e:
        analysis = {"understanding_level": 3, "justification": f"Analysis error: {str(e)}"}

    # 4. LLM Suggestion
    try:
        level = analysis.get("understanding_level", 3)
        s_prompt = TUTORING_PROMPT.format(level=level, topic_name=topic_name, last_response=student_reply)
        s_res = await openai_client.chat.completions.create(
            model="gemma3", 
            messages=[{"role": "user", "content": s_prompt}],
            response_format={"type": "json_object"}
        )
        suggestion = json.loads(s_res.choices[0].message.content)
    except Exception as e:
        suggestion = {"suggested_response": "What are your thoughts on this?"}

    return {
        "student_response": student_reply, 
        "turn_number": student_data.get("turn_number"), 
        "is_complete": student_data.get("is_complete"), 
        "analysis": analysis, 
        "suggestion": suggestion
    }

@app.post("/evaluate/mse")
def submit_mse(req: dict):
    return requests.post(f"{API_BASE}/evaluate/mse", json=req, headers=HEADERS).json()

@app.post("/evaluate/tutoring")
def evaluate_tutoring(set_type: str = "mini_dev"):
    return requests.post(f"{API_BASE}/evaluate/tutoring", json={"set_type": set_type}, headers=HEADERS).json()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
