import React, { useMemo } from 'react'
import { Link } from '../../lib/router.jsx'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useStore, useProfile } from '../../App.jsx'
import { estimateScore } from '../../lib/scoreEstimator.js'
import { SAT_DATES, upcomingSatDates, daysUntil, formatCountdown } from '../../data/satDates.js'

function buildAccuracyTrend(mistakes) {
  const sorted = [...mistakes].sort((a, b) => a.timestamp - b.timestamp)
  const window = 6
  const points = []
  for (let i = 0; i < sorted.length; i++) {
    const slice = sorted.slice(Math.max(0, i - window + 1), i + 1)
    const correct = slice.filter((m) => m.correctness === 'Correct').length
    points.push({
      date: new Date(sorted[i].timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      accuracy: Math.round((correct / slice.length) * 100),
    })
  }
  return points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 8)) === 0)
}

export default function Dashboard() {
  const { mistakes, mastery, stats } = useStore()
  const { profile, setSatTestDate, user, isSignedIn } = useProfile()

  const trend = useMemo(() => buildAccuracyTrend(mistakes), [mistakes])
  const score = useMemo(() => estimateScore(mastery, mistakes.length), [mastery, mistakes.length])
  const upcoming = upcomingSatDates()
  const hasData = mistakes.length > 0

  const greeting = isSignedIn && user?.firstName ? `Hi, ${user.firstName}` : 'Dashboard'

  if (!profile.satTestDate) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div>
            <h2 className="page-title">{greeting}, when are you taking the SAT?</h2>
            <p className="page-lede">Choose your date once. We’ll pace practice and review around it.</p>
          </div>
        </header>

        <div className="panel panel-pad sat-date-card">
          <div className="sat-date-row">
            <div>
              <div className="eyebrow">Your SAT date</div>
              <p className="sat-date-hint">Choose a test date to pace your study plan.</p>
            </div>
            <select
              value={profile.satTestDate || ''}
              onChange={(e) => setSatTestDate(e.target.value || null)}
              className="sat-date-select"
            >
              <option value="">Select test date…</option>
              {upcoming.map((d) => (
                <option key={d.date} value={d.date}>
                  {d.label} ({formatCountdown(d.date)})
                </option>
              ))}
            </select>
          </div>
          <a className="btn btn-ghost btn-sm college-board-link" href="https://satsuite.collegeboard.org/sat/registration/online-registration/registering" target="_blank" rel="noreferrer">Register with College Board ↗</a>
        </div>

        <div className="empty-state panel panel-pad"><h3>Then start with a short adaptive set</h3><p>You do not need to upload anything first. Answer original SAT-style questions and we’ll use your results to personalize the next session.</p><Link to="/app/practice" className="btn">Start practice</Link></div>
      </div>
    )
  }

  if (!hasData) {
    return <div className="dashboard"><header className="dashboard-header"><div><h2 className="page-title">Your plan starts today.</h2><p className="page-lede">Start practising, or log a question you missed elsewhere. Either creates your personalized plan.</p></div></header><div className="dashboard-actions"><Link to="/app/practice" className="btn">Start adaptive practice</Link><Link to="/app/upload" className="btn btn-ghost">Log a missed question</Link></div></div>
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h2 className="page-title">{greeting}</h2>
          <p className="page-lede">
            {stats.total} question{stats.total === 1 ? '' : 's'} analyzed · {stats.accuracy}% accuracy
          </p>
        </div>
        <Link to="/app/upload" className="btn btn-sm">
          + Upload
        </Link>
      </header>

      <div className="panel panel-pad sat-date-card">
        <div className="sat-date-row">
          {profile.satTestDate ? (
            <div className="sat-countdown-display">
              <span className="countdown-number">{daysUntil(profile.satTestDate)}</span>
              <div>
                <span className="countdown-label">days until SAT</span>
                <span className="countdown-date">
                  {SAT_DATES.find((d) => d.date === profile.satTestDate)?.label || profile.satTestDate}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div className="eyebrow">Your SAT date</div>
              <p className="sat-date-hint">Set your test date to get a paced study plan.</p>
            </div>
          )}
          <select
            value={profile.satTestDate || ''}
            onChange={(e) => setSatTestDate(e.target.value || null)}
            className="sat-date-select"
          >
            <option value="">Select test date…</option>
            {upcoming.map((d) => (
              <option key={d.date} value={d.date}>
                {d.label} ({formatCountdown(d.date)})
              </option>
            ))}
          </select>
        </div>
        <a className="btn btn-ghost btn-sm college-board-link" href="https://satsuite.collegeboard.org/sat/registration/online-registration/registering" target="_blank" rel="noreferrer">Register with College Board ↗</a>
      </div>

      <div className="stat-grid">
        <div className="stat-card panel panel-pad">
          <div className="eyebrow">Predicted score</div>
          {score ? (
            <>
              <div className="stat-value">{score.total}</div>
              <div className="stat-meta">Range {score.low}–{score.high}</div>
            </>
          ) : (
            <div className="stat-meta">Need more data</div>
          )}
        </div>
        <div className="stat-card panel panel-pad">
          <div className="eyebrow">Accuracy</div>
          <div className="stat-value">{stats.accuracy}%</div>
          <div className="stat-meta">{stats.total} questions</div>
        </div>
        <div className="stat-card panel panel-pad">
          <div className="eyebrow">Needs review</div>
          <div className="stat-value review">{stats.needsReviewCount}</div>
          <div className="stat-meta">{stats.recurringCount} recurring</div>
        </div>
      </div>

      {trend.length >= 2 && (
        <div className="panel panel-pad dashboard-chart">
          <div className="eyebrow">Accuracy trend</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: 'var(--line)' }}
                  formatter={(v) => [`${v}%`, 'Accuracy']}
                />
                <Line type="monotone" dataKey="accuracy" stroke="var(--brand)" strokeWidth={2} dot={{ r: 3, fill: 'var(--brand)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {stats.topPatterns.length > 0 && (
        <div className="panel panel-pad">
          <div className="eyebrow">Top mistake patterns</div>
          <ul className="pattern-list">
            {stats.topPatterns.map((p) => (
              <li key={p.pattern}>
                <span>{p.pattern}</span>
                <span className="mark-mistake">×{p.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="dashboard-actions">
        <Link to="/app/practice" className="btn btn-ghost">
          Practice your weak topics
        </Link>
        <Link to="/app/plan" className="btn btn-ghost">
          View study plan
        </Link>
      </div>
    </div>
  )
}
