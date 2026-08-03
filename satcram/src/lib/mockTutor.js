// Offline stand-in when OpenAI is unavailable. It preserves the same
// three-attempt gate and never exposes the recorded answer from a handoff.

function isHelpRequest(text) {
  const value = text.toLowerCase()
  return ['hint', 'help me', 'stuck', 'not sure', 'explain', 'give up', 'just tell', 'full solution', "don't know", 'no idea']
    .some((phrase) => value.includes(phrase))
}

function isGenuineAttempt(text) {
  const value = text.trim()
  return value.length > 0 && !isHelpRequest(value)
}

/**
 * @param {{ messages: Array<{ role: string, content: string, images?: string[] }> }} input
 */
export function mockTutorReply({ messages }) {
  const userMessages = messages.filter((message) => message.role === 'user')
  const assistantMessages = messages.filter((message) => message.role === 'assistant')
  const firstMessage = userMessages[0]?.content || ''
  const missedHandoff = firstMessage.startsWith('MISSED PRACTICE HANDOFF')
  const recordedChoice = firstMessage.match(/Student chose: (.+)/)?.[1] || 'that choice'
  const laterAttempts = userMessages.slice(1).filter((message) => isGenuineAttempt(message.content)).length
  const failedAttempts = (missedHandoff ? 1 : 0) + laterAttempts

  if (assistantMessages.length === 0) {
    if (missedHandoff) {
      return {
        message: `**Attempt 1 of 3 recorded.** You chose ${recordedChoice}. I’m not going to show the answer yet. What relationship, rule, or passage evidence did you use—and what would you change on your second attempt?`,
      }
    }
    return {
      message: 'Before I help, give me both your answer and your first reasoning step. Your best honest attempt is enough to begin.',
    }
  }

  const lastUser = userMessages[userMessages.length - 1]?.content || ''
  if (isHelpRequest(lastUser)) {
    return {
      message: `The solution is still locked. Asking for a hint or the answer does not count as an attempt. You have made **${Math.min(failedAttempts, 3)} of 3** required attempts—show me the next step you would try.`,
    }
  }

  if (failedAttempts < 3) {
    return {
      message: `**Attempt ${failedAttempts} of 3.** I won’t give away the solution yet. Check what the question asks you to find, then write one concrete calculation, rule, or piece of evidence for your next attempt.`,
    }
  }

  return {
    message: '**Three genuine attempts completed—the solution is unlocked.** The offline tutor cannot safely calculate the exact answer for this question. Reconnect the AI tutor and send this attempt again for the full worked solution.',
  }
}
