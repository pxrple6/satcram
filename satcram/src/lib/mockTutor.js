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
