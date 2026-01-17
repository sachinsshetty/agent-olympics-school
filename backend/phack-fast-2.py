from fastapi import FastAPI, HTTPException, Request, Query, BackgroundTasks
from pydantic import BaseModel, Field
import requests
import os
import json
import asyncio
from typing import List, Optional
from openai import AsyncOpenAI

app = FastAPI(title="AI Tutor Challenge - High Accuracy GPT-5 Nano")

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

# --- OpenAI Configuration ---
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# --- Concurrency & Storage ---
MAX_CONCURRENT_SESSIONS = 10
semaphore = asyncio.Semaphore(MAX_CONCURRENT_SESSIONS)
simulation_storage = {}

# --- Prompts for High Accuracy ---
ANALYSIS_PROMPT = """You are a Master Pedagogical Evaluator. Analyze the transcript to determine the student's mastery level.

RUBRIC:
1 - Struggling: Major misconceptions; cannot perform basic steps.
2 - Below Grade: Some conceptual knowledge but frequent execution errors.
3 - At Grade: Understands core concepts; consistent performance on standard tasks.
4 - Above Grade: Solid grasp; identifies edge cases; minimal guidance needed.
5 - Advanced: Deep conceptual mastery; can teach/explain the 'why' behind the logic.

Topic: {topic_name}
History:
{history_text}

TASK:
1. Analyze student errors, vocabulary, and speed of grasp.
2. Select the level (1-5) based on the RUBRIC.

Return ONLY JSON:
{{
  "thinking_process": "detailed analysis",
  "understanding_level": int,
  "justification": "short summary",
  "evidence": ["quote 1", "quote 2"]
}}
"""

TUTORING_PROMPT = """You are an expert K12 pedagogical advisor. 
Student Level: {level}/5
Topic: {topic_name}
Last Response: "{last_response}"

STRATEGY:
- If level < 3: Scaffolding, simpler examples, check fundamentals.
- If level >= 3: Socratic questioning, challenge assumptions.

Return ONLY JSON:
{{
  "suggested_response": "natural tutor message",
  "strategy_note": "pedagogical reasoning"
}}
"""

class StartRequest(BaseModel):
    student_id: str
    topic_id: str

class AnalysisResponse(BaseModel):
    thinking_process: str
    understanding_level: int = Field(ge=1, le=5)
    justification: str
    evidence: List[str]

# --- Core Logic ---
async def perform_interaction(conv_id, tutor_msg, topic_name, history):
    """Executes one interaction turn and performs LLM analysis."""
    resp = requests.post(f"{API_BASE}/interact", json={"conversation_id": conv_id, "tutor_message": tutor_msg}, headers=HEADERS)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    
    student_data = resp.json()
    student_reply = student_data.get("student_response", "")
    history_text = "\n".join([f"{'Tutor' if m.get('role') == 'user' else 'Student'}: {m.get('content')}" for m in history])
    history_text += f"\nTutor: {tutor_msg}\nStudent: {student_reply}"

    # 1. Deterministic Analysis (Temp 0)
    try:
        a_res = await openai_client.chat.completions.create(
            model="gpt-5-nano",
            messages=[{"role": "user", "content": ANALYSIS_PROMPT.format(history_text=history_text, topic_name=topic_name)}],
            response_format={"type": "json_object"},
            temperature=0
        )
        analysis = json.loads(a_res.choices[0].message.content)
    except Exception:
        analysis = {"understanding_level": 3, "justification": "Defaulting due to LLM error"}

    # 2. Tutoring Suggestion (Temp 0.7)
    try:
        s_res = await openai_client.chat.completions.create(
            model="gpt-5-nano",
            messages=[{"role": "user", "content": TUTORING_PROMPT.format(level=analysis.get("understanding_level", 3), topic_name=topic_name, last_response=student_reply)}],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        suggestion = json.loads(s_res.choices[0].message.content)
    except Exception:
        suggestion = {"suggested_response": "Can you explain your thinking further?"}

    return {"student_response": student_reply, "is_complete": student_data.get("is_complete"), "analysis": analysis, "suggestion": suggestion}

# --- Background Task logic ---
async def simulate_single_pair(pair: dict, set_type: str):
    async with semaphore:
        history = []
        topic_name = pair["topic_name"]
        current_tutor_msg = f"Hi! Let's talk about {topic_name}. What do you know about it?"
        
        final_analysis = {}
        for turn in range(pair.get("max_turns", 5)):
            result = await perform_interaction(pair["conversation_id"], current_tutor_msg, topic_name, history)
            history.append({"role": "user", "content": current_tutor_msg})
            history.append({"role": "assistant", "content": result["student_response"]})
            current_tutor_msg = result["suggestion"]["suggested_response"]
            final_analysis = result["analysis"]
            if result.get("is_complete"):
                break
        
        simulation_storage[set_type]["data"].append({
            "student_id": pair["student_id"], "topic_id": pair["topic_id"],
            "inferred_level": final_analysis.get("understanding_level", 3)
        })

async def run_simulation_task(set_type: str, pairs: List[dict]):
    await asyncio.gather(*[simulate_single_pair(p, set_type) for p in pairs])
    simulation_storage[set_type]["status"] = "completed"

# --- Endpoints ---
@app.post("/generate_mse")
async def generate_mse(background_tasks: BackgroundTasks, set_type: str = Query("mini_dev")):
    s_resp = requests.get(f"{API_BASE}/students", params={"set_type": set_type}, headers=HEADERS).json()
    all_pairs = []
    for s in s_resp.get("students", []):
        t_resp = requests.get(f"{API_BASE}/students/{s['id']}/topics", headers=HEADERS).json()
        for t in t_resp.get("topics", []):
            conv_data = requests.post(f"{API_BASE}/interact/start", json={"student_id": s['id'], "topic_id": t['id']}, headers=HEADERS).json()
            all_pairs.append({
                "student_id": s['id'], "topic_id": t['id'], "topic_name": t['name'],
                "conversation_id": conv_data.get("conversation_id"), "max_turns": conv_data.get("max_turns")
            })
    
    simulation_storage[set_type] = {"status": "in_progress", "total_expected": len(all_pairs), "data": []}
    background_tasks.add_task(run_simulation_task, set_type, all_pairs)
    return {"message": "Simulation started", "total_pairs": len(all_pairs)}

@app.get("/simulation_status")
def get_status(set_type: str = Query("mini_dev")):
    sim = simulation_storage.get(set_type, {"status": "not_started"})
    completed = len(sim.get("data", [])) if "data" in sim else 0
    total = sim.get("total_expected", 1)
    return {"status": sim.get("status"), "progress_pct": round((completed/total)*100, 2), "completed": completed, "total": total}

@app.post("/submit_simulation")
async def submit_simulation(set_type: str = Query("mini_dev")):
    sim = simulation_storage.get(set_type)
    if not sim or sim["status"] != "completed":
        raise HTTPException(status_code=400, detail="Simulation not complete")
    
    predictions = [{"student_id": e["student_id"], "topic_id": e["topic_id"], "predicted_level": e["inferred_level"]} for e in sim["data"]]
    mse_res = requests.post(f"{API_BASE}/evaluate/mse", json={"predictions": predictions, "set_type": set_type}, headers=HEADERS).json()
    tut_res = requests.post(f"{API_BASE}/evaluate/tutoring", json={"set_type": set_type}, headers=HEADERS).json()
    return {"mse": mse_res, "tutoring": tut_res}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
