// Maps a diagnosed pattern to a Socratic follow-up. In production this
// would be an OpenAI call seeded with the student's own explanation
// (see aiClient.js) — this is the offline stand-in.

const RESPONSES = {
  'Picks answers that sound right rather than ones the text proves': (why) =>
    `That's a common trap. An answer can be true in the real world and still be wrong here if the passage never actually says it. Go back and find the exact line that would have to be true for your answer to hold — if you can't point to it, that's the tell.`,
  'Answers from memory of the topic instead of the passage': (why) =>
    `Notice that your reasoning ("${why}") pulled from what you already know about the topic, not from this specific passage. The SAT tests what's on the page, not general knowledge. Try re-reading the two sentences right before the line reference before answering again.`,
  'Misses transition words that signal contrast vs. addition': (why) =>
    `"However" usually signals a contrast, and "therefore" signals a consequence — they're not interchangeable. Read the sentence right before the blank: does the second sentence agree with the first, or push back on it? That tells you which family the answer belongs to.`,
  'Confuses similar-looking formulas': (why) =>
    `You're not wrong that those formulas look alike — that's exactly why they're worth separating explicitly. Before your next attempt, write both formulas side by side and label what each variable represents. The mix-up usually disappears once they're not competing for the same mental slot.`,
  'Loses track of units under time pressure': (why) =>
    `Under time pressure the calculation is usually right and the units are what slip. Try circling the units the question asks for before you start solving — it takes two seconds and catches this exact mistake.`,
  'Loses subject-verb agreement in long sentences': (why) =>
    `Long sentences bury the real subject under modifying clauses. Try crossing out everything between commas and re-reading just the core subject and verb — does it still sound right on its own?`,
}

const DEFAULT = (why) =>
  `Here's the thing worth sitting with: you said "${why}" — walk through the passage or problem one more time and see where that reasoning and the correct answer actually diverge. That gap is usually where the real lesson is.`

export function socraticReply(pattern, why) {
  const fn = RESPONSES[pattern] || DEFAULT
  return fn(why || 'I\u2019m not sure')
}
