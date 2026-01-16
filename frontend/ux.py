# ui.py
# Run with: python ui.py

import gradio as gr
import requests

BACKEND_URL = "http://localhost:8000"

def get_students(set_type):
    try:
        resp = requests.get(f"{BACKEND_URL}/students", params={"set_type": set_type})
        data = resp.json()
        student_list = data.get("students", [])
        choices = [(f"{s['name']} (G{s['grade_level']})", s["id"]) for s in student_list]
        return gr.update(choices=choices), f"✅ Loaded {len(choices)} students"
    except Exception as e:
        return gr.update(choices=[]), f"❌ Error: {str(e)}"

def get_topics(student_id):
    if not student_id: return gr.update(choices=[])
    try:
        resp = requests.get(f"{BACKEND_URL}/students/{student_id}/topics")
        topics = resp.json().get("topics", [])
        return gr.update(choices=[(t["name"], t["id"]) for t in topics])
    except: return gr.update(choices=[])

def handle_start(student_id, topic_id):
    try:
        resp = requests.post(f"{BACKEND_URL}/conversations/start", 
                            json={"student_id": student_id, "topic_id": topic_id})
        data = resp.json()
        return data["conversation_id"], [], f"🚀 Active Session: {data['conversation_id']} | Turns: {data['max_turns']}"
    except Exception as e:
        return None, [], f"❌ Start failed: {str(e)}"

def handle_chat(message, history, conv_id):
    if not conv_id: return "", history + [("System", "Start a session first!")]
    try:
        resp = requests.post(f"{BACKEND_URL}/conversations/{conv_id}/send", 
                            json={"tutor_message": message})
        data = resp.json()
        history.append((message, data["student_response"] if "student_response" in data else data.get("studentresponse")))
        return "", history
    except Exception as e:
        return "", history + [("Error", str(e))]

with gr.Blocks(title="Tutor Interface", theme=gr.themes.Soft()) as demo:
    gr.Markdown("# 🧑‍🏫 Tutor Interaction Lab")
    
    with gr.Row():
        set_type = gr.Dropdown(["mini_dev", "dev", "eval"], value="mini_dev", label="Set")
        load_btn = gr.Button("🔄 Load Students")
    
    with gr.Row():
        student_sel = gr.Dropdown(label="Student", choices=[])
        topic_sel = gr.Dropdown(label="Topic", choices=[])
    
    start_btn = gr.Button("🚀 Start Tutoring Session", variant="primary")
    chat_id = gr.State()
    status = gr.Markdown("Status: Ready")
    
    chatbot = gr.Chatbot(height=400)
    msg = gr.Textbox(label="Message", placeholder="Assess their level...")
    send = gr.Button("Send")

    load_btn.click(get_students, inputs=set_type, outputs=[student_sel, status])
    student_sel.change(get_topics, inputs=student_sel, outputs=topic_sel)
    start_btn.click(handle_start, inputs=[student_sel, topic_sel], outputs=[chat_id, chatbot, status])
    send.click(handle_chat, inputs=[msg, chatbot, chat_id], outputs=[msg, chatbot])

if __name__ == "__main__":
    demo.launch(server_port=7860)
