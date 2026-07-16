/** Upcoming official SAT test dates (College Board). */
export const SAT_DATES = [
  { date: '2026-08-29', label: 'August 29, 2026', regDeadline: '2026-08-14' },
  { date: '2026-09-12', label: 'September 12, 2026', regDeadline: '2026-08-28' },
  { date: '2026-10-03', label: 'October 3, 2026', regDeadline: '2026-09-18' },
  { date: '2026-11-07', label: 'November 7, 2026', regDeadline: '2026-10-23' },
  { date: '2026-12-05', label: 'December 5, 2026', regDeadline: '2026-11-20' },
  { date: '2027-03-13', label: 'March 13, 2027', regDeadline: '2027-02-26' },
  { date: '2027-05-01', label: 'May 1, 2027', regDeadline: '2027-04-16' },
  { date: '2027-06-05', label: 'June 5, 2027', regDeadline: '2027-05-21' },
]

export function upcomingSatDates(fromDate = new Date()) {
  const today = fromDate.toISOString().slice(0, 10)
  return SAT_DATES.filter((d) => d.date >= today)
}

export function daysUntil(dateStr) {
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)))
}

export function formatCountdown(dateStr) {
  const days = daysUntil(dateStr)
  if (days === 0) return 'Today'
  if (days === 1) return '1 day'
  if (days < 7) return `${days} days`
  const weeks = Math.floor(days / 7)
  const rem = days % 7
  if (rem === 0) return `${weeks} week${weeks > 1 ? 's' : ''}`
  return `${weeks}w ${rem}d`
}
