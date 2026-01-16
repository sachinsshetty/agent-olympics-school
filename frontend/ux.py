#!/usr/bin/env python3
"""
Gradio UI for Tutor Orchestrator - Student Simulation API
"""

import gradio as gr
import requests
import json
from typing import List, Dict, Any
import os

# ========================================
# CONFIGURATION - Update these!
# ========================================
SIM_API_BASE = os.environ.get("SIM_API_BASE", "https://api.knowunity-studentsim.com")
TEAM_API_KEY = os.environ.get("SIM_TEAM_API_KEY", "your-team-key-here")
SET_TYPE_DEFAULT = "dev"

HEADERS = {"X-Api-Key": TEAM_API_KEY}

# ========================================
# API Helper Functions
# ========================================
def api_get(endpoint: str, params: dict = None) -> Dict[str, Any]:
    """GET request to simulator API."""
    try:
        resp = requests.get(f"{SIM_API_BASE}{endpoint}", headers=HEADERS, params=params, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        return {"error": f"API Error: {str(e)}"}

def api_post(endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """POST request to simulator API."""
    try:
        resp = requests.post(f"{SIM_API_BASE}{endpoint}", headers=HEADERS, json=payload, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        return {"error": f"API Error: {str(e)}"}

# ========================================
# Core Logic Functions
# ========================================
def list_students(settype: str) -> List[Dict[str, str]]:
    """List available students."""
    data = api_get("/students", {"settype": settype})
    if "error" in data:
        return [{"id": "error", "name": data["error"], "gradelevel": 0}]
    return data.get("students", [])

def list_topics_for_student(student_id: str) -> List[Dict[str, str]]:
    """List topics for a specific student."""
    data = api_get(f"/students/{student_id}/topics")
    if "error" in data:
        return [{"id": "error", "name": data["error"]}]
    return data.get("topics", [])

def start_conversation(student_id: str, topic_id: str) -> Dict[str, Any]:
    """Start a new conversation."""
    payload = {"studentid": student_id, "topicid": topic_id}
    data = api_post("/interact/start", payload)
    if "error" in data:
        return data
    data["student_name"] = next((s["name"] for s in list_students(SET_TYPE_DEFAULT) if s["id"] == student_id), "Unknown")
    data["topic_name"] = next((t["name"] for t in list_topics_for_student(student_id) if t["id"] == topic_id), "Unknown")
    return data

def send_message(conversation_id: str, message: str) -> Dict[str, Any]:
    """Send tutor message and get student response."""
    payload = {"conversationid": conversation_id, "tutormessage": message}
    return api_post("/interact", payload)

# ========================================
# Gradio Interface Logic
# ========================================
def auto_start(settype: str):
    """Auto-pick first student + topic and start conversation."""
    students = list_students(settype)
    if not students or students[0].get("id") == "error":
        return None, None, None, "❌ No students available", []
    
    student_id = students[0]["id"]
    topics = list_topics_for_student(student_id)
    if not topics or topics[0].get("id") == "error":
        return None, None, None, "❌ No topics available", []
    
    topic_id = topics[0]["id"]
    conv = start_conversation(student_id, topic_id)
    
    if "error" in conv:
        return None, None, None, f"❌ Start failed: {conv['error']}", []
    
    status = f"✅ Conversation started!\nStudent: {conv.get('student_name', 'Unknown')} (ID: {conv['conversationid']})\nTopic: {conv.get('topic_name', 'Unknown')}\nMax turns: {conv['maxturns']}"
    return student_id, topic_id, conv["conversationid"], status, []

def chat_step(conversation_id: str, message: str, chat_history: List):
    """Send message and append to chat history."""
    if not conversation_id or not message.strip():
        return conversation_id, gr.update(value=chat_history), ""
    
    resp = send_message(conversation_id, message)
    
    if "error" in resp:
        return conversation_id, gr.update(value=chat_history), f"❌ Error: {resp['error']}"
    
    # Append to chat history
    new_history = chat_history + [[message, resp["studentresponse"]]]
    
    status = f"✅ Turn {resp['turnnumber']}/{resp.get('maxturns', 10)} - Complete: {resp.get('iscomplete', False)}"
    return conversation_id, gr.update(value=new_history), status

def quick_diagnostic(conversation_id: str, chat_history: List):
    """Run 3-turn diagnostic sequence."""
    if not conversation_id:
        return conversation_id, gr.update(value=chat_history), "❌ No conversation"
    
    diagnostic_messages = [
        "Hi! Let's practice math. Solve 2x + 3 = 7 step by step.",
        "Good try! Now solve 3x - 2 = 10. Why did you choose that step?",
        "Nice! Try this word problem: If 2 apples cost $3, how much for 5 apples?"
    ]
    
    new_history = chat_history.copy()
    for i, msg in enumerate(diagnostic_messages, 1):
        resp = send_message(conversation_id, msg)
        if "error" in resp:
            return conversation_id, gr.update(value=new_history), f"❌ Error on turn {i}: {resp['error']}"
        
        new_history.append([msg, resp["studentresponse"]])
        if resp.get("iscomplete", False):
            break
    
    status = f"✅ Diagnostic complete ({len(new_history)//2} turns)"
    return conversation_id, gr.update(value=new_history), status

# ========================================
# Gradio Interface
# ========================================
with gr.Blocks(
    title="🤖 AI Tutor - Student Simulator",
    theme=gr.themes.Soft()
) as demo:
    
    gr.Markdown("# 🤖 AI Tutor - Student Simulator")
    gr.Markdown("Interact with simulated K12 students and infer their understanding levels (1-5).")
    
    with gr.Row():
        with gr.Column(scale=1):
            # Left panel: Setup
            gr.Markdown("## 1. Setup Conversation")
            
            with gr.Group():
                settype_dropdown = gr.Dropdown(
                    choices=["minidev", "dev", "eval"],
                    value="dev",
                    label="Student Set"
                )
                
                auto_btn = gr.Button("🚀 Auto Start (pick first student)", variant="primary")
                
                student_dropdown = gr.Dropdown(
                    choices=[],
                    label="Student",
                    interactive=True
                )
                
                topic_dropdown = gr.Dropdown(
                    choices=[],
                    label="Topic",
                    interactive=True
                )
                
                manual_start_btn = gr.Button("Start Manual Selection")
            
            conv_id_input = gr.Textbox(
                label="Conversation ID",
                placeholder="Auto-filled after start...",
                interactive=False
            )
            
            status_output = gr.Textbox(
                label="Status",
                interactive=False
            )
        
        with gr.Column(scale=2):
            # Right panel: Chat
            gr.Markdown("## 2. Chat with Student")
            
            chat_history = gr.ChatInterface(
                lambda msg, history: chat_step(conv_id_input.value, msg, history),
                additional_inputs=[conv_id_input],
                title="Tutor → Student Chat",
                description="Send tutor messages (up to 10 turns per conversation)"
            )
            
            with gr.Row():
                quick_diag_btn = gr.Button("🔍 Run Quick Diagnostic (3 turns)", variant="secondary")
                clear_chat_btn = gr.Button("🗑️ Clear Chat")
    
    # Event handlers
    settype_dropdown.change(
        fn=list_students,
        inputs=settype_dropdown,
        outputs=student_dropdown,
        show_progress=True
    )
    
    student_dropdown.change(
        fn=lambda sid: [list_topics_for_student(sid)] * 2,
        inputs=student_dropdown,
        outputs=[topic_dropdown, topic_dropdown]
    )
    
    auto_btn.click(
        fn=auto_start,
        inputs=settype_dropdown,
        outputs=[student_dropdown, topic_dropdown, conv_id_input, status_output, chat_history]
    )
    
    manual_start_btn.click(
        fn=lambda sid, tid: start_conversation(sid, tid),
        inputs=[student_dropdown, topic_dropdown],
        outputs=[conv_id_input, status_output]
    )
    
    quick_diag_btn.click(
        fn=quick_diagnostic,
        inputs=[conv_id_input, chat_history],
        outputs=[conv_id_input, chat_history, status_output]
    )
    
    clear_chat_btn.click(
        fn=lambda: ([], ""),
        outputs=[chat_history, status_output]
    )

if __name__ == "__main__":
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,  # Set True for public link
        show_error=True
    )
