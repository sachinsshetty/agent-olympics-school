# ui.py
import gradio as gr
import requests

BACKEND_URL = "http://localhost:8000"
BACKEND_URL = "https://school-server.dwani.ai/"
def get_students(set_type):
    try:
        resp = requests.get(f"{BACKEND_URL}/students", params={"set_type": set_type})
        data = resp.json()
        students = data.get("students", [])
        choices = [(f"{s['name']} (Grade {s.get('grade_level', '?')})", s["id"]) for s in students]
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
        payload = {"student_id": student_id, "topic_id": topic_id}
        resp = requests.post(f"{BACKEND_URL}/conversations/start", json=payload)
        data = resp.json()
        # Returns an empty list of messages (dictionaries)
        return data["conversation_id"], [], f"🚀 Session Started: {data['conversation_id']}"
    except Exception as e:
        return None, [], f"❌ Start failed: {str(e)}"

def handle_chat(message, history, conv_id):
    if not conv_id:
        history.append({"role": "assistant", "content": "⚠️ Start a session first!"})
        return "", history, "Error"
    
    try:
        # Add user message to history
        history.append({"role": "user", "content": message})
        
        payload = {"conversation_id": conv_id, "tutor_message": message}
        resp = requests.post(f"{BACKEND_URL}/conversations/interact", json=payload)
        data = resp.json()
        
        # Extract response and turn info [attached_file:1]
        reply = data.get("student_response", "...")
        turn = data.get("turn_number", "?")
        
        # Add student response to history using role/content format
        history.append({"role": "assistant", "content": reply})
        
        status = f"Turn {turn}/10 | Complete: {data.get('is_complete', False)}"
        return "", history, status
    except Exception as e:
        history.append({"role": "assistant", "content": f"❌ Error: {str(e)}"})
        return "", history, "Failed"

def submit_results(student_id, topic_id, level, set_type):
    try:
        mse_payload = {
            "predictions": [{"student_id": student_id, "topic_id": topic_id, "predicted_level": float(level)}],
            "set_type": set_type
        }
        mse_resp = requests.post(f"{BACKEND_URL}/evaluate/mse", json=mse_payload).json()
        tut_resp = requests.post(f"{BACKEND_URL}/evaluate/tutoring", params={"set_type": set_type}).json()
        return f"🏆 MSE SCORE: {mse_resp.get('mse_score', 'N/A')}\n\n📖 TUTORING SCORE: {tut_resp.get('score', 'N/A')}"
    except Exception as e:
        return f"Submission Error: {str(e)}"

# Define UI
with gr.Blocks(title="Tutor Challenge") as demo:
    gr.Markdown("# 🧑‍🏫 AI Tutor Interaction Lab")
    
    with gr.Row():
        set_type_dd = gr.Dropdown(["mini_dev", "dev", "eval"], value="mini_dev", label="Set")
        load_btn = gr.Button("🔄 Load Students")
    
    with gr.Row():
        student_sel = gr.Dropdown(label="Student", choices=[])
        topic_sel = gr.Dropdown(label="Topic", choices=[])
    
    start_btn = gr.Button("🚀 Start Session", variant="primary")
    
    chat_id = gr.State()
    status_msg = gr.Markdown("Status: Ready")
    
    # We do NOT pass type="messages" here because your version throws a TypeError.
    # We simply pass the dictionary format in the event handlers.
    chatbot = gr.Chatbot(label="Conversation History", height=500)
    
    with gr.Row():
        msg_input = gr.Textbox(label="Message", scale=4)
        send_btn = gr.Button("Send", scale=1)

    with gr.Accordion("Final Assessment", open=False):
        level_slider = gr.Slider(1, 5, step=1, label="Predicted Level")
        submit_btn = gr.Button("Submit Results")
        results_out = gr.Code(label="Evaluation Metrics")

    # Events
    load_btn.click(get_students, inputs=set_type_dd, outputs=[student_sel, status_msg])
    student_sel.change(get_topics, inputs=student_sel, outputs=topic_sel)
    start_btn.click(handle_start, inputs=[student_sel, topic_sel], outputs=[chat_id, chatbot, status_msg])
    
    send_btn.click(handle_chat, inputs=[msg_input, chatbot, chat_id], outputs=[msg_input, chatbot, status_msg])
    msg_input.submit(handle_chat, inputs=[msg_input, chatbot, chat_id], outputs=[msg_input, chatbot, status_msg])
    
    submit_btn.click(submit_results, inputs=[student_sel, topic_sel, level_slider, set_type_dd], outputs=results_out)

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=80,theme=gr.themes.Soft())  # css moved to launch()
    