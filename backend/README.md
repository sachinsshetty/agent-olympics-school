school - ಶಾಲೆ - Server

--

1. Set env vars
```bash
export TUTOR_API_KEY="your-team-key-here"
export TUTOR_API_BASE_URL="https://actual-api-base-url"
export DWANI_API_BASE_URL="https://actual-api-base-url"
```
2. Install libraries : python3.10
```bash
python3.10 -m venv venv
source venv/bin/activate

pip install --upgrade pip setuptools wheel
pip install --no-deps   torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

pip install -r requirements.txt
```

3. Run the server
```bash
uvicorn main:app --reload
```

- Docker Steps
```bash
docker build -t dwani/school-server:latest -f Dockerfile .

docker compose -f compose.yml up -d
```

--

- server API : https://knowunity-agent-olympics-2026-api.vercel.app

- Leaderboard Submit
    - uvicorn phack:app --reload
