import React, { useMemo, useState } from 'react'
import { Link, useSearchParams } from '../../lib/router.jsx'
import { useStore } from '../../App.jsx'
import { PRACTICE_BANK } from '../../data/practiceBank.js'
import { SUBJECT_COLORS } from '../../data/domains.js'
import RichText from '../RichText.jsx'

function priorityDeck(mistakes, subject) {
  const weakTopics = [...mistakes]
    .filter((m) => m.correctness === 'Incorrect')
    .reduce((counts, m) => ({ ...counts, [m.topic]: (counts[m.topic] || 0) + 1 }), {})
  return PRACTICE_BANK
    .filter((q) => !subject || q.subject === subject)
    .sort((a, b) => (weakTopics[b.topic] || 0) - (weakTopics[a.topic] || 0))
}

export default function PracticeDeck() {
  const { mistakes, addPracticeAttempt } = useStore()
  const [searchParams] = useSearchParams()
  const filterSubject = searchParams.get('subject') || ''
  const deck = useMemo(() => priorityDeck(mistakes, filterSubject), [mistakes, filterSubject])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const current = deck[index]

  function next() { setIndex((i) => Math.min(i + 1, deck.length - 1)); setSelected(null); setSubmitted(false) }
  function submit() { if (!selected) return; addPracticeAttempt(current, selected); setSubmitted(true) }
  const bySubject = ['Math', 'Reading', 'Writing'].map((subject) => ({ subject, count: PRACTICE_BANK.filter((q) => q.subject === subject).length }))

  return (
    <div className="practice-page">
      <div className="practice-header"><div><div className="eyebrow">adaptive practice</div><h2 className="page-title">Questions chosen from your weak spots.</h2><p className="page-lede">Original SAT-style questions. Misses move matching skills to the front of your next session.</p></div></div>
      <div className="practice-filters">
        <Link to="/app/practice" className={`filter-chip ${!filterSubject ? 'active' : ''}`}>Recommended ({PRACTICE_BANK.length})</Link>
        {bySubject.map(({ subject, count }) => <Link key={subject} to={`/app/practice?subject=${subject}`} className={`filter-chip ${filterSubject === subject ? 'active' : ''}`}>{subject} ({count})</Link>)}
      </div>
      {current && <div className="practice-card panel">
        <div className="practice-card-head"><div className="practice-tags"><span className={`subject-tag ${SUBJECT_COLORS[current.subject] || ''}`}>{current.subject}</span><span className="topic-tag">{current.topic}</span><span className="domain-tag">{current.difficulty}</span></div><span className="practice-counter mono">{index + 1} / {deck.length}</span></div>
        <div className="practice-question"><RichText text={current.prompt} /></div>
        <div className="answer-choice-list">{current.choices.map((choice) => <button type="button" key={choice} disabled={submitted} onClick={() => setSelected(choice)} className={`answer-choice ${selected === choice ? 'selected' : ''} ${submitted && choice === current.answer ? 'correct-choice' : ''} ${submitted && selected === choice && choice !== current.answer ? 'incorrect-choice' : ''}`}><RichText text={choice} /></button>)}</div>
        {submitted && <div className="practice-feedback"><strong>{selected === current.answer ? 'Correct — nice work.' : <><span>Not quite. The correct answer is </span><RichText text={current.answer} /></>}</strong><RichText text={current.explanation} /></div>}
        <div className="practice-nav">{submitted ? <button type="button" className="btn" onClick={next} disabled={index === deck.length - 1}>Next question</button> : <button type="button" className="btn" disabled={!selected} onClick={submit}>Check answer</button>}<Link to="/app/tutor" className="btn btn-ghost">Ask the tutor</Link></div>
      </div>}
      {submitted && index === deck.length - 1 && <div className="panel panel-pad practice-done">You’ve completed this set. Your results are now part of your study plan.</div>}
    </div>
  )
}
