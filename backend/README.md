school - ಶಾಲೆ

- Agent Olympic Hackathon : Munich 2026

--

# 1. Set env vars
export SIM_TEAM_API_KEY="your-team-key-here"
export SIM_API_BASE="https://actual-api-base-url"

# 2. pip install fastapi uvicorn pydantic httpx python-dotenv

# 3. uvicorn main:app --reload

# 4. Test endpoints:
curl -X POST "http://localhost:8000/quick-chat" -H "Content-Type: application/json"
curl -X POST "http://localhost:8000/start" -d '{"settype": "dev"}'
curl -X POST "http://localhost:8000/send" -d '{"conversation_id": "uuid", "message": "Hello!"}'

