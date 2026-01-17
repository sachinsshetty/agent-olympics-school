# ux.py
import gradio as gr
import requests

BACKEND_URL = "http://localhost:8000"
BACKEND_URL = "https://school-server.dwani.ai/"

def get_students(set_type):
    try:
        resp = requests.get(f"{BACKEND_URL}/students", params={"set_type": set_type})
        data = resp.json()
        students = data.get("students", [])
        choices = [(f"{s['name']} (G{s.get('grade_level', '?')})", s["id"]) for s in students]
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
        return data["conversation_id"], [], f"🚀 Session Started: {data['conversation_id']}"
    except Exception as e:
        return None, [], f"❌ Start failed: {str(e)}"

async def handle_chat(message, history, conv_id, topic_name):
    if not conv_id:
        history.append({"role": "assistant", "content": "⚠️ Start a session first!"})
        return "", history, "Error", 3, "Start a session first."
    
    try:
        payload = {"conversation_id": conv_id, "tutor_message": message, "topic_name": topic_name, "history": history}
        resp = requests.post(f"{BACKEND_URL}/conversations/interact", json=payload).json()
        
        history.append({"role": "user", "content": message})
        history.append({"role": "assistant", "content": resp.get("student_response")})
        
        analysis = resp.get("analysis", {})
        status = f"Turn {resp.get('turn_number')}/10 | Complete: {resp.get('is_complete')}"
        return "", history, status, analysis.get("understanding_level", 3), analysis.get("justification", "")
    except Exception as e:
        history.append({"role": "assistant", "content": f"❌ Error: {str(e)}"})
        return "", history, "Error", 3, f"Failed: {str(e)}"

def submit_results(student_id, topic_id, level, set_type):
    try:
        mse_payload = {"predictions": [{"student_id": student_id, "topic_id": topic_id, "predicted_level": float(level)}], "set_type": set_type}
        mse_resp = requests.post(f"{BACKEND_URL}/evaluate/mse", json=mse_payload).json()
        tut_resp = requests.post(f"{BACKEND_URL}/evaluate/tutoring", params={"set_type": set_type}).json()
        return f"🏆 MSE SCORE: {mse_resp.get('mse_score', 'N/A')}\n\n📖 TUTORING SCORE: {tut_resp.get('score', 'N/A')}"
    except Exception as e:
        return f"Submission Error: {str(e)}"

with gr.Blocks(title="AI Tutor Lab") as demo:
    gr.Markdown("# 🧑‍🏫 AI Tutor Lab: In-Server Analysis")
    with gr.Row():
        set_type_dd = gr.Dropdown(["mini_dev", "dev", "eval"], value="mini_dev", label="Set")
        load_btn = gr.Button("🔄 Load Students")
    with gr.Row():
        student_sel = gr.Dropdown(label="Student", choices=[])
        topic_sel = gr.Dropdown(label="Topic", choices=[])
    start_btn = gr.Button("🚀 Start Session", variant="primary")
    chat_id = gr.State()
    status_msg = gr.Markdown("Status: Ready")
    with gr.Row():
        with gr.Column(scale=3):
            chatbot = gr.Chatbot(label="Conversation", height=450)
            msg_input = gr.Textbox(label="Message")
            send_btn = gr.Button("Send")
        with gr.Column(scale=1):
            gr.Markdown("### 📊 Live Inference")
            inferred_level = gr.Number(label="Inferred Level (1-5)", value=3)
            analysis_box = gr.Markdown("Waiting for interaction...")
    with gr.Accordion("Leaderboard Submission", open=False):
        level_slider = gr.Slider(1, 5, step=1, label="Predicted Level")
        submit_btn = gr.Button("Submit Results")
        results_out = gr.Code(label="Final Leaderboard Metrics")

    topic_name_state = gr.State("")
    load_btn.click(get_students, inputs=set_type_dd, outputs=[student_sel, status_msg])
    student_sel.change(get_topics, inputs=student_sel, outputs=topic_sel)
    topic_sel.change(lambda t: t, inputs=topic_sel, outputs=topic_name_state)
    start_btn.click(handle_start, inputs=[student_sel, topic_sel], outputs=[chat_id, chatbot, status_msg])
    send_btn.click(handle_chat, inputs=[msg_input, chatbot, chat_id, topic_name_state], outputs=[msg_input, chatbot, status_msg, inferred_level, analysis_box])
    msg_input.submit(handle_chat, inputs=[msg_input, chatbot, chat_id, topic_name_state], outputs=[msg_input, chatbot, status_msg, inferred_level, analysis_box])
    submit_btn.click(submit_results, inputs=[student_sel, topic_sel, level_slider, set_type_dd], outputs=results_out)

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=8080, theme=gr.themes.Soft())
