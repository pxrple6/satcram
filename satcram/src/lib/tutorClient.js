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
 * @param {{ messages: Array<{ role: string, content: string, images?: string[] }> }} input
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
    console.warn('[SATcram] Tutor API unavailable, using offline mock:', err.message)
    return mockTutorReply(input)
  }
}
