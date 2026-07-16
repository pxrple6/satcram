// Canonical subject -> topic taxonomy. This is what the "Mistake DNA"
// strand is built from, and what the study plan pulls weak spots out of.

export const TAXONOMY = {
  Math: [
    'Linear Equations',
    'Functions',
    'Geometry',
    'Quadratics',
    'Systems of Equations',
    'Ratios & Percents',
    'Data & Statistics',
  ],
  Reading: ['Vocabulary in Context', 'Inference', 'Evidence Support', 'Main Idea', 'Paired Passages'],
  Writing: ['Punctuation', 'Transitions', 'Sentence Structure', 'Concision', 'Verb Agreement'],
}

export const SUBJECTS = Object.keys(TAXONOMY)

export function allTopics() {
  return SUBJECTS.flatMap((s) => TAXONOMY[s].map((t) => ({ subject: s, topic: t })))
}
