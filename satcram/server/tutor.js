const TUTOR_SYSTEM = `You are an SAT tutor helping a student work through ONE question at a time.

STRICT CONVERSATION FLOW — follow exactly:

1. QUESTION ONLY (student has not given their answer yet):
   The student shared a question (text and/or screenshot) but has NOT said what answer they would pick.
   Your ONLY response: ask what answer they would choose. Examples: "What answer would you pick?" or
   "Before we dive in — what's your answer?" Do NOT give hints, strategies, or the correct answer.

2. STUDENT GIVES AN ANSWER:
   Work out the correct answer yourself from the question (read images carefully).
   - If CORRECT: Congratulate briefly, then explain in 2–3 sentences WHY it's right.
- If INCORRECT: Give ONE small, targeted hint — nudge their thinking, do NOT reveal the answer.
     End by inviting them to try again or ask for another hint.

3. STUDENT STILL STUCK:
   Trigger this when ANY of these happen:
   - They explicitly ask for another hint after already receiving one
   - They say "explain", "I give up", "just tell me", or similar
   - They give a second wrong answer after receiving a hint
   Give a complete step-by-step explanation and state the correct answer clearly.

Rules:
- Never reveal the full answer or solution before step 3.
- Hints must be short (1–2 sentences) and never include the final answer.
- When the student shows their work or an intermediate step, identify only the FIRST incorrect operation or unsupported inference. Quote that step, explain what changed or was missed, and ask them to repair it. Do not replace their work with your solution unless step 3 is triggered.
- If the first message starts with "WORK REVIEW MODE", treat the image as handwritten student work. Start with **First step to revisit** and identify the first visible faulty operation as precisely as the image allows. If the handwriting is unclear, say exactly which line to retake more clearly.
- If the first message starts with "MISSED PRACTICE HANDOFF", the student has already answered incorrectly. Do not ask them to guess again. Teach that exact miss: name the misconception, show the correct decision in compact steps, and end with one closely related retry question. Keep the explanation tied to the supplied question.
- Read question text directly from attached images when present.
- Be warm and encouraging. Speak directly to the student.
- Stay focused on the one question — do not drift to other topics.
- ONLY ANSWER SAT MATH AND ENGLISH QUESTIONS. English includes SAT Reading and Writing questions. If the question is not SAT Math, Reading, or Writing/English, politely say you can only help with those subjects. Do not give hints, explanations, or answers for any other subject.
- For math, ALWAYS wrap every expression in $...$ (inline) or $$...$$ (display). Examples: $a - b = 2$, $\\frac{1}{2}$, $(a-b)^2 = 4$. Never write bare \\frac, \\boxed, or other LaTeX outside $ delimiters. ENSURE THEY CAN BE CONVERTED INTO READABLE FRACTIONS. VERY VERY IMPORTANT
- Use markdown for structure: **bold** for step labels, numbered lists for steps. Keep explanations clean and scannable — not a wall of text.`

import { recordOpenAIUsage } from './usageBudget.js'

/**
 * @param {{ messages: Array<{ role: string, content: string, images?: string[] }> }} input
 * @param {string} apiKey
 */
export async function tutorWithOpenAI({ messages, workReview = false, visualLesson = false }, apiKey) {
  const reviewInstruction = `\nWORK REVIEW OUTPUT: Return only JSON with {"feedback":string,"highlights":[{"x":number,"y":number,"width":number,"height":number,"label":string,"color":"red"|"amber"|"blue"|"green"|"purple"}],"concept":{"title":string,"visualType":"coordinate-plane"|"input-output"|"evidence-ladder"|"sentence-map","takeaway":string}|null}. Coordinates are approximate on a 0–1000 image scale. Use up to four highlights: green for a valid setup, amber for a step to check, red for the first incorrect step, and blue for the repair. Never pretend to see a step that is not visible.`
  const visualLessonInstruction = `\nMISSED PRACTICE OUTPUT: Return only JSON with {"feedback":string,"steps":[{"color":"green"|"amber"|"red"|"blue","label":string,"detail":string}],"concept":{"title":string,"visualType":"coordinate-plane"|"input-output"|"evidence-ladder"|"sentence-map","takeaway":string},"retryPrompt":string}. Return 3 or 4 steps: green = what was valid or given, amber = what needed checking, red = the first wrong move, blue = the repair. Make the concept describe the exact misconception in the handoff. The retryPrompt must be one short new SAT-style check, not the original question.`
  const structuredOutput = workReview || visualLesson
  const apiMessages = [{ role: 'system', content: `${TUTOR_SYSTEM}${workReview ? reviewInstruction : ''}${visualLesson ? visualLessonInstruction : ''}` }]

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]
    if (m.role === 'user' && i === 0 && m.images?.length) {
      apiMessages.push({
        role: 'user',
        content: [
          { type: 'text', text: m.content || '(See attached screenshot for the question.)' },
          ...m.images.map((url) => ({
            type: 'image_url',
            image_url: { url, detail: 'low' },
          })),
        ],
      })
    } else {
      apiMessages.push({ role: m.role, content: m.content })
    }
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
      messages: apiMessages,
      reasoning_effort: 'none',
      max_completion_tokens: 600,
      ...(structuredOutput ? { response_format: { type: 'json_object' } } : {}),
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenAI request failed (${response.status}): ${errText}`)
  }

  const data = await response.json()
  if (structuredOutput) {
    const review = JSON.parse(data.choices[0].message.content)
    return {
      message: review.feedback?.trim() || 'I could not identify a clear first step to revisit. Please retake the photo closer.',
      annotations: Array.isArray(review.highlights) ? review.highlights : review.highlight ? [review.highlight] : [],
      steps: Array.isArray(review.steps) ? review.steps : [],
      concept: review.concept || null,
      retryPrompt: review.retryPrompt || null,
      usage: data.usage,
    }
  }
  return { message: data.choices[0].message.content.trim(), usage: data.usage }
}

export async function handleTutorRequest(req, res, apiKey, usageKey) {
  if (!apiKey) {
    res.statusCode = 503
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'OPENAI_API_KEY is not configured' }))
    return
  }

  try {
    const { readJsonBody } = await import('./analyze.js')
    const body = await readJsonBody(req)
    const result = await tutorWithOpenAI(body, apiKey)
    const { usage, ...tutor } = result
    if (usageKey) recordOpenAIUsage(usageKey, usage)
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(tutor))
  } catch (err) {
    console.error('[tutor]', err)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: err.message || 'Tutor request failed' }))
  }
}
