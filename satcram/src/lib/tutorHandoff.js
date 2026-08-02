const HANDOFF_PREFIX = 'satcram_tutor_handoff:'
const inMemoryHandoffs = new Map()

export function saveTutorHandoff(id, payload) {
  const key = String(id || `question-${Date.now()}`)
  inMemoryHandoffs.set(key, payload)
  try {
    sessionStorage.setItem(`${HANDOFF_PREFIX}${key}`, JSON.stringify(payload))
  } catch {
    // The in-memory copy still supports navigation inside the current app tab.
  }
  return key
}

export function takeTutorHandoff(id) {
  if (!id) return null
  const key = String(id)
  let payload = inMemoryHandoffs.get(key) || null
  inMemoryHandoffs.delete(key)
  try {
    const storageKey = `${HANDOFF_PREFIX}${key}`
    if (!payload) payload = JSON.parse(sessionStorage.getItem(storageKey) || 'null')
    sessionStorage.removeItem(storageKey)
  } catch {
    // Use the in-memory payload when browser storage is unavailable.
  }
  return payload
}
