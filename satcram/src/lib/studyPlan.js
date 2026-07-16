import { allTopics } from '../data/topics.js'
import { domainForTopic } from '../data/domains.js'
import { daysUntil } from '../data/satDates.js'

const MASTERY_SKIP_THRESHOLD = 90

/**
 * Builds today's plan: prioritize weakest topics, pace by days until SAT,
 * surface recent mistakes for review, and skip mastered topics.
 *
 * @param {Record<string, number>} mastery topic -> 0-100
 * @param {Array} mistakes
 * @param {string|null} satTestDate ISO date string
 */
export function buildStudyPlan(mastery, mistakes, satTestDate = null) {
  const topics = allTopics().map((t) => ({
    ...t,
    mastery: mastery[t.topic] ?? null,
    domain: domainForTopic(t.subject, t.topic),
  }))

  const ranked = topics
    .filter((t) => t.mastery !== null)
    .sort((a, b) => a.mastery - b.mastery)

  const weakest = ranked.filter((t) => t.mastery < MASTERY_SKIP_THRESHOLD)
  const mastered = ranked.filter((t) => t.mastery >= MASTERY_SKIP_THRESHOLD)

  const oneDayMs = 24 * 60 * 60 * 1000
  const now = Date.now()
  const reviewQueue = mistakes
    .filter((m) => m.correctness === 'Incorrect' && now - m.timestamp < oneDayMs * 3)
    .slice(0, 5)

  const daysLeft = satTestDate ? daysUntil(satTestDate) : null
  const focusCount = daysLeft
    ? Math.min(weakest.length, Math.max(2, Math.ceil(weakest.length / Math.max(1, Math.ceil(daysLeft / 7)))))
    : 3

  const dailyQuestions = daysLeft
    ? Math.max(3, Math.min(15, Math.ceil((weakest.length * 8) / Math.max(daysLeft, 1))))
    : 8

  const tasks = weakest.slice(0, focusCount).map((t) => ({
    label: `${dailyQuestions} ${t.topic} questions`,
    subject: t.subject,
    domain: t.domain,
    topic: t.topic,
    mastery: t.mastery,
    type: 'focus',
  }))

  if (reviewQueue.length > 0) {
    tasks.push({
      label: `Re-practice ${reviewQueue.length} recent mistake${reviewQueue.length > 1 ? 's' : ''}`,
      type: 'review',
      reviewIds: reviewQueue.map((m) => m.id),
    })
  }

  const milestones = []
  if (daysLeft !== null && daysLeft > 0) {
    const weeksLeft = Math.ceil(daysLeft / 7)
    if (weakest.length > 0) {
      milestones.push({
        label: `Cover ${Math.min(weakest.length, focusCount)} weak topic${focusCount > 1 ? 's' : ''} this week`,
        detail: weakest.slice(0, focusCount).map((t) => t.topic).join(', '),
      })
    }
    if (weeksLeft <= 2) {
      milestones.push({ label: 'Final review week', detail: 'Focus on re-practicing your saved mistakes' })
    } else if (weeksLeft <= 4) {
      milestones.push({ label: 'Mid-prep checkpoint', detail: 'Take a timed practice section this week' })
    }
  }

  return {
    tasks,
    reviewCount: reviewQueue.length,
    reviewIds: reviewQueue.map((m) => m.id),
    skipped: mastered.map((t) => ({ topic: t.topic, mastery: t.mastery })),
    daysLeft,
    dailyQuestions,
    milestones,
    weakestTopics: weakest.slice(0, 5),
  }
}
