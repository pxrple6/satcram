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

/** Read a handoff without deleting it (safe for React Strict Mode double-mount). */
export function getTutorHandoff(id) {
  if (!id) return null
  const key = String(id)
  let payload = inMemoryHandoffs.get(key) || null
  if (!payload) {
    try {
      payload = JSON.parse(sessionStorage.getItem(`${HANDOFF_PREFIX}${key}`) || 'null')
      if (payload) inMemoryHandoffs.set(key, payload)
    } catch {
      payload = null
    }
  }
  return payload
}

/** @deprecated Prefer getTutorHandoff — destructive reads break under React Strict Mode. */
export function takeTutorHandoff(id) {
  return getTutorHandoff(id)
}

export function clearTutorHandoff(id) {
  if (!id) return
  const key = String(id)
  inMemoryHandoffs.delete(key)
  try {
    sessionStorage.removeItem(`${HANDOFF_PREFIX}${key}`)
  } catch {
    // ignore storage errors
  }
}
