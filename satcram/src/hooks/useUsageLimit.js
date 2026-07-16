import { useCallback, useMemo, useState } from 'react'
import { getLimits, loadUsage, saveUsage } from '../lib/usageLimits.js'

export function useUsageLimit(userId, isSignedIn) {
  const limits = getLimits(isSignedIn)
  const [usage, setUsage] = useState(() => loadUsage(userId))

  const refresh = useCallback(() => {
    setUsage(loadUsage(userId))
  }, [userId])

  const remaining = useMemo(
    () => ({
      analyses: Math.max(0, limits.analyses - usage.analyses),
      tutorMessages: Math.max(0, limits.tutorMessages - usage.tutorMessages),
    }),
    [limits, usage]
  )

  const canAnalyze = remaining.analyses > 0
  const canTutor = remaining.tutorMessages > 0

  function recordAnalysis() {
    const next = { ...loadUsage(userId), analyses: loadUsage(userId).analyses + 1 }
    saveUsage(userId, next)
    setUsage(next)
  }

  function recordTutorMessage() {
    const current = loadUsage(userId)
    const next = { ...current, tutorMessages: current.tutorMessages + 1 }
    saveUsage(userId, next)
    setUsage(next)
  }

  return {
    limits,
    usage,
    remaining,
    canAnalyze,
    canTutor,
    recordAnalysis,
    recordTutorMessage,
    refresh,
  }
}
