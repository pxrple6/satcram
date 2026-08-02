import React, { useMemo } from 'react'
import { Link } from '../../lib/router.jsx'
import { useStore, useProfile } from '../../App.jsx'
import { buildStudyPlan } from '../../lib/studyPlan.js'
import { SAT_DATES, daysUntil, formatCountdown } from '../../data/satDates.js'

export default function StudyPlan() {
  const { mastery, mistakes } = useStore()
  const { profile, setSatTestDate } = useProfile()
  const plan = useMemo(
    () => buildStudyPlan(mastery, mistakes, profile.satTestDate),
    [mastery, mistakes, profile.satTestDate]
  )
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  const upcoming = SAT_DATES.filter((d) => d.date >= new Date().toISOString().slice(0, 10))

  return (
    <div className="plan-page">
      <div className="eyebrow">{today}</div>
      <h2 className="page-title">Study plan</h2>
      <p className="page-lede">
        Paced to your SAT date and built from your weakest topics — not a generic question bank.
      </p>

      <div className="panel panel-pad sat-date-picker">
        <div className="sat-date-picker-head">
          <div>
            <div className="eyebrow">your SAT date</div>
            {profile.satTestDate ? (
              <div className="sat-countdown-display">
                <span className="countdown-number">{daysUntil(profile.satTestDate)}</span>
                <span className="countdown-label">days until test</span>
                <span className="countdown-date">
                  {SAT_DATES.find((d) => d.date === profile.satTestDate)?.label ||
                    profile.satTestDate}
                </span>
              </div>
            ) : (
              <p className="sat-date-hint">Pick your test date to get a paced plan.</p>
            )}
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
      </div>

      {plan.milestones.length > 0 && (
        <div className="plan-milestones">
          {plan.milestones.map((m) => (
            <div key={m.label} className="milestone-card panel panel-pad">
              <div className="milestone-label">{m.label}</div>
              <div className="milestone-detail">{m.detail}</div>
            </div>
          ))}
        </div>
      )}

      <div className="panel panel-pad plan-tasks">
        <div className="eyebrow">today's focus</div>

        {plan.tasks.length === 0 && (
          <p className="empty-hint">
            Not enough data yet — upload a few mistakes to generate a targeted plan.
          </p>
        )}

        <div className="task-list">
          {plan.tasks.map((t, i) => (
            <div key={i} className="task-row">
              <span className={t.type === 'review' ? 'mark-review' : 'mark-mistake'}>
                {t.type === 'review' ? 'review' : 'focus'}
              </span>
              <div className="task-content">
                <span className="task-label">{t.label}</span>
                {t.domain && <span className="task-domain">{t.domain}</span>}
              </div>
              {t.type === 'review' && (
                <Link to="/app/practice" className="btn btn-sm">
                  Start
                </Link>
              )}
            </div>
          ))}
        </div>

        {plan.skipped.length > 0 && (
          <>
            <hr className="divider" />
            <div className="eyebrow">skipped — already strong</div>
            <div className="skipped-list">
              {plan.skipped.map((s) => (
                <div key={s.topic} className="skipped-row">
                  <span>{s.topic}</span>
                  <span className="mark-correct">{s.mastery}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {plan.weakestTopics.length > 0 && profile.satTestDate && (
        <div className="panel panel-pad plan-breakdown">
          <div className="eyebrow">visual study guides — your weak spots</div>
          <p className="visual-guide-intro">Each guide gives you the idea to see, the move to make, and fresh practice to lock it in.</p>
          <div className="weakness-grid">
            {plan.weakestTopics.map((t) => (
              <div key={t.topic} className="weakness-item visual-guide-card">
                <div className="weakness-topic">{t.topic}</div>
                <div className="weakness-meta">
                  <span className="domain-tag">{t.domain}</span>
                  <span className="mark-review">{t.mastery}%</span>
                </div>
                <div className="visual-guide-steps"><span>See the pattern</span><i>→</i><span>Try one move</span><i>→</i><span>Practise it</span></div>
                <Link to={`/app/practice?subject=${t.subject}`} className="text-action">Open targeted practice</Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
