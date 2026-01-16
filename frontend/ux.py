# ux.py
import gradio as gr
import requests
import json
import os
import asyncio
from openai import AsyncOpenAI

# Configuration
BACKEND_URL = "http://localhost:8000"
BACKEND_URL = "https://school-server.dwani.ai/"

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

async def analyze_understanding(history_dicts, topic_name):
    """Parses history dictionaries and calls OpenAI for pedagogical analysis."""
    if not history_dicts:
        return 3, "No interaction yet.", []

    try:
        # Convert list of dicts to a readable transcript for the LLM
        history_text = ""
        for msg in history_dicts:
            role = "Tutor" if msg["role"] == "user" else "Student"
            history_text += f"{role}: {msg['content']}\n"

        prompt = ANALYSIS_PROMPT_TEMPLATE.format(history_text=history_text, topic_name=topic_name)
        
        response = await openai_client.chat.completions.create(
            model="gemma3",
            messages=[{"role": "system", "content": "You are an expert K12 pedagogy analyzer."},
                      {"role": "user", "content": prompt}],
            response_format={ "type": "json_object" }
        )
        
        analysis = json.loads(response.choices[0].message.content)
        return (
            analysis.get("understanding_level", 3),
            analysis.get("justification", "Analysis complete."),
            analysis.get("evidence", [])
        )
    except Exception as e:
        return 3, f"Analysis Error: {str(e)}", []

# --- Gradio Logic ---

def load_students(set_type):
    try:
        resp = requests.get(f"{BACKEND_URL}/students", params={"set_type": set_type}).json()
        students = resp.get("students", [])
        return gr.update(choices=[(f"{s['name']} (G{s.get('grade_level', '?')})", s["id"]) for s in students])
    except: return gr.update(choices=[])

def load_topics(student_id):
    try:
        resp = requests.get(f"{BACKEND_URL}/students/{student_id}/topics").json()
        topics = resp.get("topics", [])
        return gr.update(choices=[(t["name"], t["id"]) for t in topics])
    except: return gr.update(choices=[])

async def handle_chat(message, history, conv_id, topic_name):
    """Main Interaction Loop using Role/Content dictionary format."""
    if not conv_id:
        # If no session, still return dict format to satisfy Gradio
        history.append({"role": "assistant", "content": "⚠️ Start a session first!"})
        return "", history, "Error", 3, "Start a session first."
    
    try:
        # 1. Add Tutor Message
        history.append({"role": "user", "content": message})
        
        # 2. Get student response from API
        resp = requests.post(f"{BACKEND_URL}/conversations/interact", 
                             json={"conversation_id": conv_id, "tutor_message": message}).json()
        
        reply = resp.get("student_response", "No response")
        
        # 3. Add Student Message
        history.append({"role": "assistant", "content": reply})
        
        # 4. Analyze current level
        level, reason, _ = await analyze_understanding(history, topic_name)
        
        status = f"Turn {resp.get('turn_number', '?')}/10"
        return "", history, status, level, f"**Level {level}**: {reason}"
    except Exception as e:
        history.append({"role": "assistant", "content": f"❌ Error: {str(e)}"})
        return "", history, "Error", 3, f"Failed: {str(e)}"

# --- UI Layout ---

with gr.Blocks(title="AI Tutor Analysis") as demo:
    gr.Markdown("# 🧑‍🏫 AI Tutor: Turn-by-Turn Analysis")
    
    with gr.Row():
        with gr.Column(scale=3):
            set_type = gr.Dropdown(["mini_dev", "dev", "eval"], value="mini_dev", label="Set")
            student_sel = gr.Dropdown(label="Student", choices=[])
            topic_sel = gr.Dropdown(label="Topic", choices=[])
            start_btn = gr.Button("🚀 Start Session", variant="primary")
            # NOTE: Removed type="messages" to avoid TypeError, but data remains dict-based
            chatbot = gr.Chatbot(label="Conversation", height=450) 
            msg_input = gr.Textbox(label="Your Tutor Message", placeholder="Type here and press Enter...")
            
        with gr.Column(scale=1):
            gr.Markdown("### 📊 Live Inference")
            inferred_level = gr.Number(label="Inferred Level (1-5)", value=3)
            analysis_box = gr.Markdown("Waiting for interaction...")
            status_msg = gr.Markdown("Status: Ready")

    chat_id = gr.State()
    topic_text = gr.State("")

    # Events
    demo.load(lambda: load_students("mini_dev"), outputs=student_sel)
    set_type.change(load_students, inputs=set_type, outputs=student_sel)
    student_sel.change(load_topics, inputs=student_sel, outputs=topic_sel)
    topic_sel.change(lambda t: t, inputs=topic_sel, outputs=topic_text)

    # Start button returns an empty list for dict-based history
    start_btn.click(
        lambda s, t: (requests.post(f"{BACKEND_URL}/conversations/start", 
                                   json={"student_id": s, "topic_id": t}).json()["conversation_id"], []),
        inputs=[student_sel, topic_sel], 
        outputs=[chat_id, chatbot]
    )
    
    msg_input.submit(
        handle_chat, 
        inputs=[msg_input, chatbot, chat_id, topic_text], 
        outputs=[msg_input, chatbot, status_msg, inferred_level, analysis_box]
    )

if __name__ == "__main__":
    # Theme configuration for Gradio 6.x
    demo.launch(server_name="0.0.0.0", server_port=8080, theme=gr.themes.Soft())
