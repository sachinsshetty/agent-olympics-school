# ui.py
# Run with: python ui.py

import gradio as gr
import requests

BACKEND_URL = "http://localhost:8000"

def get_students(set_type):
    try:
        resp = requests.get(f"{BACKEND_URL}/students", params={"set_type": set_type})
        resp.raise_for_status()
        data = resp.json()
        # Extract list from the 'students' key in the response
        student_list = data.get("students", [])
        choices = [(f"{s['name']} (Grade {s.get('grade_level', s.get('gradelevel'))})", s["id"]) for s in student_list]
        return gr.update(choices=choices), f"Found {len(choices)} students."
    except Exception as e:
        return gr.update(choices=[]), f"Error loading students: {str(e)}"

def get_topics(student_id):
    if not student_id:
        return gr.update(choices=[])
    try:
        resp = requests.get(f"{BACKEND_URL}/students/{student_id}/topics")
        resp.raise_for_status()
        topic_list = resp.json().get("topics", [])
        choices = [(t["name"], t["id"]) for t in topic_list]
        return gr.update(choices=choices)
    except Exception as e:
        print(f"Error loading topics: {e}")
        return gr.update(choices=[])

def handle_start(student_id, topic_id):
    try:
        resp = requests.post(f"{BACKEND_URL}/conversations/start", 
                            json={"student_id": student_id, "topic_id": topic_id})
        resp.raise_for_status()
        data = resp.json()
        return data["conversationid"], [], f"Chat started. ID: {data['conversationid']}"
    except Exception as e:
        return None, [], f"Failed to start: {str(e)}"

def handle_chat(message, history, conv_id):
    if not conv_id:
        history.append((message, "⚠️ Please start a conversation first!"))
        return "", history
    
    try:
        resp = requests.post(f"{BACKEND_URL}/conversations/{conv_id}/send", 
                            json={"tutor_message": message})
        resp.raise_for_status()
        data = resp.json()
        history.append((message, data["studentresponse"]))
        return "", history
    except Exception as e:
        history.append((message, f"❌ Error: {str(e)}"))
        return "", history

with gr.Blocks(title="AI Tutor Interface", theme=gr.themes.Soft()) as demo:
    gr.Markdown("# 🧑‍🏫 AI Tutor Interaction Lab")
    
    with gr.Row():
        set_type_input = gr.Dropdown(choices=["mini_dev", "dev", "eval"], value="mini_dev", label="Student Set")
        load_btn = gr.Button("🔄 1. Load Students", variant="secondary")
    
    with gr.Row():
        student_dropdown = gr.Dropdown(label="2. Select Student", choices=[])
        topic_dropdown = gr.Dropdown(label="3. Select Topic", choices=[])
    
    start_btn = gr.Button("🚀 4. Start Tutoring Session", variant="primary")
    
    chat_id_store = gr.State()
    status_msg = gr.Markdown("Status: Ready")
    
    chatbot = gr.Chatbot(label="Tutoring Conversation", height=450)
    msg_input = gr.Textbox(label="Your Message", placeholder="Ask a question to gauge understanding...")
    send_btn = gr.Button("Send")

    # Wire up events
    load_btn.click(get_students, inputs=[set_type_input], outputs=[student_dropdown, status_msg])
    student_dropdown.change(get_topics, inputs=[student_dropdown], outputs=[topic_dropdown])
    
    start_btn.click(handle_start, 
                   inputs=[student_dropdown, topic_dropdown], 
                   outputs=[chat_id_store, chatbot, status_msg])
    
    send_btn.click(handle_chat, 
                  inputs=[msg_input, chatbot, chat_id_store], 
                  outputs=[msg_input, chatbot])
    
    msg_input.submit(handle_chat, 
                    inputs=[msg_input, chatbot, chat_id_store], 
                    outputs=[msg_input, chatbot])

if __name__ == "__main__":
    demo.launch(server_port=7860)
