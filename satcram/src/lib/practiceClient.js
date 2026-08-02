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
  window.dispatchEvent(new Event('satcram:usage-updated'))
  return result.questions
}
