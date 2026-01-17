import gradio as gr
import requests
import random
import os
import logging
import dwani
import tempfile
import time

# --- Configuration ---
BACKEND_URL = "https://school-server.dwani.ai/"
dwani.api_key = os.getenv("DWANI_API_KEY")
dwani.api_base = os.getenv("DWANI_API_BASE_URL")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if not dwani.api_key:
    logger.warning("⚠️ DWANI_API_KEY not set. Features will fail.")

# Language Options
ASR_LANGUAGES = ["english", "german"]

# --- Helper Functions ---

def random_start():
    try:
        set_types = ["mini_dev", "dev", "eval"]
        selected_set = random.choice(set_types)
        
        s_resp = requests.get(f"{BACKEND_URL}/students", params={"set_type": selected_set}).json()
        students = s_resp.get("students", [])
        if not students: 
            return "❌ Error", "❌ Error", None, "", [], "No students found", 0
        
        student = random.choice(students)
        student_text = f"{student['name']} (Grade {student.get('grade_level', '?')})"
        
        t_resp = requests.get(f"{BACKEND_URL}/students/{student['id']}/topics").json()
        topics = t_resp.get("topics", [])
        if not topics:
            return student_text, "❌ No Topics", None, "", [], "No topics found", 0
            
        topic = random.choice(topics)
        
        payload = {
            "student_id": student['id'], 
            "topic_id": topic['id'],
            "set_type": selected_set
        }
        start_resp = requests.post(f"{BACKEND_URL}/conversations/start", json=payload).json()
        conv_id = start_resp.get("conversation_id")
        
        status_msg = f"🚀 Ready ({selected_set})"
        
        # Reset turn counter to 0 on new session
        return (
            student_text, 
            topic['name'],    
            conv_id,       
            topic['name'], 
            [],            
            status_msg,
            0 
        )
    except Exception as e:
        return "Error", "Error", None, "", [], f"Error: {str(e)}", 0

def transcribe_with_dwani(audio_path, language):
    if not audio_path: return ""
    try:
        logger.info(f"Transcribing {audio_path} in {language}...")
        result = dwani.ASR.transcribe(file_path=audio_path, language=language)
        if isinstance(result, dict):
            return result.get("text") or result.get("transcription") or str(result)
        return str(result)
    except Exception as e:
        logger.error(f"ASR Error: {e}")
        return ""

def speak_response(text, language):
    if not text: return None
    try:
        logger.info(f"Synthesizing speech for: {text[:20]}...")
        response = dwani.Audio.speech(input=text, response_format="mp3", language=language)
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
            temp_file.write(response)
            return temp_file.name
    except Exception as e:
        logger.error(f"TTS Error: {e}")
        return None

# --- Interaction Handlers ---

# Shared Logic
async def process_interaction(message, history, conv_id, topic_name):
    if not conv_id: return history, "No Session", 3, "", "", "No Session"
    
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
            student_response
        )
    except Exception as e:
        return hist_state, f"Error: {str(e)}", 0, "", "", ""


# 1. Text Handler
async def handle_text_chat(message, history, conv_id, topic_name):
    new_hist, status, level, justif, sugg, _ = await process_interaction(message, history, conv_id, topic_name)
    return "", new_hist, status, level, justif, sugg

# 2. Voice Handler (Single Turn)
async def handle_voice_chat(audio_path, language, history, conv_id, topic_name):
    if not audio_path: return None, history, "❌ No Audio", 0, "", "", None
    
    # Transcribe
    transcribed_text = transcribe_with_dwani(audio_path, language)
    if not transcribed_text: return None, history, "❌ Transcription Failed", 0, "", "", None

    # Interact
    new_hist, status, level, justif, sugg, raw_response = await process_interaction(transcribed_text, history, conv_id, topic_name)
    
    # TTS
    audio_response_path = speak_response(raw_response, language)
    
    return None, new_hist, status, level, justif, sugg, audio_response_path

# 3. Real-time Loop Handler
async def handle_rt_turn(audio_path, language, history, conv_id, topic_name, turn_count):
    """
    Handles one turn of the Real-time loop.
    Increments turn count and returns everything needed for the UI update.
    """
    if not conv_id: 
        return history, None, turn_count, "❌ No Session"
    
    if turn_count >= 5:
        return history, None, 5, "🏁 Max turns (5) reached."
        
    if not audio_path:
        return history, None, turn_count, "⚠️ No audio captured"

    # A. Transcribe
    user_text = transcribe_with_dwani(audio_path, language)
    if not user_text:
        return history, None, turn_count, "⚠️ Silence detected"
        
    # B. Interact
    new_hist, status, level, justif, sugg, raw_response = await process_interaction(user_text, history, conv_id, topic_name)
    
    # C. TTS
    ai_audio_path = speak_response(raw_response, language)
    
    # D. Increment Turn
    new_turn_count = turn_count + 1
    
    return new_hist, ai_audio_path, new_turn_count, f"Turn {new_turn_count}/5"


# --- UI Setup ---

favicon_html = """
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧑‍🏫</text></svg>">
"""

# JavaScript to drive the "Record -> Stop (5s) -> Play -> Record" loop
# Note: We rely on the DOM ID 'rt_audio_in' and 'rt_audio_out' to find elements.
# The 'autoplay' attribute on rt_audio_out handles the playing. 
# The 'stop' event on rt_audio_out triggers the next record phase.

js_loop_logic = """
<script>
function startLoop() {
    console.log("Starting Loop...");
    clickRecord();
}

function clickRecord() {
    var audio = document.querySelector('#rt_audio_in');
    var recordBtn = audio.querySelector('button.record');
    
    if (recordBtn) {
        recordBtn.click();
        console.log("Recording started...");
        
        // Stop after 5 seconds
        setTimeout(() => {
            var stopBtn = audio.querySelector('button.stop-recording');
            if (stopBtn) {
                stopBtn.click();
                console.log("Recording stopped (5s timeout).");
            }
        }, 5000);
    } else {
        console.error("Record button not found!");
    }
}

function nextTurn() {
    // Only continue if we haven't reached max turns. 
    // We check the hidden turn counter value via the status text or just blindly try.
    // Ideally we check a state, but for simplicity we just trigger record.
    // The Python backend prevents processing > 5 turns.
    console.log("Audio finished. Triggering next turn...");
    
    // Slight delay to ensure audio element is fully reset
    setTimeout(() => {
        clickRecord();
    }, 1000); 
}
</script>
"""

with gr.Blocks(title="AI Tutor - Realtime", head=favicon_html + js_loop_logic) as demo:
    gr.Markdown("# 🧑‍🏫 AI Tutor - Realtime")
    
    with gr.Row():
        student_display = gr.Textbox(label="Student", interactive=False, scale=2)
        topic_display = gr.Textbox(label="Topic", interactive=False, scale=2)
        load_btn = gr.Button("🎲 Next Random", scale=1)

    # State variables
    chat_id = gr.State()
    topic_name_state = gr.State("")
    turn_counter = gr.State(0)

    with gr.Row():
        # LEFT COLUMN
        with gr.Column(scale=3):
            chatbot = gr.Chatbot(height=450)
            
            with gr.Tabs():
                # Tab 1: Text
                with gr.TabItem("⌨️ Text Chat"):
                    with gr.Row():
                        msg_input = gr.Textbox(label="Message", placeholder="...", scale=5)
                        submit_btn = gr.Button("Submit", variant="primary", scale=1)

                # Tab 2: Voice (Single)
                with gr.TabItem("🎤 Voice (Single Turn)"):
                    with gr.Row():
                        audio_input = gr.Audio(sources=["microphone"], type="filepath", label="Input")
                    with gr.Row():
                        asr_lang = gr.Dropdown(label="Language", choices=ASR_LANGUAGES, value="english")
                        voice_submit = gr.Button("Transcribe & Speak", variant="primary")
                    tts_output = gr.Audio(label="Response", interactive=False, autoplay=True)

                # Tab 3: Real-time Loop
                with gr.TabItem("⚡ Real-time (5 Turns)"):
                    gr.Markdown("**Hands-Free Mode**: 5 seconds recording per turn.")
                    with gr.Row():
                        rt_lang = gr.Dropdown(label="Language", choices=ASR_LANGUAGES, value="english")
                        # JS function 'startLoop' starts the first recording
                        start_loop_btn = gr.Button("▶️ Start Loop", variant="primary")
                    
                    with gr.Row():
                        # Hidden Input (Automated by JS)
                        rt_audio_in = gr.Audio(
                            sources=["microphone"], 
                            type="filepath", 
                            label="Auto-Microphone", 
                            elem_id="rt_audio_in"
                        )
                        # Output (Autoplay triggers 'stop' event when done)
                        rt_audio_out = gr.Audio(
                            label="AI Voice", 
                            elem_id="rt_audio_out", 
                            interactive=False, 
                            autoplay=True
                        )

        # RIGHT COLUMN
        with gr.Column(scale=1):
            level_out = gr.Number(label="Level", value=3)
            analysis_out = gr.Markdown("Analysis...")
            suggest_out = gr.Textbox(label="Suggestion", lines=6)
            status_out = gr.Markdown("Ready")

    # --- Event Wiring ---

    # 1. Session Start
    demo.load(
        random_start, 
        outputs=[student_display, topic_display, chat_id, topic_name_state, chatbot, status_out, turn_counter]
    )
    load_btn.click(
        random_start, 
        outputs=[student_display, topic_display, chat_id, topic_name_state, chatbot, status_out, turn_counter]
    )

    # 2. Text Chat
    chat_io = [msg_input, chatbot, chat_id, topic_name_state]
    msg_input.submit(fn=handle_text_chat, inputs=chat_io, outputs=[msg_input, chatbot, status_out, level_out, analysis_out, suggest_out])
    submit_btn.click(fn=handle_text_chat, inputs=chat_io, outputs=[msg_input, chatbot, status_out, level_out, analysis_out, suggest_out])

    # 3. Voice (Single)
    voice_io = [audio_input, asr_lang, chatbot, chat_id, topic_name_state]
    voice_submit.click(
        fn=handle_voice_chat, 
        inputs=voice_io, 
        outputs=[audio_input, chatbot, status_out, level_out, analysis_out, suggest_out, tts_output]
    )

    # 4. Real-time Loop Events
    
    # A. Start Button -> Triggers JS startLoop()
    start_loop_btn.click(fn=None, js="startLoop")

    # B. Audio Input 'stop_recording' -> Calls Backend
    # This fires when the 5s JS timeout clicks the stop button.
    process_event = rt_audio_in.stop_recording(
        fn=handle_rt_turn,
        inputs=[rt_audio_in, rt_lang, chatbot, chat_id, topic_name_state, turn_counter],
        outputs=[chatbot, rt_audio_out, turn_counter, status_out]
    )

    # C. Audio Output 'stop' (Playback Finished) -> Triggers JS nextTurn()
    # This fires when the AI response finishes playing.
    rt_audio_out.stop(fn=None, js="nextTurn")


if __name__ == "__main__":
    demo.launch(
        server_name="0.0.0.0", 
        server_port=8080, 
        theme=gr.themes.Soft()
    )
