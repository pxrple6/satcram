const SYSTEM_PROMPT = `You are an SAT diagnostic engine. Given a missed question (as text
and/or one or more screenshots), the student's answer, and the correct answer, return ONLY
a JSON object (no prose, no markdown fences) with this exact shape:

{
  "subject": "Math" | "Reading" | "Writing",
  "domain": string,
  "topic": string,
  "questionType": string,
  "correctness": "Correct" | "Incorrect",
  "reason": string,
  "confidence": "High" | "Medium" | "Low",
  "estimatedSkill": number,
  "pattern": string | null
}

SAT categorization rules:
- subject: "Math" for any math question; "Reading" for passage comprehension; "Writing" for grammar/rhetoric/editing
- domain: use official College Board domain names:
  Math → "Heart of Algebra" | "Passport to Advanced Math" | "Problem Solving & Data Analysis" | "Additional Topics"
  Reading → "Information & Ideas" | "Craft & Structure"
  Writing → "Standard English Conventions" | "Expression of Ideas"
- topic: pick the most specific skill, e.g. "Linear Equations", "Inference", "Punctuation", "Quadratics", "Transitions"
- questionType: a short label like "Two-variable linear equation" or "Comma splice identification"

If images are attached, read the question directly from them — do not assume the
provided question text is complete on its own. Use the subject/topic hints when provided,
but override them if the image clearly shows a different topic.`

/**
 * @param {object} input
 * @param {string} apiKey
 */
export async function analyzeWithOpenAI(input, apiKey) {
  const { questionText, studentAnswer, correctAnswer, subject, topic, topicHint, images } = input

  const userContent = [
    {
      type: 'text',
      text: JSON.stringify({
        questionText: questionText || '',
        studentAnswer,
        correctAnswer,
        subject: subject || topicHint?.subject,
        topic: topic || topicHint?.topic,
      }),
    },
    ...(images || []).map((dataUrl) => ({
      type: 'image_url',
      image_url: { url: dataUrl, detail: 'high' },
    })),
  ]

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.2,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenAI request failed (${response.status}): ${errText}`)
  }

  const data = await response.json()
  const parsed = JSON.parse(data.choices[0].message.content)

  return {
    subject: parsed.subject,
    domain: parsed.domain || null,
    topic: parsed.topic,
    questionType: parsed.questionType || parsed.topic,
    correctness: parsed.correctness,
    reason: parsed.reason,
    confidence: parsed.confidence,
    estimatedSkill: Math.round(Number(parsed.estimatedSkill)),
    pattern: parsed.pattern ?? null,
  }
}

export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

export async function handleAnalyzeRequest(req, res, apiKey) {
  if (!apiKey) {
    res.statusCode = 503
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'OPENAI_API_KEY is not configured' }))
    return
  }

  try {
    const body = await readJsonBody(req)
    const result = await analyzeWithOpenAI(body, apiKey)
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(result))
  } catch (err) {
    console.error('[analyze]', err)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: err.message || 'Analysis failed' }))
  }
}
