// Offline stand-in when OpenAI is unavailable.

function countHints(messages) {
  return messages.filter((m) => m.role === 'assistant' && m.content.toLowerCase().includes('hint')).length
}

function wantsExplanation(text) {
  const t = text.toLowerCase()
  return (
    t.includes('explain') ||
    t.includes('give up') ||
    t.includes('just tell') ||
    t.includes('full solution') ||
    t.includes("don't know") ||
    t.includes('no idea')
  )
}

function wantsHint(text) {
  const t = text.toLowerCase()
  return t.includes('hint') || t.includes('help me') || t.includes('stuck') || t.includes('not sure')
}

/**
 * @param {{ messages: Array<{ role: string, content: string, images?: string[] }> }} input
 */
export function mockTutorReply({ messages }) {
  const userMsgs = messages.filter((m) => m.role === 'user')
  const assistantMsgs = messages.filter((m) => m.role === 'assistant')

  const firstMessage = userMsgs[0]?.content || ''
  if (firstMessage.startsWith('MISSED PRACTICE HANDOFF')) {
    const subject = firstMessage.match(/Subject: (.+)/)?.[1] || 'SAT'
    const topic = firstMessage.match(/Topic: (.+)/)?.[1] || 'the skill'
    const chosen = firstMessage.match(/Student chose: (.+)/)?.[1] || 'your selected answer'
    const correct = firstMessage.match(/Correct answer: (.+)/)?.[1] || 'the correct answer'
    const math = subject === 'Math'
    return {
      message: `**Your answer:** ${chosen}\n\n**Correct answer:** ${correct}\n\nThe tutor service is unavailable, so this local guide cannot verify every calculation. Start by comparing the relationship the question asks for with the relationship used in your selected answer. For ${topic}, that comparison is the first thing to repair.`,
      steps: [
        { color: 'green', label: 'What the question gives', detail: 'Underline the quantities, evidence, or sentence parts that are explicitly stated.' },
        { color: 'amber', label: 'What to check', detail: 'Name the relationship the question is testing before evaluating answer choices.' },
        { color: 'red', label: 'The mismatch', detail: `Your choice (${chosen}) does not match the recorded correct answer (${correct}). Recheck the decisive relationship, not just the final number or wording.` },
        { color: 'blue', label: 'Repair', detail: 'Work one concrete value, line of evidence, or sentence boundary through before choosing again.' },
      ],
      concept: { title: `${topic}: rebuild the relationship`, visualType: math ? 'input-output' : subject === 'Reading' ? 'evidence-ladder' : 'sentence-map', takeaway: math ? 'Input → rule → output: the correct answer must preserve the rule at every step.' : 'Move from the exact evidence or sentence structure to the answer; do not choose what merely sounds plausible.' },
      retryPrompt: `Before selecting an answer, state the one ${topic} relationship this question is testing in your own words.`,
    }
  }

  // First turn: student just submitted the question
  if (userMsgs.length === 1 && assistantMsgs.length === 0) {
    return {
      message:
        "I've got the question. Before I help you work through it — what answer would you pick? Take your best guess.",
    }
  }

  const lastUser = userMsgs[userMsgs.length - 1]?.content || ''
  const hintsGiven = countHints(messages)

  if (wantsExplanation(lastUser) || hintsGiven >= 2) {
    return {
      message:
        "Here's the full walkthrough: break the problem into what it's asking vs. what it's giving you. " +
        "Identify the key relationship or passage evidence first, then work step by step toward the answer. " +
        "The correct approach usually comes from re-reading the specific line the question references — not from general knowledge. " +
        "(Connect your OpenAI API key for a real step-by-step explanation tailored to your question.)",
    }
  }

  if (wantsHint(lastUser) && hintsGiven >= 1) {
    return {
      message:
        "Second hint: cross out answer choices that contradict the passage or don't match the units in the problem. " +
        "What's left is usually down to one conceptual fork — focus on whether the question wants addition or comparison. " +
        "Still stuck? Say 'explain it' and I'll walk you through the whole thing.",
    }
  }

  if (assistantMsgs.length === 1) {
    return {
      message:
        `You said "${lastUser}" — not quite, but you're thinking in the right direction. ` +
        "Hint: re-read what the question is actually asking you to find, not just what looks familiar. " +
        "Want to try again, or should I give you another hint?",
    }
  }

  return {
    message:
      "Hint: look for signal words (however, therefore, except) or the specific values the problem gives you. " +
      "Try working one step at a time. Say 'explain it' if you'd like the full solution.",
  }
}
