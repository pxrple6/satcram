import React, { useMemo, useState } from 'react'
import { Link, useSearchParams } from '../../lib/router.jsx'
import { useStore } from '../../App.jsx'
import RichText from '../RichText.jsx'
import { SUBJECT_COLORS } from '../../data/domains.js'

function QuestionCard({ mistake, onNext, onPrev, index, total, showAnswer, onToggleAnswer }) {
  const preview =
    mistake.questionText?.slice(0, 200) ||
    (mistake.images?.length ? 'See attached screenshot' : 'No question text')

  return (
    <div className="practice-card panel">
      <div className="practice-card-head">
        <div className="practice-tags">
          <span className={`subject-tag ${SUBJECT_COLORS[mistake.subject] || ''}`}>
            {mistake.subject}
          </span>
          {mistake.domain && <span className="domain-tag">{mistake.domain}</span>}
          <span className="topic-tag">{mistake.topic}</span>
        </div>
        <span className="practice-counter mono">
          {index + 1} / {total}
        </span>
      </div>

      <div className="practice-question">
        {mistake.images?.length > 0 && (
          <div className="practice-images">
            {mistake.images.map((src, i) => (
              <img key={i} src={src} alt={`Question ${i + 1}`} />
            ))}
          </div>
        )}
        {mistake.questionText ? (
          <RichText text={mistake.questionText} />
        ) : (
          <p className="practice-no-text">Review the screenshot above and try again.</p>
        )}
      </div>

      <div className="practice-attempt">
        <div className="practice-field">
          <span className="field-label">Your original answer</span>
          <span className="field-value">{mistake.studentAnswer}</span>
        </div>

        {showAnswer ? (
          <div className="practice-field practice-reveal">
            <span className="field-label">Correct answer</span>
            <span className="field-value correct">{mistake.correctAnswer}</span>
            {mistake.reason && (
              <div className="practice-reason">
                <RichText text={mistake.reason} />
              </div>
            )}
          </div>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={onToggleAnswer}>
            Reveal answer
          </button>
        )}
      </div>

      <div className="practice-nav">
        <button type="button" className="btn btn-ghost" onClick={onPrev} disabled={index === 0}>
          Previous
        </button>
        <Link
          to={`/app/tutor?from=${mistake.id}`}
          className="btn btn-ghost"
        >
          Work through with tutor
        </Link>
        <button type="button" className="btn" onClick={onNext} disabled={index >= total - 1}>
          Next question
        </button>
      </div>
    </div>
  )
}

export default function PracticeDeck() {
  const { mistakes } = useStore()
  const [searchParams] = useSearchParams()
  const filterSubject = searchParams.get('subject')

  const deck = useMemo(() => {
    let list = [...mistakes]
    if (filterSubject) list = list.filter((m) => m.subject === filterSubject)
    return list
  }, [mistakes, filterSubject])

  const [index, setIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  const current = deck[index]

  function goNext() {
    if (index < deck.length - 1) {
      setIndex(index + 1)
      setShowAnswer(false)
    }
  }

  function goPrev() {
    if (index > 0) {
      setIndex(index - 1)
      setShowAnswer(false)
    }
  }

  const bySubject = useMemo(() => {
    const counts = { Math: 0, Reading: 0, Writing: 0 }
    for (const m of mistakes) {
      if (counts[m.subject] !== undefined) counts[m.subject]++
    }
    return counts
  }, [mistakes])

  if (deck.length === 0) {
    return (
      <div>
        <div className="eyebrow">practice</div>
        <h2 className="page-title">Re-practice your questions</h2>
        <div className="panel panel-pad empty-state">
          <p>No questions saved yet. Upload a mistake to start building your practice deck.</p>
          <Link to="/app/upload" className="btn" style={{ marginTop: 16 }}>
            Upload a mistake
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="practice-page">
      <div className="practice-header">
        <div>
          <div className="eyebrow">practice deck</div>
          <h2 className="page-title">Re-practice your questions</h2>
          <p className="page-lede">
            Work through every question you've submitted — {deck.length} total
            {filterSubject ? ` in ${filterSubject}` : ''}.
          </p>
        </div>
      </div>

      <div className="practice-filters">
        <Link
          to="/app/practice"
          className={`filter-chip ${!filterSubject ? 'active' : ''}`}
        >
          All ({mistakes.length})
        </Link>
        {Object.entries(bySubject).map(([subj, count]) =>
          count > 0 ? (
            <Link
              key={subj}
              to={`/app/practice?subject=${subj}`}
              className={`filter-chip ${filterSubject === subj ? 'active' : ''}`}
            >
              {subj} ({count})
            </Link>
          ) : null
        )}
      </div>

      {current && (
        <QuestionCard
          mistake={current}
          index={index}
          total={deck.length}
          showAnswer={showAnswer}
          onToggleAnswer={() => setShowAnswer(true)}
          onNext={goNext}
          onPrev={goPrev}
        />
      )}

      {index === deck.length - 1 && showAnswer && (
        <div className="panel panel-pad practice-done">
          <p>You've reached the end of your deck.</p>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setIndex(0)
              setShowAnswer(false)
            }}
          >
            Start over
          </button>
        </div>
      )}
    </div>
  )
}
