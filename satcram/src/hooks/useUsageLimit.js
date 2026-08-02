import { useCallback, useEffect, useState } from 'react'

export function useUsageLimit(userId, isSignedIn) {
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!isSignedIn) { setBudget(null); setLoading(false); return }
    try {
      const headers = {}
      const token = await window.Clerk?.session?.getToken()
      if (token) headers.Authorization = `Bearer ${token}`
      const response = await fetch('/api/usage', { headers })
      if (!response.ok) throw new Error('Usage unavailable')
      setBudget(await response.json())
    } catch {
      setBudget(null)
    } finally { setLoading(false) }
  }, [isSignedIn, userId])

  useEffect(() => { refresh() }, [refresh])
  useEffect(() => {
    window.addEventListener('satcram:usage-updated', refresh)
    return () => window.removeEventListener('satcram:usage-updated', refresh)
  }, [refresh])

  return {
    budget,
    loading,
    canAnalyze: budget?.allowed ?? true,
    canTutor: budget?.allowed ?? true,
    refresh,
  }
}
