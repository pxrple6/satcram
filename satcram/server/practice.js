import { recordOpenAIUsage } from './usageBudget.js'
import { readJsonBody } from './analyze.js'

const PRACTICE_SYSTEM = `Create ORIGINAL, SAT-aligned Digital SAT practice questions. Never copy, quote, or closely paraphrase College Board, Khan Academy, or paid-prep questions.

Return only JSON with this shape:
{"questions":[{"id":string,"subject":"Math"|"Reading"|"Writing","topic":string,"difficulty":"Medium"|"Hard","difficultyRating":number,"styleTag":string,"prompt":string,"choices":string[],"answer":string,"explanation":string}]}

Make exactly 10 multiple-choice questions. Use four plausible choices per question, exactly one correct choice, and include the exact answer string in choices. Match the reasoning and wording complexity of a current digital SAT question at roughly the 60th percentile or above; use multi-step reasoning, realistic distractors, and common misconception traps. Do not create trivial arithmetic drills.

Every question must have a UNIQUE styleTag. A styleTag describes its reasoning format, for example "equation-from-context", "nonlinear-model-interpretation", "data-table-inference", "function-composition", "rhetorical-synthesis", "words-in-context", "transition-logic", or "evidence-pair". Do not repeat a styleTag in the set, and do not use any recently used styleTag supplied by the user. Vary the representation as well as the topic: use prose scenarios, tables described in text, graphs described in text, paired statements, and concise passages when appropriate. When multiple focus topics are supplied, distribute questions across them and include no more than three questions for any one topic. Math must use $...$ delimiters for every expression. Set difficultyRating from 3 to 5, where 3 is solid SAT medium and 5 is demanding SAT hard. Explanations should identify the decisive reasoning step in 1-3 sentences.`

export async function generatePracticeWithOpenAI({ subject, topic, topics, recentStyleTags }, apiKey) {
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
        { role: 'user', content: JSON.stringify({ subject: subject || 'Mixed SAT', primaryTopic: topic || 'Mixed SAT skills', focusTopics: Array.isArray(topics) ? topics.slice(0, 4) : [], recentlyUsedStyles: Array.isArray(recentStyleTags) ? recentStyleTags.slice(0, 80) : [], goal: 'a fresh adaptive practice set with genuinely different reasoning styles and topic coverage' }) },
      ],
    }),
  })
  if (!response.ok) throw new Error(`OpenAI request failed (${response.status}): ${await response.text()}`)
  const data = await response.json()
  const questions = JSON.parse(data.choices[0].message.content).questions
  const styles = questions?.map((q) => q.styleTag?.trim().toLowerCase()) || []
  if (!Array.isArray(questions) || questions.length !== 10 || new Set(styles).size !== 10 || styles.some((style) => !style) || questions.some((q) => !q.prompt || !['Medium', 'Hard'].includes(q.difficulty) || !Number.isFinite(q.difficultyRating) || q.difficultyRating < 3 || q.difficultyRating > 5 || !Array.isArray(q.choices) || q.choices.length !== 4 || !q.choices.includes(q.answer))) {
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
