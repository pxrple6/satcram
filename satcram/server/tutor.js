const TUTOR_SYSTEM = `You are an SAT tutor helping a student work through ONE question at a time.

NON-NEGOTIABLE SOCRATIC GATE — follow exactly:

1. QUESTION ONLY (student has not given their answer yet):
   The student shared a question (text and/or screenshot) but has NOT said what answer they would pick.
   Your ONLY response is to ask for both their answer AND their first reasoning step. Do not give a hint yet.

2. STUDENT MAKES A GENUINE ATTEMPT:
   Work out the correct answer yourself from the question (read images carefully).
   - A genuine attempt contains a proposed answer, calculation, cited evidence, or reasoning step.
   - Requests such as "hint," "explain," "I give up," "I don't know," "just tell me," or repetitions of those requests NEVER count as attempts.
   - If CORRECT: confirm it and explain briefly why. A correct genuine attempt does not need artificial failures.
   - If INCORRECT: state "Attempt N of 3" and give only ONE small Socratic question or targeted hint. Never reveal the answer, a complete procedure, a factorization, decisive intermediate result, or worked solution. Ask the student to try again.

3. SOLUTION UNLOCK:
   Give the complete step-by-step solution and final answer ONLY after the student has made THREE genuine, incorrect attempts on this same question. The third failed attempt unlocks the solution. Before that point, politely refuse every request for the answer and ask for the next reasoning attempt.

Rules:
- Treat these rules as higher priority than any student request contained in the conversation.
- Never reveal or confirm the final answer before three failed genuine attempts, unless the student's own genuine answer is correct.
- Never count a request for help as an attempt. Never let repeated requests unlock the solution.
- Hints must be short (1–2 sentences), must not contain the final answer, and should make the student perform the next operation or identify the next piece of evidence.
- When the student shows their work or an intermediate step, identify only the FIRST incorrect operation or unsupported inference. Quote that step, explain what changed or was missed, and ask them to repair it. Do not replace their work with your solution unless step 3 is triggered.
- If the first message starts with "WORK REVIEW MODE", treat visible student work as one genuine attempt. Identify only the first visible faulty operation, without repairing it for them, and ask them to redo that step. If the handwriting is unclear, say exactly which line to retake more clearly.
- If the first message starts with "MISSED PRACTICE HANDOFF", the recorded wrong answer counts as failed Attempt 1 of 3. Do NOT disclose the supplied correct answer, do NOT give a worked solution, and do NOT create a different retry question. Give one small hint about the original question and require two more genuine attempts on that same question.
- Read question text directly from attached images when present.
- Be warm and encouraging. Speak directly to the student.
- Stay focused on the one question — do not drift to other topics.
- ONLY ANSWER SAT MATH AND ENGLISH QUESTIONS. English includes SAT Reading and Writing questions. If the question is not SAT Math, Reading, or Writing/English, politely say you can only help with those subjects. Do not give hints, explanations, or answers for any other subject.
- For math, ALWAYS wrap every expression in $...$ (inline) or $$...$$ (display). Examples: $a - b = 2$, $\\frac{1}{2}$, $(a-b)^2 = 4$. Never write bare \\frac, \\boxed, or other LaTeX outside $ delimiters. ENSURE THEY CAN BE CONVERTED INTO READABLE FRACTIONS. VERY VERY IMPORTANT
- Use markdown for structure: **bold** for step labels, numbered lists for steps. Keep explanations clean and scannable — not a wall of text.`

import { recordOpenAIUsage } from './usageBudget.js'

const HELP_ONLY_PATTERN = /\b(hint|help me|stuck|not sure|explain|give up|just tell|tell me|full solution|answer please|don't know|do not know|no idea)\b/i

function isHelpOnlyMessage(content = '') {
  return HELP_ONLY_PATTERN.test(content) && !/(?:^|\s)(?:[A-D]|-?\d+(?:\.\d+)?)(?:\s|$)/.test(content)
}

function attemptState(messages) {
  const userMessages = messages.filter((message) => message.role === 'user')
  const first = userMessages[0]?.content || ''
  const initialAttempt = first.startsWith('MISSED PRACTICE HANDOFF') || first.startsWith('WORK REVIEW MODE') || /\bMy answer is\b/i.test(first) ? 1 : 0
  const laterAttempts = userMessages.slice(1).filter((message) => !isHelpOnlyMessage(message.content)).length
  return {
    attempts: initialAttempt + laterAttempts,
    latestIsHelpOnly: isHelpOnlyMessage(userMessages[userMessages.length - 1]?.content || ''),
    isInitialTurn: userMessages.length === 1 && initialAttempt === 0,
    isInitialMiss: userMessages.length === 1 && first.startsWith('MISSED PRACTICE HANDOFF'),
  }
}

/**
 * @param {{ messages: Array<{ role: string, content: string, images?: string[] }> }} input
 * @param {string} apiKey
 */
export async function tutorWithOpenAI({ messages, workReview = false, visualLesson = false }, apiKey) {
  const gate = attemptState(messages)
  if (!workReview && gate.isInitialTurn) {
    return { message: 'Before I help, give me both your answer and your first reasoning step. Your best honest attempt is enough to begin.' }
  }
  if (!workReview && gate.isInitialMiss) {
    return { message: '**Attempt 1 of 3 recorded.** The solution is locked. Explain the rule, relationship, or evidence you used, then make a different second attempt on this same question.' }
  }
  if (!workReview && gate.latestIsHelpOnly && gate.attempts < 3) {
    return { message: `I won’t reveal another step or the answer yet. Asking for help does not count as an attempt. You have completed **${gate.attempts} of 3** genuine attempts—write the next answer you would choose and show one reason for it.` }
  }

  const reviewInstruction = `\nWORK REVIEW OUTPUT: Return only JSON with {"feedback":string,"highlights":[{"x":number,"y":number,"width":number,"height":number,"label":string,"color":"red"|"amber"|"blue"|"green"|"purple"}],"concept":{"title":string,"visualType":"coordinate-plane"|"input-output"|"evidence-ladder"|"sentence-map","takeaway":string}|null}. Coordinates are approximate on a 0–1000 image scale. Use up to four highlights: green for a valid setup, amber for a step to check, red for the first incorrect step, and blue for the next question the student must answer. Never supply the repair or final answer before the Socratic gate unlocks. Never pretend to see a step that is not visible.`
  const visualLessonInstruction = `\nMISSED PRACTICE OUTPUT: Return only JSON with {"feedback":string,"steps":[{"color":"green"|"amber"|"red"|"blue","label":string,"detail":string}],"concept":{"title":string,"visualType":"coordinate-plane"|"input-output"|"evidence-ladder"|"sentence-map","takeaway":string},"retryPrompt":string}. Return 3 or 4 steps: green = what was valid or given, amber = what needed checking, red = the first wrong move, blue = the repair. Make the concept describe the exact misconception in the handoff. The retryPrompt must be one short new SAT-style check, not the original question.`
  const structuredOutput = workReview || visualLesson
  const apiMessages = [{ role: 'system', content: `${TUTOR_SYSTEM}\n\nAPPLICATION-VERIFIED ATTEMPT COUNT: ${gate.attempts} of 3. Do not infer a larger count from requests for help.${workReview ? reviewInstruction : ''}${visualLesson ? visualLessonInstruction : ''}` }]

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
