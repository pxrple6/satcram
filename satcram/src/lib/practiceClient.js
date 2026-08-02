async function authHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  const token = await window.Clerk?.session?.getToken().catch(() => null)
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export async function generatePracticeSet(focus) {
  const response = await fetch('/api/practice', { method: 'POST', headers: await authHeaders(), body: JSON.stringify(focus) })
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Could not create a fresh practice set.')
  const result = await response.json()
  try {
    const key = 'satcram_generated_practice_sets'
    const previous = JSON.parse(localStorage.getItem(key) || '[]')
    localStorage.setItem(key, JSON.stringify([{ createdAt: Date.now(), focus, questions: result.questions }, ...previous].slice(0, 20)))
  } catch {
    // The current set remains usable if local storage is unavailable.
  }
  window.dispatchEvent(new Event('satcram:usage-updated'))
  return result.questions
}

export function recentPracticeStyles() {
  try {
    const saved = JSON.parse(localStorage.getItem('satcram_generated_practice_sets') || '[]')
    return [...new Set(saved.flatMap((set) => set.questions || []).map((question) => question.styleTag).filter(Boolean))].slice(0, 80)
  } catch {
    return []
  }
}
