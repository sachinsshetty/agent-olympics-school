from fastapi import FastAPI, HTTPException, Request, Query, BackgroundTasks
from pydantic import BaseModel
import requests
import os
import json
import asyncio
from typing import List, Optional
from openai import AsyncOpenAI

app = FastAPI(title="AI Tutor Challenge - GPT-5 Nano Async Simulator")

# --- API Configuration ---
API_BASE = "https://knowunity-agent-olympics-2026-api.vercel.app"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TUTOR_API_KEY = os.getenv("TUTOR_API_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY environment variable is required.")

HEADERS = {
    "X-Api-Key": TUTOR_API_KEY, 
    "Content-Type": "application/json", 
    "accept": "application/json"
}

# --- OpenAI Configuration (GPT-5 Nano) ---
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# --- Concurrency Configuration ---
MAX_CONCURRENT_SESSIONS = 10
semaphore = asyncio.Semaphore(MAX_CONCURRENT_SESSIONS)

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
    """Handles a single interaction turn and LLM analysis using GPT-5 Nano."""
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

    # 3. LLM Analysis
    try:
        a_prompt = ANALYSIS_PROMPT.format(history_text=history_text, topic_name=topic_name)
        a_res = await openai_client.chat.completions.create(
            model="gpt-5.2-2025-12-11", 
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
            model="gpt-5.2-2025-12-11", 
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

# --- Async Simulation Logic ---
async def simulate_single_pair(pair: dict, set_type: str):
    """Simulates a full session for one pair concurrently."""
    async with semaphore:
        history = []
        topic_name = pair["topic_name"]
        current_tutor_msg = f"Hi! Let's explore {topic_name}. What do you know about it?"
        
        final_state = {}
        for turn in range(pair.get("max_turns", 5)):
            result = await perform_interaction(
                pair["conversation_id"], current_tutor_msg, topic_name, history
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
            "inferred_level": final_state.get("understanding_level", 3),
            "justification": final_state.get("justification", "No justification provided")
        })

async def run_simulation_task(set_type: str, pairs: List[dict]):
    """Triggers all pair simulations in parallel."""
    simulation_storage[set_type] = {"status": "in_progress", "data": []}
    tasks = [simulate_single_pair(pair, set_type) for pair in pairs]
    await asyncio.gather(*tasks)
    simulation_storage[set_type]["status"] = "completed"

# --- Endpoints ---
@app.get("/students")
def list_students(set_type: str = Query("mini_dev")):
    return requests.get(f"{API_BASE}/students", params={"set_type": set_type}, headers=HEADERS).json()

@app.post("/conversations/start")
def start_conversation(req: StartRequest):
    return requests.post(f"{API_BASE}/interact/start", json=req.model_dump(), headers=HEADERS).json()

@app.post("/conversations/interact")
async def interact(request: Request):
    data = await request.json()
    return await perform_interaction(
        data.get("conversation_id"), data.get("tutor_message"),
        data.get("topic_name", "Topic"), data.get("history", [])
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
            conv_data = start_conversation(StartRequest(student_id=s['id'], topic_id=t['id']))
            all_pairs.append({
                "student_id": s['id'], "topic_id": t['id'], "topic_name": t['name'],
                "conversation_id": conv_data.get("conversation_id"), "max_turns": conv_data.get("max_turns")
            })
    
    background_tasks.add_task(run_simulation_task, set_type, all_pairs)
    return {"message": "Async simulation started", "pair_count": len(all_pairs)}

@app.get("/simulation_results")
def get_results(set_type: str = Query("mini_dev")):
    return simulation_storage.get(set_type, {"status": "not_found"})

@app.post("/submit_simulation")
async def submit_simulation(set_type: str = Query("mini_dev")):
    simulation = simulation_storage.get(set_type)
    if not simulation or simulation.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Simulation not ready.")

    predictions = [{"student_id": e["student_id"], "topic_id": e["topic_id"], "predicted_level": e["inferred_level"]} 
                   for e in simulation["data"]]
    
    mse_resp = requests.post(f"{API_BASE}/evaluate/mse", json={"predictions": predictions, "set_type": set_type}, headers=HEADERS)
    if mse_resp.status_code != 200:
        return {"error": "MSE Failed", "details": mse_resp.text}

    tut_resp = requests.post(f"{API_BASE}/evaluate/tutoring", json={"set_type": set_type}, headers=HEADERS)
    return {"mse": mse_resp.json(), "tutoring": tut_resp.json() if tut_resp.status_code == 200 else tut_resp.text}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)
