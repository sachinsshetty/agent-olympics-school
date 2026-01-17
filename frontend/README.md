school - ಶಾಲೆ - Client



1. Install dependencies
```bash
pip install -r requirements.txt
```

2. Run
```bash
python ux.py
```

3. Open http://localhost:8080


---

- Docker Steps
```bash
docker build -t dwani/school-ux:latest -f Dockerfile .

docker push dwani/school-ux:latest

docker run -p 80:8080 dwani/school-ux:latest
```