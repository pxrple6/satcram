/** College Board–style SAT domains mapped to our topic taxonomy. */
export const SAT_DOMAINS = {
  Math: {
    'Heart of Algebra': ['Linear Equations', 'Systems of Equations'],
    'Passport to Advanced Math': ['Functions', 'Quadratics'],
    'Problem Solving & Data Analysis': ['Ratios & Percents', 'Data & Statistics'],
    'Additional Topics': ['Geometry'],
  },
  Reading: {
    'Information & Ideas': ['Main Idea', 'Inference', 'Evidence Support'],
    'Craft & Structure': ['Vocabulary in Context', 'Paired Passages'],
  },
  Writing: {
    'Standard English Conventions': ['Punctuation', 'Sentence Structure', 'Verb Agreement'],
    'Expression of Ideas': ['Transitions', 'Concision'],
  },
}

export function domainForTopic(subject, topic) {
  const domains = SAT_DOMAINS[subject]
  if (!domains) return null
  for (const [domain, topics] of Object.entries(domains)) {
    if (topics.includes(topic)) return domain
  }
  return null
}

export const SUBJECT_LABELS = {
  Math: 'Math',
  Reading: 'Reading & Writing',
  Writing: 'Reading & Writing',
}

export const SUBJECT_COLORS = {
  Math: 'tag-math',
  Reading: 'tag-reading',
  Writing: 'tag-writing',
}
