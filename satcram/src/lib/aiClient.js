// Calls POST /api/analyze (Vite dev middleware or server/index.js in production).
// Falls back to mockAnalysis when the API is unavailable or the key isn't set.

import { analyzeMistake as mockAnalyze } from './mockAnalysis.js'

/**
 * @param {{ subject?: string, topic?: string, questionText?: string, studentAnswer: string, correctAnswer: string, images?: string[] }} input
 */
export async function analyzeMistake(input) {
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: input.subject,
        topic: input.topic,
        questionText: input.questionText,
        studentAnswer: input.studentAnswer,
        correctAnswer: input.correctAnswer,
        images: input.images,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Analysis request failed (${res.status})`)
    }

    return res.json()
  } catch (err) {
    console.warn('[SATcram] OpenAI unavailable, using offline mock:', err.message)
    return mockAnalyze(input)
  }
}
