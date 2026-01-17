import gradio as gr
import requests
import random

BACKEND_URL = "http://localhost:8000"
BACKEND_URL = "https://school-server.dwani.ai/"

def random_start():
    try:
        # 1. Randomly pick set_type (Internal only, not displayed)
        set_types = ["mini_dev", "dev", "eval"]
        selected_set = random.choice(set_types)
        
        # 2. Fetch Students using the random set
        s_resp = requests.get(f"{BACKEND_URL}/students", params={"set_type": selected_set}).json()
        students = s_resp.get("students", [])
        if not students: 
            return "❌ Error", "❌ Error", None, "", [], "No students found"
        
        # 3. Pick Random Student
        student = random.choice(students)
        student_text = f"{student['name']} (Grade {student.get('grade_level', '?')})"
        
        # 4. Fetch Topics
        t_resp = requests.get(f"{BACKEND_URL}/students/{student['id']}/topics").json()
        topics = t_resp.get("topics", [])
        if not topics:
            return student_text, "❌ No Topics", None, "", [], "No topics found"
            
        # 5. Pick Random Topic
        topic = random.choice(topics)
        topic_text = topic["name"]
        
        # 6. Start Conversation
        payload = {
            "student_id": student['id'], 
            "topic_id": topic['id'],
            "set_type": selected_set
        }
        start_resp = requests.post(f"{BACKEND_URL}/conversations/start", json=payload).json()
        conv_id = start_resp.get("conversation_id")
        
        status_msg = f"🚀 Ready ({selected_set})"
        
        return (
            student_text,  # Updates student_display
            topic_text,    # Updates topic_display
            conv_id,       # Updates chat_id state
            topic['name'], # Updates topic_name state
            [],            # Clears chatbot
            status_msg     # Updates status
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


with gr.Blocks() as demo:
    gr.Markdown("# 🧑‍🏫 AI Tutor")
    
    # Information Display Row (No set_type display)
    with gr.Row():
        student_display = gr.Textbox(label="Student", interactive=False, scale=2)
        topic_display = gr.Textbox(label="Topic", interactive=False, scale=2)
        # Button to cycle to next random student
        load_btn = gr.Button("🎲 Next Random", scale=1)

    # State Variables
    chat_id = gr.State()
    topic_name_state = gr.State("")

    # Chat Interface
    with gr.Row():
        with gr.Column(scale=3):
            chatbot = gr.Chatbot(height=450)
            with gr.Row():
                msg_input = gr.Textbox(label="Message", scale=5)
                submit_btn = gr.Button("Submit", variant="primary", scale=1)
        with gr.Column(scale=1):
            level_out = gr.Number(label="Level", value=3)
            analysis_out = gr.Markdown("Analysis...")
            suggest_out = gr.Textbox(label="Suggestion", lines=6)
            status_out = gr.Markdown("Ready")

    # --- Event Wiring ---
    
    # Outputs for the random starter (removed set_display)
    start_outputs = [student_display, topic_display, chat_id, topic_name_state, chatbot, status_out]

    # Auto-start on load
    demo.load(random_start, inputs=None, outputs=start_outputs)
    
    # Click to shuffle
    load_btn.click(random_start, inputs=None, outputs=start_outputs)

    # Chat interaction
    chat_args = {
        "fn": handle_chat,
        "inputs": [msg_input, chatbot, chat_id, topic_name_state],
        "outputs": [msg_input, chatbot, status_out, level_out, analysis_out, suggest_out]
    }
    msg_input.submit(**chat_args)
    submit_btn.click(**chat_args)


if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=8080, theme=gr.themes.Soft())
