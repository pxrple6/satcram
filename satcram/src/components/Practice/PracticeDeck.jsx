import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from '../../lib/router.jsx'
import { useStore } from '../../App.jsx'
import { PRACTICE_BANK } from '../../data/practiceBank.js'
import { SUBJECT_COLORS } from '../../data/domains.js'
import RichText from '../RichText.jsx'
import { generatePracticeSet } from '../../lib/practiceClient.js'

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
  const rankedDeck = useMemo(() => priorityDeck(mistakes, filterSubject), [mistakes, filterSubject])
  // Freeze a session at its first question. Recording an answer updates the
  // student's future recommendations, never the question currently on screen.
  const [sessionNumber, setSessionNumber] = useState(0)
  const [deck, setDeck] = useState(() => priorityDeck(mistakes, filterSubject).slice(0, 10))
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [loadingFresh, setLoadingFresh] = useState(false)
  const [freshError, setFreshError] = useState('')
  useEffect(() => { setDeck(priorityDeck(mistakes, filterSubject).slice(0, 10)); setIndex(0); setSelected(null); setSubmitted(false); setSessionNumber(0) }, [filterSubject])
  useEffect(() => {
    let cancelled = false
    const focus = priorityDeck(mistakes, filterSubject)[0]
    setLoadingFresh(true); setFreshError('')
    generatePracticeSet({ subject: filterSubject || focus?.subject || 'Math', topic: focus?.topic || 'Mixed SAT skills' })
      .then((questions) => { if (!cancelled) { setDeck(questions); setIndex(0); setSelected(null); setSubmitted(false) } })
      .catch(() => { if (!cancelled) setFreshError('Showing a fresh local set while AI questions are unavailable.') })
      .finally(() => { if (!cancelled) setLoadingFresh(false) })
    return () => { cancelled = true }
  }, [filterSubject])
  const current = deck[index]

  function next() { setIndex((i) => Math.min(i + 1, deck.length - 1)); setSelected(null); setSubmitted(false) }
  function submit() {
    if (!selected) return
    addPracticeAttempt(current, selected); setSubmitted(true)
    if (index === deck.length - 1) {
      window.setTimeout(() => {
        window.history.pushState({}, '', '/app/plan')
        window.dispatchEvent(new Event('satcram:navigate'))
      }, 1800)
    }
  }
  function startAnotherSet() {
    const fullDeck = priorityDeck(mistakes, filterSubject)
    const nextSession = sessionNumber + 1
    const offset = (nextSession * 10) % fullDeck.length
    const nextDeck = [...fullDeck.slice(offset), ...fullDeck.slice(0, offset)].slice(0, 10)
    setDeck(nextDeck); setSessionNumber(nextSession); setIndex(0); setSelected(null); setSubmitted(false)
  }
  const bySubject = ['Math', 'Reading', 'Writing'].map((subject) => ({ subject, count: PRACTICE_BANK.filter((q) => q.subject === subject).length }))

  return (
    <div className="practice-page">
      <div className="practice-header"><div><div className="eyebrow">adaptive practice · 10-question set</div><h2 className="page-title">Fresh SAT-style questions, built around your weak spots.</h2><p className="page-lede">AI creates a new original set when you arrive. Show your work in the tutor whenever you want feedback on the exact step that went wrong.</p>{loadingFresh && <p className="practice-status">Building your fresh set…</p>}{freshError && <p className="practice-status">{freshError}</p>}</div></div>
      <div className="practice-filters">
        <Link to="/app/practice" className={`filter-chip ${!filterSubject ? 'active' : ''}`}>Recommended ({PRACTICE_BANK.length})</Link>
        {bySubject.map(({ subject, count }) => <Link key={subject} to={`/app/practice?subject=${subject}`} className={`filter-chip ${filterSubject === subject ? 'active' : ''}`}>{subject} ({count})</Link>)}
      </div>
      {current && <div className="practice-card panel">
        <div className="practice-card-head"><div className="practice-tags"><span className={`subject-tag ${SUBJECT_COLORS[current.subject] || ''}`}>{current.subject}</span><span className="topic-tag">{current.topic}</span><span className="domain-tag">{current.difficulty}</span></div><span className="practice-counter mono">{index + 1} / {deck.length}</span></div>
        <div className="practice-question"><RichText text={current.prompt} /></div>
        <div className="answer-choice-list">{current.choices.map((choice) => <button type="button" key={choice} disabled={submitted} onClick={() => setSelected(choice)} className={`answer-choice ${selected === choice ? 'selected' : ''} ${submitted && choice === current.answer ? 'correct-choice' : ''} ${submitted && selected === choice && choice !== current.answer ? 'incorrect-choice' : ''}`}><RichText text={choice} /></button>)}</div>
        {submitted && <div className="practice-feedback">{selected === current.answer ? <strong>Correct — nice work.</strong> : <div className="correct-answer"><strong>Not quite.</strong><span>The correct answer is</span><RichText text={current.answer} /></div>}<RichText text={current.explanation} /></div>}
        <div className="practice-nav">{submitted ? <button type="button" className="btn" onClick={next} disabled={index === deck.length - 1}>Next question</button> : <button type="button" className="btn" disabled={!selected} onClick={submit}>Check answer</button>}<Link to={`/app/tutor?practice=${current.id}`} className="btn btn-ghost">Work through with tutor</Link></div>
      </div>}
      {submitted && index === deck.length - 1 && <div className="panel panel-pad practice-done"><div><div className="eyebrow">set complete</div><h3>Building your next study step.</h3><p>Opening your personalized study plan now…</p></div><div className="practice-done-actions"><Link to="/app/plan" className="btn">Open plan now</Link><button type="button" className="btn btn-ghost" onClick={startAnotherSet}>Start another set</button></div></div>}
    </div>
  )
}
