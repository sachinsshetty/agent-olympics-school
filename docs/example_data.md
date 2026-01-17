curl -X 'POST' \
  'https://school-server.dwani.ai/conversations/interact' \
  -H 'Content-Type: application/json' \
  -d '{
  "conversation_id": "2b511e36-105c-4845-8da6-efce2a8a2cc1",
  "tutor_message": "What is the slope of this line?",
  "topic_name": "Linear Equations",
  "history": [
  ]                                                         
}'                                                

{"student_response":"Wait, I don't see a graph or an equation... did you forget to show me the line? Lol. Which one are we looking at?","turn_number":1,"is_complete":false,"analysis":{"understanding_level":2,"justification":"The student is confused about the context and asks for clarification about which line to analyze, indicating a lack of familiarity with the task. This suggests partial understanding and frequent mistakes in interpreting the problem, as they are unable to proceed without explicit direction.","evidence":["Student asks 'did you forget to show me the line?' indicating confusion about the task setup.","Student uses 'Lol' which may indicate disengagement or frustration, not confidence in understanding.","Student does not attempt to recall or apply prior knowledge of slope calculation without visual or algebraic input."]},"suggestion":{"suggested_response":"Hey, no worries — let’s make sure we’re on the same page! I’ll show you the equation and graph we’re working with. For now, let’s start with this equation: y = 2x + 1. I’ll draw the graph right here — or you can sketch it on your paper. What do you notice about the line? Where does it cross the y-axis? What happens when x = 0?","strategy_note":"Clarify the context and scaffold with a concrete example to rebuild confidence. Use the equation to anchor the discussion and prompt observation-based reasoning."}}