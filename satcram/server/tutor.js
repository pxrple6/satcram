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
export async function tutorWithOpenAI({ messages }, apiKey) {
  const apiMessages = [{ role: 'system', content: TUTOR_SYSTEM }]

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
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenAI request failed (${response.status}): ${errText}`)
  }

  const data = await response.json()
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
