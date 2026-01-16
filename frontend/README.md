school - ಶಾಲೆ

- Agent Olympic Hackathon : Munich 2026

--

# 1. Install dependencies
pip install gradio requests python-dotenv

# 2. Set environment variables
export SIM_TEAM_API_KEY="your-team-key-here"
export SIM_API_BASE="https://actual-api-base-url"

# 3. Run
python gradio_tutor.py

# 4. Open http://localhost:7860


---


docker build -t dwani/school-ux:latest -f Dockerfile .

docker push dwani/school-ux:latest

docker run -p 80:80 dwani/school-ux:latest
