// Calls POST /api/analyze (Vite dev middleware or server/index.js in production).
// Falls back to mockAnalysis when the API is unavailable or the key isn't set.

import { analyzeMistake as mockAnalyze } from './mockAnalysis.js'

async function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  try {
    if (typeof window !== 'undefined' && window.Clerk?.session) {
      const token = await window.Clerk.session.getToken()
      if (token) headers['Authorization'] = `Bearer ${token}`
    }
  } catch {
    // ignore token fetch error
  }
  return headers
}

/**
 * @param {{ subject?: string, topic?: string, questionText?: string, studentAnswer: string, correctAnswer: string, images?: string[] }} input
 */
export async function analyzeMistake(input) {
  try {
    const headers = await getAuthHeaders()
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers,
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

    const result = await res.json()
    window.dispatchEvent(new Event('satcram:usage-updated'))
    return result
  } catch (err) {
    console.warn('[SATcram] OpenAI unavailable, using offline mock:', err.message)
    return mockAnalyze(input)
  }
}
