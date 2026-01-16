#!/usr/bin/env python3
"""
Gradio UI → FastAPI → Student Simulator
UPDATED: Correct set_type parameter
"""

import gradio as gr
import requests
from typing import List

FASTAPI_BASE = "http://localhost:8000"

def api_get(endpoint: str, params: dict = None) -> dict:
    try:
        url = f"{FASTAPI_BASE}{endpoint}"
        print(f"→ GET {url}  params: {params}")  # debug
        resp = requests.get(url, params=params, timeout=12)
        print(f"← {resp.status_code} {resp.text[:180]}...")  # debug
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        return {"error": str(e)}

def api_post(endpoint: str, payload: dict) -> dict:
    try:
        resp = requests.post(f"{FASTAPI_BASE}{endpoint}", json=payload, timeout=12)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.HTTPError as e:
        return {"error": f"HTTP {e.response.status_code}: {e.response.text[:120]}"}
    except Exception as e:
        return {"error": str(e)}

def list_students(set_type: str = "dev") -> List[dict]:
    data = api_get("/students", {"set_type": set_type})
    if "error" in data:
        return []
    return data  # already list of StudentInfo dicts

def start_conversation(set_type: str = "dev") -> dict:
    return api_post("/start", {"set_type": set_type})

def send_message(conversation_id: str, message: str) -> dict:
    return api_post("/send", {"conversation_id": conversation_id, "message": message})

# ========================================
# Gradio Logic
# ========================================
conversation_state = gr.State("")

def auto_start(set_type):
    students = list_students(set_type)
    if not students:
        return "", 0, "❌ No students available", [], ""
    
    conv = start_conversation(set_type)
    if "error" in conv:
        return "", 0, f"❌ {conv['error']}", [], ""
    
    status = f"✅ {conv['student_name']} - {conv['topic_name']} (Max: {conv['max_turns']})"
    return conv["conversation_id"], conv["max_turns"], status, [], conv["conversation_id"]

def chat_step(message, history, conv_id):
    if not conv_id or not message.strip():
        return history, "Start conversation first", conv_id
    
    resp = send_message(conv_id, message)
    if "error" in resp:
        return history, f"❌ {resp['error']}", conv_id
    
    history.append([message, resp["student_response"]])
    
    status = f"Turn {resp['turn_number']}"
    if resp.get("is_complete", False):
        status += " — CONVERSATION COMPLETE ✓"
    
    return history, status, conv_id

# ========================================
# Gradio UI
# ========================================
with gr.Blocks(theme=gr.themes.Soft()) as demo:
    gr.Markdown("# 🤖 AI Tutor - KnowUnity Agent Olympics 2026")
    gr.Markdown("FastAPI (8000) ← Gradio (7860)")
    
    with gr.Row():
        with gr.Column(scale=1):
            gr.Markdown("## 1. Start Session")
            settype_dropdown = gr.Dropdown(
                choices=["minidev", "dev", "eval"], 
                value="dev", 
                label="Student Set"
            )
            auto_btn = gr.Button("🚀 Auto Start", variant="primary")
            
            conv_id_display = gr.Textbox(label="Conversation ID", interactive=False)
            max_turns = gr.Number(label="Max Turns", interactive=False)
            status_txt = gr.Textbox(label="Status", lines=3)
        
        with gr.Column(scale=2):
            gr.Markdown("## 2. Chat with Student")
            chatbot = gr.Chatbot(height=500)
            msg_input = gr.Textbox(placeholder="Type your message as the tutor...", label="Tutor Message")
            with gr.Row():
                send_btn = gr.Button("Send", variant="primary")
                clear_btn = gr.Button("🗑️ Clear", scale=0)

    # Hidden state
    conv_state = gr.State("")

    # Events
    auto_btn.click(
        auto_start,
        inputs=settype_dropdown,
        outputs=[conv_state, max_turns, status_txt, chatbot, conv_id_display]
    )
    
    send_btn.click(
        chat_step,
        inputs=[msg_input, chatbot, conv_state],
        outputs=[chatbot, status_txt, conv_state]
    )
    msg_input.submit(
        chat_step,
        inputs=[msg_input, chatbot, conv_state],
        outputs=[chatbot, status_txt, conv_state]
    )
    
    clear_btn.click(
        lambda: ([], "", "", ""),
        outputs=[chatbot, msg_input, status_txt, conv_state]
    )

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860, share=False)