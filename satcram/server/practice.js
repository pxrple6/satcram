import { recordOpenAIUsage } from './usageBudget.js'
import { readJsonBody } from './analyze.js'

const PRACTICE_SYSTEM = `Create ORIGINAL, SAT-aligned Digital SAT practice questions. Never copy, quote, or closely paraphrase College Board, Khan Academy, or paid-prep questions.

Return only JSON with this shape:
{"questions":[{"id":string,"subject":"Math"|"Reading"|"Writing","topic":string,"difficulty":"Easy"|"Medium"|"Hard","prompt":string,"choices":string[],"answer":string,"explanation":string}]}

Make exactly 10 multiple-choice questions. Use four plausible choices per question, exactly one correct choice, and include the exact answer string in choices. Match the reasoning and wording complexity of a current digital SAT question; do not create trivial arithmetic drills. Math must use $...$ delimiters for every expression. Explanations should identify the decisive reasoning step in 1-3 sentences.`

export async function generatePracticeWithOpenAI({ subject, topic }, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
      response_format: { type: 'json_object' },
      reasoning_effort: 'none',
      max_completion_tokens: 2800,
      messages: [
        { role: 'system', content: PRACTICE_SYSTEM },
        { role: 'user', content: JSON.stringify({ subject: subject || 'Math', topic: topic || 'Mixed SAT skills', goal: 'a fresh adaptive practice set' }) },
      ],
    }),
  })
  if (!response.ok) throw new Error(`OpenAI request failed (${response.status}): ${await response.text()}`)
  const data = await response.json()
  const questions = JSON.parse(data.choices[0].message.content).questions
  if (!Array.isArray(questions) || questions.length !== 10 || questions.some((q) => !q.prompt || !Array.isArray(q.choices) || q.choices.length !== 4 || !q.choices.includes(q.answer))) {
    throw new Error('Generated practice set did not pass validation. Please try again.')
  }
  return { questions, usage: data.usage }
}

export async function handlePracticeRequest(req, res, apiKey, usageKey) {
  try {
    const body = await readJsonBody(req)
    const result = await generatePracticeWithOpenAI(body, apiKey)
    recordOpenAIUsage(usageKey, result.usage)
    res.json({ questions: result.questions })
  } catch (err) {
    console.error('[practice]', err.message)
    res.status(500).json({ error: err.message || 'Could not create practice set.' })
  }
}
