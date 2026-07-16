import { TAXONOMY } from '../data/topics.js'

// Rough section weighting. Math is its own 200-800 section;
// Reading + Writing together form the other 200-800 section.
const MATH_TOPICS = TAXONOMY.Math
const VERBAL_TOPICS = [...TAXONOMY.Reading, ...TAXONOMY.Writing]

function averageMastery(mastery, topics) {
  const values = topics.map((t) => mastery[t]).filter((v) => typeof v === 'number')
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

function toScaledScore(avgMasteryPct) {
  // maps 0-100 mastery to a 200-800 band, floored at 200
  return Math.round(200 + (avgMasteryPct / 100) * 600)
}

/**
 * @param {Record<string, number>} mastery topic -> 0-100 mastery
 * @param {number} sampleSize total questions analyzed
 */
export function estimateScore(mastery, sampleSize) {
  const mathAvg = averageMastery(mastery, MATH_TOPICS)
  const verbalAvg = averageMastery(mastery, VERBAL_TOPICS)

  if (mathAvg === null && verbalAvg === null) return null

  const mathScore = toScaledScore(mathAvg ?? 50)
  const verbalScore = toScaledScore(verbalAvg ?? 50)
  const total = mathScore + verbalScore

  // confidence band narrows as the student answers more questions
  const spread = sampleSize > 150 ? 20 : sampleSize > 60 ? 40 : sampleSize > 20 ? 60 : 90

  return {
    math: mathScore,
    verbal: verbalScore,
    total,
    low: Math.max(400, total - spread),
    high: Math.min(1600, total + spread),
  }
}
