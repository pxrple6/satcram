import { recordOpenAIUsage } from './usageBudget.js'
import { readJsonBody } from './analyze.js'

const PRACTICE_SYSTEM = `Create ORIGINAL, SAT-aligned Digital SAT practice questions. Never copy, quote, or closely paraphrase College Board, Khan Academy, or paid-prep questions.

Return only JSON with this shape:
{"questions":[{"id":string,"subject":"Math"|"Reading"|"Writing","topic":string,"difficulty":"Medium"|"Hard","difficultyRating":number,"styleTag":string,"representation":"scenario"|"equation"|"table"|"graph"|"passage"|"paired-claims"|"sentence-edit"|"notes","prompt":string,"choices":string[],"answer":string,"explanation":string}]}

Make exactly 10 multiple-choice questions. Use four plausible choices per question, exactly one correct choice, and include the exact answer string in choices. Match the reasoning and wording complexity of a current digital SAT question at roughly the 60th percentile or above; use multi-step reasoning, realistic distractors, and common misconception traps. Do not create trivial arithmetic drills. For a Mixed SAT set, include exactly 4 Math, 3 Reading, and 3 Writing questions. For a single-subject set, cover at least 4 distinct topics. Never include more than two questions from the same topic.

Every question must have a UNIQUE styleTag. A styleTag describes its reasoning format, for example "equation-from-context", "nonlinear-model-interpretation", "data-table-inference", "function-composition", "rhetorical-synthesis", "words-in-context", "transition-logic", or "evidence-pair". Do not repeat a styleTag in the set, and do not use any recently used styleTag supplied by the user.

Use at least FIVE different representation values in every set and never use one representation more than twice. Changing the numbers or story around the same algebraic solve is NOT a new representation or reasoning style. In particular, never put more than two questions whose main task is solving a linear equation, even if their topics or styleTags are worded differently. Mix prose scenarios, tables, graphs, paired claims, passages, editing decisions, and notes as appropriate. When four or more focus topics are supplied, use at least four distinct topics in the set and no more than two questions for any one topic; the primary topic is a priority, not permission to make a single-topic set. Math must use $...$ delimiters for every expression. Set difficultyRating from 3 to 5, where 3 is solid SAT medium and 5 is demanding SAT hard. Explanations should identify the decisive reasoning step in 1-3 sentences.`

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
  const previouslyUsedStyles = new Set((Array.isArray(recentStyleTags) ? recentStyleTags : []).map((style) => String(style).trim().toLowerCase()))
  const subjects = questions?.reduce((counts, question) => ({ ...counts, [question.subject]: (counts[question.subject] || 0) + 1 }), {}) || {}
  const topicCounts = questions?.reduce((counts, question) => ({ ...counts, [question.topic]: (counts[question.topic] || 0) + 1 }), {}) || {}
  const representationCounts = questions?.reduce((counts, question) => ({ ...counts, [question.representation]: (counts[question.representation] || 0) + 1 }), {}) || {}
  const allowedRepresentations = new Set(['scenario', 'equation', 'table', 'graph', 'passage', 'paired-claims', 'sentence-edit', 'notes'])
  const mixed = !subject || subject === 'Mixed SAT'
  const enoughTopics = mixed ? Object.keys(topicCounts).length >= 6 : Object.keys(topicCounts).length >= 4
  const diverseRepresentations = Object.keys(representationCounts).length >= 5 && Object.entries(representationCounts).every(([name, count]) => allowedRepresentations.has(name) && count <= 2)
  const linearSolves = questions?.filter((q) => /linear/i.test(q.topic) && q.representation === 'equation').length || 0
  if (!Array.isArray(questions) || questions.length !== 10 || new Set(styles).size !== 10 || styles.some((style) => !style || previouslyUsedStyles.has(style)) || !enoughTopics || !diverseRepresentations || linearSolves > 2 || Object.values(topicCounts).some((count) => count > 2) || (mixed && (subjects.Math !== 4 || subjects.Reading !== 3 || subjects.Writing !== 3)) || questions.some((q) => !q.prompt || !['Medium', 'Hard'].includes(q.difficulty) || !Number.isFinite(q.difficultyRating) || q.difficultyRating < 3 || q.difficultyRating > 5 || !Array.isArray(q.choices) || q.choices.length !== 4 || !q.choices.includes(q.answer))) {
    throw new Error('Generated practice set did not pass validation. Please try again.')
  }
  return { questions, usage: data.usage }
}

export async function handlePracticeRequest(req, res, apiKey, usageKey) {
  try {
    const body = await readJsonBody(req)
    const result = await generatePracticeWithOpenAI(body, apiKey)
    recordOpenAIUsage(usageKey, result.usage)
    const payload = { questions: result.questions }
    if (typeof res.json === 'function') return res.json(payload)
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(payload))
  } catch (err) {
    console.error('[practice]', err.message)
    const payload = { error: err.message || 'Could not create practice set.' }
    if (typeof res.status === 'function') return res.status(500).json(payload)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(payload))
  }
}
