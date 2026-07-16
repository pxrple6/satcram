import { mockTutorReply } from './mockTutor.js'

/**
 * @param {{ messages: Array<{ role: string, content: string, images?: string[] }> }} input
 */
export async function sendTutorMessage(input) {
  try {
    const res = await fetch('/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Tutor request failed (${res.status})`)
    }

    return res.json()
  } catch (err) {
    console.warn('[SATcram] Tutor API unavailable, using offline mock:', err.message)
    return mockTutorReply(input)
  }
}
