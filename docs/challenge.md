Tutoring Challenge - Understanding Students

Build AI tutors that infer student understanding through interaction and teach adaptively.

## The Task

1. **Infer** – Chat with simulated K12 students to determine their understanding level (1-5)
2. **Tutor** – Provide personalized teaching adapted to the student's understanding level and personality
3. **Score** – Get evaluated on prediction accuracy (MSE) and tutoring quality (LLM judge)

Understanding Levels

1 - Struggling – needs fundamentals
2 - Below grade – frequent mistakes
3 - At grade – core concepts ok
4 - Above grade – occasional gaps
5 - Advanced – ready for more

## API

📚 **Docs**: [knowunity-agent-olympics-2026-api.vercel.app/docs](https://knowunity-agent-olympics-2026-api.vercel.app/docs)

### Auth

All requests require `X-Api-Key` header with your team's API key.

**To get your API key**: Register with us and we'll set up your team credentials.