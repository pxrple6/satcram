// This module simulates what a real call to the Claude API would return
// when given a missed question. It exists so the app is fully usable
// without an API key wired up. Swap it out for lib/aiClient.js's
// `analyzeMistake` once you're ready to go live — the shape of the
// returned object is identical, so no other component needs to change.

import { TAXONOMY } from '../data/topics.js'

const REASONS = {
  Math: [
    'Arithmetic mistake',
    'Misapplied the formula',
    'Sign error on a negative',
    'Set up the equation incorrectly',
    'Misread the units',
  ],
  Reading: [
    'Chose an answer that was true but not supported by the passage',
    'Misread the question stem',
    'Missed a contrast signal word',
    'Relied on outside knowledge instead of the text',
  ],
  Writing: [
    'Misidentified the logical relationship between sentences',
    'Applied a comma rule that does not fit this sentence',
    'Missed a subject-verb agreement across a long clause',
  ],
}

const PATTERNS = {
  Math: [
    'Rushes negative numbers',
    'Skips writing out intermediate steps',
    'Confuses similar-looking formulas',
    'Loses track of units under time pressure',
  ],
  Reading: [
    'Picks answers that sound right rather than ones the text proves',
    'Treats contrast words as support words',
    'Answers from memory of the topic instead of the passage',
  ],
  Writing: [
    'Over-applies comma-before-and rule',
    'Misses transition words that signal contrast vs. addition',
    'Loses subject-verb agreement in long sentences',
  ],
}

// simple stable hash so the same pasted question always analyzes the same way
function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function pick(arr, seed) {
  return arr[seed % arr.length]
}

/**
 * @param {{ subject: string, topic: string, questionText: string, studentAnswer: string, correctAnswer: string, images?: string[] }} input
 * @returns {{ questionType: string, correctness: 'Incorrect'|'Correct', reason: string, confidence: 'High'|'Medium'|'Low', estimatedSkill: number, pattern: string }}
 *
 * Note: `images` (data URLs from the upload dropzone) are accepted but
 * ignored here — this mock has no vision model behind it. Swap in
 * lib/aiClient.js to actually read attached screenshots via OpenAI.
 */
export function analyzeMistake(input) {
  const subject = TAXONOMY[input.subject] ? input.subject : 'Math'
  const topic = input.topic || TAXONOMY[subject][0]
  const seed = hash(input.questionText + input.studentAnswer)

  const isCorrect =
    input.studentAnswer.trim().toLowerCase() === input.correctAnswer.trim().toLowerCase()

  const confidence = pick(['High', 'High', 'Medium', 'Low'], seed)
  const estimatedSkill = isCorrect ? 78 + (seed % 18) : 40 + (seed % 35)

  return {
    subject,
    topic,
    questionType: topic,
    correctness: isCorrect ? 'Correct' : 'Incorrect',
    reason: isCorrect ? 'Solid, reasoning matches the correct approach' : pick(REASONS[subject], seed),
    confidence,
    estimatedSkill,
    pattern: isCorrect ? null : pick(PATTERNS[subject], seed >> 2),
  }
}
