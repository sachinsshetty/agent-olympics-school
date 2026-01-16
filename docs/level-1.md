This challenge is asking you to build a tutor that does two things well:  
1) infer a student’s current level from a chat, and  
2) teach them in a way that fits that level and their personality. [thethinkacademy](https://www.thethinkacademy.com/blog/edubriefs-ai-education-tools-in-k-12-choosing-what-really-works/)

Below is a concrete way to approach it.

## 1. Mental model of the 5 levels

Design an internal rubric you apply while chatting:

- **Level 1 – Struggling**  
  - Cannot recall or apply core definitions or procedures without heavy help.  
  - Makes frequent, fundamental errors (e.g., misreading the question, mixing up operations) and seems confused by small variations.  
  - Needs very small steps, worked examples, and lots of checking for understanding. [nature](https://www.nature.com/articles/s41539-025-00320-7)

- **Level 2 – Below grade**  
  - Has some basics but is inconsistent; can sometimes solve problems but with many mistakes or hints.  
  - Shows partial understanding but quickly gets stuck when problems are not “template-like”.  
  - Needs review of key prerequisites plus guided practice on grade-level tasks. [nature](https://www.nature.com/articles/s41539-025-00320-7)

- **Level 3 – At grade**  
  - Handles standard tasks similar to what they see in class.  
  - Makes occasional errors but can correct with light prompting or feedback.  
  - Ready for mixed practice at grade level and moderate challenge. [park](https://www.park.edu/blog/ai-in-education-the-rise-of-intelligent-tutoring-systems/)

- **Level 4 – Above grade**  
  - Solves typical problems quickly and accurately.  
  - Can explain reasoning but may miss edge cases or more abstract extensions.  
  - Benefits from challenge problems, “why does this work?” questions, and multi‑step tasks. [nature](https://www.nature.com/articles/s41539-025-00320-7)

- **Level 5 – Advanced**  
  - Works efficiently, generalizes patterns, and explains concepts clearly.  
  - Asks deeper questions or explores beyond the assignment.  
  - Ready for enrichment: proofs, multiple solution methods, connections to new topics. [park](https://www.park.edu/blog/ai-in-education-the-rise-of-intelligent-tutoring-systems/)

## 2. How to infer the student’s level in chat

When you first interact, your goal is to quickly gather evidence on:

- Accuracy: Do they solve representative problems correctly?
- Independence: How much help do they need?
- Reasoning: Can they explain the steps in their own words?
- Transfer: Can they handle a twist on the same concept?
- Metacognition & affect: Do they notice mistakes, express confusion, or overconfidence? [nature](https://www.nature.com/articles/s41539-025-00320-7)

A practical pattern:

1. **Start with a friendly diagnostic question**  
   - Ask one or two problems that are slightly easier than grade level to avoid immediate frustration and to get a clean read on fundamentals.  
   - Example: “Show me how you’d solve this step by step.”  

2. **Probe explanation, not just answers**  
   - Follow up: “Why did you choose that step?” or “Can you explain this in your own words?”  
   - Students who give only final answers without explanation are harder to place; gently insist on reasoning. [thethinkacademy](https://www.thethinkacademy.com/blog/edubriefs-ai-education-tools-in-k-12-choosing-what-really-works/)

3. **Introduce a small variation**  
   - Change numbers, context, or representation (e.g., word problem vs. equation) and see whether they still succeed.  
   - This helps distinguish memorized procedures (often Level 2–3) from flexible understanding (Level 4–5). [nature](https://www.nature.com/articles/s41539-025-00320-7)

4. **Watch for error patterns**  
   - Systematic misunderstandings (e.g., always adding instead of multiplying in proportional situations) suggest Level 1–2.  
   - Occasional slips but correct strategy suggest Level 3–4. [nature](https://www.nature.com/articles/s41539-025-00320-7)

5. **Map evidence to a 1–5 prediction**  
   - After 2–4 exchanges with explanation and a variation, pick the level that best matches your rubric.  
   - You can phrase your internal logic as: “Given their accuracy, independence, and flexibility on the last few tasks, they are most consistent with Level X.”

## 3. Adapting your teaching to the level

Once you have a working estimate, switch into tutoring mode that fits that level and adjust as you see new evidence. AI tutors that adapt difficulty and support like this have been shown to improve K‑12 learning outcomes. [park](https://www.park.edu/blog/ai-in-education-the-rise-of-intelligent-tutoring-systems/)

### Level 1 – Struggling

- Goals: Build missing foundations, reduce anxiety, and create quick wins.  
- Strategies:
  - Use very simple language and short steps.  
  - Start with prerequisite skills, even if they seem “too easy”.  
  - Work through examples together, then gradually let them fill in missing steps.  
  - Ask concrete check questions: “What does this symbol mean here?”  
  - Give lots of encouragement for partial progress. [thethinkacademy](https://www.thethinkacademy.com/blog/edubriefs-ai-education-tools-in-k-12-choosing-what-really-works/)

### Level 2 – Below grade

- Goals: Solidify basics, move them toward independence on core grade content.  
- Strategies:
  - Diagnose 1–2 key misconceptions and address them explicitly.  
  - Use guided practice: “You try the next one; I’ll step in if you get stuck.”  
  - Compare correct vs. incorrect reasoning and ask which one makes sense and why.  
  - Periodically return to earlier mistakes to see if they’ve improved. [nature](https://www.nature.com/articles/s41539-025-00320-7)

### Level 3 – At grade

- Goals: Strengthen fluency and confidence, introduce moderate challenge.  
- Strategies:
  - Use standard grade-level problems, then ask “Can we solve this in a different way?”  
  - Encourage self-explanation: “Talk me through your steps.”  
  - Provide immediate, specific feedback but let them struggle briefly before helping.  
  - Introduce one slightly harder problem to test readiness for Level 4. [park](https://www.park.edu/blog/ai-in-education-the-rise-of-intelligent-tutoring-systems/)

### Level 4 – Above grade

- Goals: Fill occasional gaps, prevent boredom, and deepen conceptual understanding.  
- Strategies:
  - Offer challenge variants, multi-step problems, and “what if” questions.  
  - Ask more conceptual prompts: “Why does this method work in general?”  
  - Let them choose between paths: “Do you want a harder puzzle or an application problem?”  
  - Briefly revisit any revealed gaps, then return to challenging work. [nature](https://www.nature.com/articles/s41539-025-00320-7)

### Level 5 – Advanced

- Goals: Enrichment, breadth, and depth.  
- Strategies:
  - Pose open-ended problems, proofs, or real-world applications.  
  - Invite them to design examples, counterexamples, or their own problems.  
  - Encourage reflection on strategies: “Which method is more efficient and why?”  
  - Connect current topic to more advanced ideas or future courses. [park](https://www.park.edu/blog/ai-in-education-the-rise-of-intelligent-tutoring-systems/)

## 4. Adapting to personality and affect

Students differ not only in skill but also in how they like to interact.

- Anxious or shy students  
  - Use a warm tone, small steps, and lots of reassurance.  
  - Avoid calling their work “wrong”; instead use “not yet” or “let’s fix this part.” [thethinkacademy](https://www.thethinkacademy.com/blog/edubriefs-ai-education-tools-in-k-12-choosing-what-really-works/)

- Overconfident students  
  - Respect their confidence but gently test depth with non-routine questions.  
  - Ask for explanations and emphasize the value of catching one’s own mistakes. [park](https://www.park.edu/blog/ai-in-education-the-rise-of-intelligent-tutoring-systems/)

- Curious and talkative students  
  - Invite questions and side explorations but keep an eye on goals.  
  - Use their interests in examples or contexts when possible. [hunt-institute](https://hunt-institute.org/resources/2025/06/ai-tutoring-alpha-school-personalized-learning-technology-k-12-education/)

- Quiet but capable students  
  - Ask targeted, specific questions that require short but meaningful answers.  
  - Use written explanations and structured prompts instead of very open questions. [nature](https://www.nature.com/articles/s41539-025-00320-7)

## 5. Tactics to improve MSE and judged tutoring quality

To do well on the competition’s metrics, bake in a few habits:

- For better understanding predictions (lower MSE):
  - Always run a brief diagnostic sequence before committing to a level.  
  - Update your internal estimate if later evidence contradicts your first impression.  
  - Prefer the level whose description matches multiple observed behaviors, not just one. [nature](https://www.nature.com/articles/s41539-025-00320-7)

- For better tutoring quality (LLM judge):
  - Be student-centered: acknowledge feelings, ask what they find hard, and offer choices.  
  - Use clear step-by-step reasoning and frequent checks for understanding.  
  - Avoid giving full solutions immediately; scaffold instead.  
  - End short segments with a quick recap of the idea they just learned and a small success. [thethinkacademy](https://www.thethinkacademy.com/blog/edubriefs-ai-education-tools-in-k-12-choosing-what-really-works/)

If you share an example student interaction (their messages and what you responded or plan to respond), a more tailored script for inferring their level and adapting your tutoring style can be drafted.