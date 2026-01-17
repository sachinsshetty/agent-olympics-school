import gradio as gr
import requests
import random

BACKEND_URL = "http://localhost:8000"
BACKEND_URL = "https://school-server.dwani.ai/"

def random_start():
    try:
        set_types = ["mini_dev", "dev", "eval"]
        selected_set = random.choice(set_types)
        
        s_resp = requests.get(f"{BACKEND_URL}/students", params={"set_type": selected_set}).json()
        students = s_resp.get("students", [])
        if not students: 
            return "❌ Error", "❌ Error", None, "", [], "No students found"
        
        student = random.choice(students)
        student_text = f"{student['name']} (Grade {student.get('grade_level', '?')})"
        
        t_resp = requests.get(f"{BACKEND_URL}/students/{student['id']}/topics").json()
        topics = t_resp.get("topics", [])
        if not topics:
            return student_text, "❌ No Topics", None, "", [], "No topics found"
            
        topic = random.choice(topics)
        topic_text = topic["name"]
        
        payload = {
            "student_id": student['id'], 
            "topic_id": topic['id'],
            "set_type": selected_set
        }
        start_resp = requests.post(f"{BACKEND_URL}/conversations/start", json=payload).json()
        conv_id = start_resp.get("conversation_id")
        
        status_msg = f"🚀 Ready ({selected_set})"
        
        return (
            student_text, 
            topic_text,    
            conv_id,       
            topic['name'], 
            [],            
            status_msg     
        )
    except Exception as e:
        return "Error", "Error", None, "", [], f"Error: {str(e)}"

async def handle_chat(message, history, conv_id, topic_name):
    if not conv_id: return "", history, "No Session", 3, "", ""
    hist_state = history if history is not None else []
    payload = {"conversation_id": conv_id, "tutor_message": message, "topic_name": str(topic_name or "Topic"), "history": hist_state}
    resp = requests.post(f"{BACKEND_URL}/conversations/interact", json=payload).json()
    new_history = list(hist_state) + [{"role": "user", "content": message}, {"role": "assistant", "content": resp.get("student_response", "...")}]
    return "", new_history, f"Turn {resp.get('turn_number', '?')}/10", resp.get("analysis", {}).get("understanding_level", 3), resp.get("analysis", {}).get("justification", ""), resp.get("suggestion", {}).get("suggested_response", "")


# 1. Define the Favicon HTML (Uses the 🧑‍🏫 emoji as an icon)
favicon_html = """
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧑‍🏫</text></svg>">
"""

# 2. Inject it into the 'head' parameter
with gr.Blocks(title="AI Tutor Dashboard", head=favicon_html) as demo:
    gr.Markdown("# 🧑‍🏫 AI Tutor")
    
    with gr.Row():
        student_display = gr.Textbox(label="Student", interactive=False, scale=2)
        topic_display = gr.Textbox(label="Topic", interactive=False, scale=2)
        load_btn = gr.Button("🎲 Next Random", scale=1)

    chat_id = gr.State()
    topic_name_state = gr.State("")

    with gr.Row():
        with gr.Column(scale=3):
            chatbot = gr.Chatbot(height=450)
            with gr.Row():
                msg_input = gr.Textbox(
                    label="Message", 
                    placeholder="Enter your question to start...", 
                    scale=5
                )
                submit_btn = gr.Button("Submit", variant="primary", scale=1)
        with gr.Column(scale=1):
            level_out = gr.Number(label="Level", value=3)
            analysis_out = gr.Markdown("Analysis...")
            suggest_out = gr.Textbox(label="Suggestion", lines=6)
            status_out = gr.Markdown("Ready")

    start_outputs = [student_display, topic_display, chat_id, topic_name_state, chatbot, status_out]

    demo.load(random_start, inputs=None, outputs=start_outputs)
    load_btn.click(random_start, inputs=None, outputs=start_outputs)

    chat_args = {
        "fn": handle_chat,
        "inputs": [msg_input, chatbot, chat_id, topic_name_state],
        "outputs": [msg_input, chatbot, status_out, level_out, analysis_out, suggest_out]
    }
    msg_input.submit(**chat_args)
    submit_btn.click(**chat_args)


if __name__ == "__main__":
    # Removed favicon_path since we are using head injection
    demo.launch(server_name="0.0.0.0", server_port=8080, theme=gr.themes.Soft())
