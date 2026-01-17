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
            chatbot = gr.Chatbot(height=450)
            with gr.Row():
                # Message field
                msg_input = gr.Textbox(label="Message", scale=5)
                # Submit button next to message field
                submit_btn = gr.Button("Submit", variant="primary", scale=1)
        with gr.Column(scale=1):
            level_out = gr.Number(label="Level", value=3)
            analysis_out = gr.Markdown("Analysis...")
            suggest_out = gr.Textbox(label="Suggestion", lines=6)
            status_out = gr.Markdown("Ready")

    load_btn.click(get_students, inputs=set_type, outputs=[student_sel, status_out])
    student_sel.change(get_topics, inputs=student_sel, outputs=topic_sel)
    topic_sel.change(lambda t: t, inputs=topic_sel, outputs=topic_name_state)
    start_btn.click(handle_start, inputs=[student_sel, topic_sel], outputs=[chat_id, chatbot, status_out])
    
    # Shared arguments for both Enter key and Submit button click
    chat_args = {
        "fn": handle_chat,
        "inputs": [msg_input, chatbot, chat_id, topic_name_state],  # Button uses msg_input content
        "outputs": [msg_input, chatbot, status_out, level_out, analysis_out, suggest_out]
    }
    
    msg_input.submit(**chat_args)
    submit_btn.click(**chat_args)


if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=8080, theme=gr.themes.Soft())
