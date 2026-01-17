# ux.py
import gradio as gr
import requests

BACKEND_URL = "http://localhost:8000"
BACKEND_URL = "https://school-server.dwani.ai/"

def get_students(set_type):
    resp = requests.get(f"{BACKEND_URL}/students", params={"set_type": set_type}).json()
    return gr.update(choices=[(f"{s['name']} (G{s.get('grade_level', '?')})", s["id"]) for s in resp.get("students", [])]), "✅ Loaded"

def get_topics(student_id):
    resp = requests.get(f"{BACKEND_URL}/students/{student_id}/topics").json()
    return gr.update(choices=[(t["name"], t["id"]) for t in resp.get("topics", [])])

def handle_start(student_id, topic_id):
    resp = requests.post(f"{BACKEND_URL}/conversations/start", json={"student_id": student_id, "topic_id": topic_id}).json()
    return resp["conversation_id"], [], "🚀 Started"

async def handle_chat(message, history, conv_id, topic_name):
    if not conv_id: return "", history, "No Session", 3, "", ""
    hist_state = history if history is not None else []
    payload = {"conversation_id": conv_id, "tutor_message": message, "topic_name": str(topic_name or "Topic"), "history": hist_state}
    resp = requests.post(f"{BACKEND_URL}/conversations/interact", json=payload).json()
    new_history = list(hist_state) + [{"role": "user", "content": message}, {"role": "assistant", "content": resp.get("student_response", "...")}]
    return "", new_history, f"Turn {resp.get('turn_number', '?')}/10", resp.get("analysis", {}).get("understanding_level", 3), resp.get("analysis", {}).get("justification", ""), resp.get("suggestion", {}).get("suggested_response", "")

def submit_results(student_id, topic_id, level, set_type):
    mse = requests.post(f"{BACKEND_URL}/evaluate/mse", json={"predictions": [{"student_id": student_id, "topic_id": topic_id, "predicted_level": float(level)}], "set_type": set_type}).json()
    tut = requests.post(f"{BACKEND_URL}/evaluate/tutoring", params={"set_type": set_type}).json()
    return f"MSE: {mse.get('mse_score')}\nTutoring: {tut.get('score')}"

with gr.Blocks() as demo:
    gr.Markdown("# 🧑‍🏫 AI Tutor")
    with gr.Row():
        set_type = gr.Dropdown(["mini_dev", "dev", "eval"], value="mini_dev", label="Set")
        load_btn = gr.Button("🔄 Load")
    with gr.Row():
        student_sel, topic_sel = gr.Dropdown(label="Student"), gr.Dropdown(label="Topic")
    start_btn = gr.Button("🚀 Start")
    chat_id, topic_name_state = gr.State(), gr.State("")
    with gr.Row():
        with gr.Column(scale=3):
            chatbot, msg_input = gr.Chatbot(height=450), gr.Textbox(label="Message")
        with gr.Column(scale=1):
            level_out, analysis_out, suggest_out, status_out = gr.Number(label="Level", value=3), gr.Markdown("Analysis..."), gr.Textbox(label="Suggestion"), gr.Markdown("Ready")
    with gr.Accordion("Submit"):
        level_slider, submit_btn, results_out = gr.Slider(1, 5, step=1, label="Level"), gr.Button("Submit"), gr.Code()

    load_btn.click(get_students, inputs=set_type, outputs=[student_sel, status_out])
    student_sel.change(get_topics, inputs=student_sel, outputs=topic_sel)
    topic_sel.change(lambda t: t, inputs=topic_sel, outputs=topic_name_state)
    start_btn.click(handle_start, inputs=[student_sel, topic_sel], outputs=[chat_id, chatbot, status_out])
    msg_input.submit(handle_chat, inputs=[msg_input, chatbot, chat_id, topic_name_state], outputs=[msg_input, chatbot, status_out, level_out, analysis_out, suggest_out])
    submit_btn.click(submit_results, inputs=[student_sel, topic_sel, level_slider, set_type], outputs=results_out)

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=8080, theme=gr.themes.Soft())
