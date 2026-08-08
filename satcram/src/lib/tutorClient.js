import { mockTutorReply } from './mockTutor.js'

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
 * @param {{ messages: Array<{ role: string, content: string, images?: string[] }>, workReview?: boolean, visualLesson?: boolean }} input
 */
export async function sendTutorMessage(input) {
  try {
    const headers = await getAuthHeaders()
    const res = await fetch('/api/tutor', {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Tutor request failed (${res.status})`)
    }

    const result = await res.json()
    window.dispatchEvent(new Event('satcram:usage-updated'))
    return result
  } catch (err) {
    if (input.workReview) {
      throw new Error(`AI work review could not run, so your page was not analyzed or highlighted. ${err.message}`)
    }
    console.warn('[SATcram] Tutor API unavailable, using offline mock:', err.message)
    return mockTutorReply(input)
  }
}
