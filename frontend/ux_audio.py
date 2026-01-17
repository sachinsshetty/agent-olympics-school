import gradio as gr
import requests
import random
import os
import logging
import dwani
import tempfile  # Required for saving TTS audio

# --- Configuration ---
BACKEND_URL = "https://school-server.dwani.ai/"
dwani.api_key = os.getenv("DWANI_API_KEY")
dwani.api_base = os.getenv("DWANI_API_BASE_URL")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if not dwani.api_key:
    logger.warning("⚠️ DWANI_API_KEY not set. Transcription/TTS features will fail.")

# Language Options
ASR_LANGUAGES = ["english", "german"]

# Mapping for TTS languages if they differ slightly, or reuse ASR list
TTS_LANGUAGES = ASR_LANGUAGES 

# --- Helper Functions ---

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

def transcribe_with_dwani(audio_path, language):
    if not audio_path: return ""
    if not dwani.api_key: return "Error: DWANI_API_KEY missing."

    try:
        logger.info(f"Transcribing {audio_path} in {language}...")
        result = dwani.ASR.transcribe(file_path=audio_path, language=language)
        if isinstance(result, dict):
            return result.get("text") or result.get("transcription") or str(result)
        return str(result)
    except Exception as e:
        logger.error(f"ASR Error: {e}")
        return f"Error: {str(e)}"

def speak_response(text, language):
    """
    Converts text to speech using Dwani API and returns the file path.
    """
    if not text: return None
    if not dwani.api_key: return None

    try:
        logger.info(f"Synthesizing speech for: {text[:30]}... in {language}")
        response = dwani.Audio.speech(
            input=text,
            response_format="mp3",
            language=language
        )
        # Save to temp file
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
            temp_file.write(response)
            return temp_file.name
    except Exception as e:
        logger.error(f"TTS Error: {e}")
        return None

# --- Interaction Handlers ---

async def handle_chat_logic(message, history, conv_id, topic_name):
    """Shared logic for calling the backend"""
    if not conv_id: 
        return history, "No Session", 3, "", "", "" # Return empty response text
        
    hist_state = history if history is not None else []
    
    payload = {
        "conversation_id": conv_id, 
        "tutor_message": message, 
        "topic_name": str(topic_name or "Topic"), 
        "history": hist_state
    }
    
    try:
        resp = requests.post(f"{BACKEND_URL}/conversations/interact", json=payload).json()
        student_response = resp.get("student_response", "...")
        
        new_history = list(hist_state) + [
            {"role": "user", "content": message}, 
            {"role": "assistant", "content": student_response}
        ]
        
        return (
            new_history, 
            f"Turn {resp.get('turn_number', '?')}/10", 
            resp.get("analysis", {}).get("understanding_level", 3), 
            resp.get("analysis", {}).get("justification", ""), 
            resp.get("suggestion", {}).get("suggested_response", ""),
            student_response # Return the raw text for TTS
        )
    except Exception as e:
        return hist_state, f"Error: {str(e)}", 0, "", "", ""

async def handle_text_chat(message, history, conv_id, topic_name):
    """Wrapper for text-only input"""
    new_hist, status, level, justif, sugg, _ = await handle_chat_logic(message, history, conv_id, topic_name)
    return "", new_hist, status, level, justif, sugg

async def handle_voice_chat(audio_path, language, history, conv_id, topic_name):
    """Wrapper for voice input + TTS output"""
    if not audio_path:
        return None, history, "❌ No Audio", 0, "", "", None
        
    # 1. Transcribe
    transcribed_text = transcribe_with_dwani(audio_path, language)
    if not transcribed_text or transcribed_text.startswith("Error"):
        return None, history, f"❌ {transcribed_text}", 0, "", "", None

    # 2. Get Backend Response
    new_hist, status, level, justif, sugg, raw_response = await handle_chat_logic(transcribed_text, history, conv_id, topic_name)
    
    # 3. Synthesize Speech (TTS)
    # We use the same language for TTS as was used for ASR, assuming the conversation stays in that language.
    audio_response_path = speak_response(raw_response, language)
    
    return None, new_hist, status, level, justif, sugg, audio_response_path

# --- UI Setup ---

favicon_html = """
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧑‍🏫</text></svg>">
"""

css = """
.gradio-container { max-width: 1200px; margin: auto; }
"""

with gr.Blocks(title="AI Tutor - ಶಾಲೆ") as demo:
    gr.Markdown("# 🧑‍🏫 AI Tutor - ಶಾಲೆ")
    
    with gr.Row():
        student_display = gr.Textbox(label="Student", interactive=False, scale=2)
        topic_display = gr.Textbox(label="Topic", interactive=False, scale=2)
        load_btn = gr.Button("🎲 Next Random", scale=1)

    # State variables
    chat_id = gr.State()
    topic_name_state = gr.State("")

    with gr.Row():
        # LEFT: Chat + Inputs
        with gr.Column(scale=3):
            chatbot = gr.Chatbot(height=500)
            
            with gr.Tabs():
                # Tab 1: Text
                with gr.TabItem("⌨️ Text Chat"):
                    with gr.Row():
                        msg_input = gr.Textbox(
                            label="Message", 
                            placeholder="Enter your question...", 
                            scale=5
                        )
                        submit_btn = gr.Button("Submit", variant="primary", scale=1)

                # Tab 2: Voice
                with gr.TabItem("🎤 Voice Chat"):
                    with gr.Row():
                        audio_input = gr.Audio(sources=["microphone"], type="filepath", label="Record Input")
                    with gr.Row():
                        asr_lang_dropdown = gr.Dropdown(
                            label="Language (ASR & TTS)", 
                            choices=ASR_LANGUAGES, 
                            value="english",
                            interactive=True
                        )
                        voice_submit_btn = gr.Button("Transcribe & Speak", variant="primary")
                    
                    # Output for TTS
                    tts_output = gr.Audio(label="AI Response Audio", interactive=False, autoplay=True)

        # RIGHT: Analysis Panel
        with gr.Column(scale=1):
            level_out = gr.Number(label="Understanding Level", value=3)
            analysis_out = gr.Markdown("Analysis...")
            suggest_out = gr.Textbox(label="Suggestion", lines=6)
            status_out = gr.Markdown("Ready")

    # --- Event Wiring ---
    
    # 1. Start Session
    start_outputs = [student_display, topic_display, chat_id, topic_name_state, chatbot, status_out]
    demo.load(random_start, inputs=None, outputs=start_outputs)
    load_btn.click(random_start, inputs=None, outputs=start_outputs)

    # 2. Text Handler
    chat_inputs = [msg_input, chatbot, chat_id, topic_name_state]
    chat_outputs = [msg_input, chatbot, status_out, level_out, analysis_out, suggest_out]
    
    msg_input.submit(fn=handle_text_chat, inputs=chat_inputs, outputs=chat_outputs)
    submit_btn.click(fn=handle_text_chat, inputs=chat_inputs, outputs=chat_outputs)

    # 3. Voice Handler (Outputs to tts_output as well)
    voice_inputs = [audio_input, asr_lang_dropdown, chatbot, chat_id, topic_name_state]
    voice_outputs = [audio_input, chatbot, status_out, level_out, analysis_out, suggest_out, tts_output]
    
    voice_submit_btn.click(fn=handle_voice_chat, inputs=voice_inputs, outputs=voice_outputs)

if __name__ == "__main__":
    demo.launch(
        server_name="0.0.0.0", 
        server_port=8080, 
        theme=gr.themes.Soft(),
        head=favicon_html,
        css=css
    )
