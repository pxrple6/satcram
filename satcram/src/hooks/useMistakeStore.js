import { useEffect, useMemo, useState } from 'react'
import { analyzeMistake } from '../lib/aiClient.js'

function storageKey(userId) {
  return `satcram_mistakes_${userId || 'guest'}`
}

function load(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore corrupt storage
  }
  return []
}

export function useMistakeStore(userId = 'guest') {
  const key = storageKey(userId)
  const [mistakes, setMistakes] = useState(() => load(userId))

  useEffect(() => {
    setMistakes(load(userId))
  }, [userId])

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(mistakes))
  }, [mistakes, key])

  async function addMistake(input) {
    const analysis = await analyzeMistake(input)
    const record = {
      id: `m_${Date.now()}_${Math.round(Math.random() * 1e4)}`,
      timestamp: Date.now(),
      source: input.source || 'Manual entry',
      questionText: input.questionText,
      studentAnswer: input.studentAnswer,
      correctAnswer: input.correctAnswer,
      images: input.images || [],
      status: analysis.correctness === 'Correct' ? 'Fixed' : 'Needs review',
      ...analysis,
    }
    setMistakes((prev) => [record, ...prev])
    return record
  }

  function setStatus(id, status) {
    setMistakes((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)))
  }

  function clearAll() {
    setMistakes([])
  }

  const mastery = useMemo(() => {
    const buckets = {}
    for (const m of mistakes) {
      if (!buckets[m.topic]) buckets[m.topic] = []
      buckets[m.topic].push(m.estimatedSkill)
    }
    const result = {}
    for (const topic in buckets) {
      const arr = buckets[topic]
      result[topic] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
    }
    return result
  }, [mistakes])

  const stats = useMemo(() => {
    const total = mistakes.length
    const incorrect = mistakes.filter((m) => m.correctness === 'Incorrect')
    const recurring = mistakes.filter((m) => m.status === 'Recurring')
    const needsReview = mistakes.filter((m) => m.status === 'Needs review')

    const patternCounts = {}
    for (const m of incorrect) {
      if (!m.pattern) continue
      patternCounts[m.pattern] = (patternCounts[m.pattern] || 0) + 1
    }
    const topPatterns = Object.entries(patternCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern, count]) => ({ pattern, count }))

    return {
      total,
      incorrectCount: incorrect.length,
      accuracy: total ? Math.round(((total - incorrect.length) / total) * 100) : 0,
      recurringCount: recurring.length,
      needsReviewCount: needsReview.length,
      topPatterns,
    }
  }, [mistakes])

  return { mistakes, addMistake, setStatus, clearAll, mastery, stats }
}
