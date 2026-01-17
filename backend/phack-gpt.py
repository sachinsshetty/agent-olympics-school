from fastapi import FastAPI, HTTPException, Request, Query, BackgroundTasks
from pydantic import BaseModel
import requests
import os
import json
import asyncio
from typing import List, Optional
from openai import AsyncOpenAI

app = FastAPI(title="AI Tutor Challenge - GPT-5 Nano MSE Simulator")

# --- API Configuration ---
API_BASE = "https://knowunity-agent-olympics-2026-api.vercel.app"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TUTOR_API_KEY = os.getenv("TUTOR_API_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY environment variable is required.")

HEADERS = {"X-Api-Key": TUTOR_API_KEY, "Content-Type": "application/json", "accept": "application/json"}

# --- OpenAI Configuration (GPT-5 Nano) ---
# Direct initialization without custom base_url
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# Global storage for simulation results
simulation_storage = {}

# --- Prompts ---
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

# --- Core Interaction Logic ---
async def perform_interaction(conv_id, tutor_msg, topic_name, history):
    """Internal logic using GPT-5 Nano for tutoring and LLM analysis."""
    # 1. Forward to Knowunity API
    resp = requests.post(
        f"{API_BASE}/interact", 
        json={"conversation_id": conv_id, "tutor_message": tutor_msg}, 
        headers=HEADERS
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    
    student_data = resp.json()
    student_reply = student_data.get("student_response", "")

    # 2. Build Transcript
    history_text = "\n".join([f"{'Tutor' if m.get('role') == 'user' else 'Student'}: {m.get('content')}" for m in history])
    history_text += f"\nTutor: {tutor_msg}\nStudent: {student_reply}"

    # 3. LLM Analysis (GPT-5 Nano)
    try:
        a_prompt = ANALYSIS_PROMPT.format(history_text=history_text, topic_name=topic_name)
        a_res = await openai_client.chat.completions.create(
            model="gpt-5-nano", 
            messages=[{"role": "user", "content": a_prompt}],
            response_format={"type": "json_object"}
        )
        analysis = json.loads(a_res.choices[0].message.content)
    except Exception as e:
        analysis = {"understanding_level": 3, "justification": f"Analysis error: {str(e)}"}

    # 4. LLM Suggestion (GPT-5 Nano)
    try:
        level = analysis.get("understanding_level", 3)
        s_prompt = TUTORING_PROMPT.format(level=level, topic_name=topic_name, last_response=student_reply)
        s_res = await openai_client.chat.completions.create(
            model="gpt-5-nano", 
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

# --- Background Task & Simulation ---
async def run_simulation(set_type: str, pairs: List[dict]):
    simulation_storage[set_type] = {"status": "in_progress", "data": []}
    
    for pair in pairs:
        history = []
        topic_name = pair["topic_name"]
        current_tutor_msg = f"Hello! Today we are going to learn about {topic_name}. What do you already know about it?"
        
        final_state = {}
        for turn in range(pair.get("max_turns", 5)):
            result = await perform_interaction(
                pair["conversation_id"],
                current_tutor_msg,
                topic_name,
                history
            )
            
            history.append({"role": "user", "content": current_tutor_msg})
            history.append({"role": "assistant", "content": result["student_response"]})
            current_tutor_msg = result["suggestion"]["suggested_response"]
            final_state = result["analysis"]

            if result.get("is_complete"):
                break
        
        simulation_storage[set_type]["data"].append({
            "student_id": pair["student_id"],
            "topic_id": pair["topic_id"],
            "inferred_level": final_state.get("understanding_level"),
            "justification": final_state.get("justification")
        })
    
    simulation_storage[set_type]["status"] = "completed"

# --- Endpoints ---
@app.get("/students")
def list_students(set_type: str = Query("mini_dev")):
    return requests.get(f"{API_BASE}/students", params={"set_type": set_type}, headers=HEADERS).json()

@app.get("/students/{student_id}/topics")
def get_student_topics(student_id: str):
    return requests.get(f"{API_BASE}/students/{student_id}/topics", headers=HEADERS).json()

@app.post("/conversations/start")
def start_conversation(req: StartRequest):
    return requests.post(f"{API_BASE}/interact/start", json=req.model_dump(), headers=HEADERS).json()

@app.post("/conversations/interact")
async def interact(request: Request):
    data = await request.json()
    return await perform_interaction(
        data.get("conversation_id"),
        data.get("tutor_message"),
        data.get("topic_name", "Topic"),
        data.get("history", [])
    )

@app.post("/generate_mse")
async def generate_mse(background_tasks: BackgroundTasks, set_type: str = Query("mini_dev")):
    s_resp = requests.get(f"{API_BASE}/students", params={"set_type": set_type}, headers=HEADERS)
    students = s_resp.json().get("students", [])
    
    all_pairs = []
    for s in students:
        t_resp = requests.get(f"{API_BASE}/students/{s['id']}/topics", headers=HEADERS)
        topics = t_resp.json().get("topics", [])
        
        for t in topics:
            start_req = StartRequest(student_id=s['id'], topic_id=t['id'])
            conv_data = start_conversation(start_req)
            
            all_pairs.append({
                "student_id": s['id'],
                "topic_id": t['id'],
                "topic_name": t['name'],
                "conversation_id": conv_data.get("conversation_id"),
                "max_turns": conv_data.get("max_turns")
            })
    
    background_tasks.add_task(run_simulation, set_type, all_pairs)
    return {"message": "Simulation started with GPT-5 Nano", "pair_count": len(all_pairs)}

@app.get("/simulation_results")
def get_results(set_type: str = Query("mini_dev")):
    return simulation_storage.get(set_type, {"status": "not_found"})

@app.post("/evaluate/mse")
def submit_mse(req: dict):
    return requests.post(f"{API_BASE}/evaluate/mse", json=req, headers=HEADERS).json()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
