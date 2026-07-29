const DEFAULT_MONTHLY_LIMIT_USD = 2
const INPUT_COST_PER_MILLION = Number(process.env.OPENAI_INPUT_COST_PER_MILLION || 2.5)
const OUTPUT_COST_PER_MILLION = Number(process.env.OPENAI_OUTPUT_COST_PER_MILLION || 15)

const usageByUser = new Map()

function currentPeriod() {
  return new Date().toISOString().slice(0, 7) // YYYY-MM, in UTC
}

function monthlyLimit() {
  const configured = Number(process.env.OPENAI_USAGE_LIMIT_USD || DEFAULT_MONTHLY_LIMIT_USD)
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MONTHLY_LIMIT_USD
}

function entryFor(key) {
  const period = currentPeriod()
  const entry = usageByUser.get(key)
  if (entry?.period === period) return entry

  const fresh = { period, spentUsd: 0 }
  usageByUser.set(key, fresh)
  return fresh
}

export function usageLimitFor(key) {
  const entry = entryFor(key)
  const limitUsd = monthlyLimit()
  return {
    allowed: entry.spentUsd < limitUsd,
    spentUsd: entry.spentUsd,
    remainingUsd: Math.max(0, limitUsd - entry.spentUsd),
    limitUsd,
  }
}

export function recordOpenAIUsage(key, usage) {
  const inputTokens = usage?.prompt_tokens || 0
  const outputTokens = usage?.completion_tokens || 0
  const costUsd =
    (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION +
    (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION

  const entry = entryFor(key)
  entry.spentUsd += costUsd
  return usageLimitFor(key)
}
