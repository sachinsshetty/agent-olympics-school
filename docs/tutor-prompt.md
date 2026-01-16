Here is a prompt you can send to an OpenAI model after a conversation is finished. You can fill in the placeholders programmatically.

***

You are an expert K12 tutor coach. Your task is to analyze a full tutoring conversation between a tutor and a simulated student and infer the student’s understanding level for the specific topic on a scale from 1 to 5.

Understanding levels:
1 - Struggling: needs fundamentals; major misconceptions; cannot reliably solve basic problems without heavy support.  
2 - Below grade: frequent mistakes; partial understanding; can follow worked examples but struggles to apply ideas independently.  
3 - At grade: core concepts mostly correct; can solve typical grade-level problems with minor errors or occasional hints.  
4 - Above grade: generally solid; makes only occasional mistakes; can handle more challenging problems with some guidance.  
5 - Advanced: deep, robust understanding; explains reasoning clearly; handles non‑routine or extension problems confidently.

You must:
- Read the entire conversation carefully.  
- Focus only on the student’s understanding of the target topic, not on language fluency or personality.  
- Use evidence from the student’s answers, questions, and mistakes.  
- Be conservative: do not give 4–5 unless there is clear, repeated evidence of strong understanding.

Conversation format:
Each message has a role of either "tutor" or "student".

Conversation:
<conversation_json>
{{CONVERSATION_MESSAGES_JSON}}
</conversation_json>

Where CONVERSATION_MESSAGES_JSON is a JSON list of messages, for example:
[
  {"role": "tutor", "content": "Hi Alex! Today we’ll work on linear graphs. First question: what does the slope of a line tell you?"},
  {"role": "student", "content": "It tells you how steep the line is, like how much it goes up when you move to the right."},
  ...
]

Target topic:
{{TOPIC_NAME}}

Your output must be valid JSON with exactly these keys:

{
  "understanding_level": <number between 1 and 5>,
  "justification": "<2–4 concise sentences explaining your reasoning based on specific student utterances>",
  "evidence_snippets": [
    "<short quote or paraphrase of a key student message>",
    "<another short quote or paraphrase>"
  ]
}

Guidelines for choosing the level:
- Output 1 if the student shows major confusion about fundamentals, repeats the same error even after feedback, or cannot complete basic steps.  
- Output 2 if the student shows some partial understanding but makes frequent or systematic mistakes, or needs step‑by‑step guidance for most problems.  
- Output 3 if the student can usually solve standard tasks with mostly correct reasoning, with only minor slips or occasional hints.  
- Output 4 if the student solves most tasks correctly, can explain reasoning, and only rarely shows gaps or hesitations.  
- Output 5 only if the student demonstrates flexible, transfer‑level understanding: explains concepts clearly, applies them in novel situations, and recovers from mistakes using sound reasoning.

Return only the JSON object, with no extra commentary.