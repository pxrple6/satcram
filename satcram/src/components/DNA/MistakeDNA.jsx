import React, { useMemo, useState } from 'react'
import { useStore } from '../../App.jsx'
import { TAXONOMY, SUBJECTS } from '../../data/topics.js'

function markFor(masteryScore) {
  if (masteryScore === undefined) return { symbol: '\u25cb', cls: '', label: 'Not attempted' }
  if (masteryScore >= 75) return { symbol: '\u2713', cls: 'mark-correct', label: 'Mastered' }
  if (masteryScore >= 55) return { symbol: '\u2013', cls: 'mark-review', label: 'Developing' }
  return { symbol: '\u2717', cls: 'mark-mistake', label: 'Weak spot' }
}

export default function MistakeDNA() {
  const { mastery, mistakes } = useStore()
  const [expandedTopic, setExpandedTopic] = useState(null)
  const missedByTopic = useMemo(() => mistakes.filter((mistake) => mistake.correctness === 'Incorrect').reduce((groups, mistake) => ({ ...groups, [mistake.topic]: [...(groups[mistake.topic] || []), mistake] }), {}), [mistakes])

  return (
    <div>
      <div className="eyebrow">your signature</div>
      <h2 style={{ fontSize: 26, marginTop: 4 }}>Mistake DNA</h2>
      <p style={{ color: 'var(--ink-soft)', maxWidth: 560, marginTop: 8 }}>
        Every graded topic, marked the way a teacher marks a paper. This is what the AI tutor and
        study plan read before deciding what you see next.
      </p>

      <div style={{ display: 'grid', gap: 20, marginTop: 24 }}>
        {SUBJECTS.map((subject) => (
          <div key={subject} className="panel panel-pad">
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>{subject}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TAXONOMY[subject].map((topic) => {
                const score = mastery[topic]
                const mark = markFor(score)
                return (
                  <React.Fragment key={topic}>
                  <button
                    type="button"
                    onClick={() => setExpandedTopic(expandedTopic === topic ? null : topic)}
                    className="dna-topic-row"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '24px 1fr 44px',
                      alignItems: 'center',
                      gap: 12,
                      padding: '6px 0',
                      borderBottom: '1px solid var(--paper-dim)',
                    }}
                  >
                    <span
                      className={mark.cls}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        padding: 0,
                      }}
                      title={mark.label}
                    >
                      {mark.symbol}
                    </span>
                    <span style={{ fontSize: 14 }}>{topic}</span>
                    <span className="stat" style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>
                      {score !== undefined ? `${score}%` : '\u2014'}
                    </span>
                  </button>
                  {expandedTopic === topic && missedByTopic[topic]?.length > 0 && (
                    <div className="dna-question-history">
                      <div className="eyebrow">past missed questions</div>
                      {missedByTopic[topic].slice(0, 4).map((mistake) => <div key={mistake.id} className="dna-question"><span>{mistake.questionText || mistake.questionType || 'Question screenshot'}</span><small>Your answer: {mistake.studentAnswer} · Correct: {mistake.correctAnswer}</small></div>)}
                    </div>
                  )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
