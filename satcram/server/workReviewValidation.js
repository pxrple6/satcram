/**
 * Server-side guardrail for AI work-review highlights.
 * Rejects false "valid setup" greens when setupAnalysis says the equation mismatches the question.
 */

const SETUP_LABEL_PATTERN = /\b(valid|correct|setup|equation)\b/i

/**
 * @param {object} review - Parsed AI work-review JSON
 * @returns {object} Review with corrected highlights and feedback
 */
export function enforceSetupHighlights(review) {
  if (!review || review.setupMatches !== false) return review

  const mismatch = review.firstMismatch
  const highlights = Array.isArray(review.highlights) ? [...review.highlights] : []
  let feedback = review.feedback?.trim() || ''
  let corrected = false

  const fixedHighlights = highlights.map((mark) => {
    const isFalseGreen =
      mark.color === 'green' &&
      (SETUP_LABEL_PATTERN.test(mark.label || '') || mark.label?.toLowerCase().includes('valid'))

    if (!isFalseGreen) return mark

    corrected = true
    return {
      ...mark,
      color: 'red',
      label: mismatch?.studentTerm
        ? `Setup error: ${mismatch.studentTerm}`
        : 'Setup error — check coefficients',
    }
  })

  const hasRedSetup = fixedHighlights.some((mark) => mark.color === 'red')
  if (!hasRedSetup && mismatch?.studentTerm) {
    corrected = true
    fixedHighlights.unshift({
      x: 120,
      y: 120,
      width: 500,
      height: 100,
      color: 'red',
      label: `Setup error: ${mismatch.studentTerm}`,
    })
  }

  if (corrected && mismatch) {
    const repairNote = mismatch.expectedTerm
      ? `The question calls for **${mismatch.expectedTerm}**, not **${mismatch.studentTerm}**. ${mismatch.reason || 'Fix the equation setup before continuing.'}`
      : 'Your equation setup does not match the question. Check each coefficient against the problem wording.'
    if (!feedback.toLowerCase().includes('setup')) {
      feedback = `${repairNote}\n\n${feedback}`.trim()
    }
  }

  return { ...review, feedback, highlights: fixedHighlights.slice(0, 4) }
}

/**
 * Build a structured comparison preamble injected into the work-review prompt.
 * @param {string} questionText
 */
export function buildQuestionContextBlock(questionText) {
  if (!questionText?.trim()) return ''
  return `\n\nORIGINAL QUESTION (authoritative — compare every student term against this):\n${questionText.trim()}\n\nBefore judging any step, transcribe this question and map each quantity phrase to its algebraic term. Then compare the student's first equation term-by-term with your mapping.`
}
