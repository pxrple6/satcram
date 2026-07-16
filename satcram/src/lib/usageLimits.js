/** Daily free-tier limits (resets at midnight local time). */
export const USAGE_LIMITS = {
  guest: { analyses: 3, tutorMessages: 8 },
  signedIn: { analyses: 15, tutorMessages: 30 },
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function usageStorageKey(userId) {
  return `satcram_usage_${userId || 'guest'}_${todayKey()}`
}

export function loadUsage(userId) {
  try {
    const raw = localStorage.getItem(usageStorageKey(userId))
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore corrupt storage
  }
  return { analyses: 0, tutorMessages: 0, date: todayKey() }
}

export function saveUsage(userId, usage) {
  localStorage.setItem(usageStorageKey(userId), JSON.stringify({ ...usage, date: todayKey() }))
}

export function getLimits(isSignedIn) {
  return isSignedIn ? USAGE_LIMITS.signedIn : USAGE_LIMITS.guest
}
