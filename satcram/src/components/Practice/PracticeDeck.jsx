import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from '../../lib/router.jsx'
import { useStore } from '../../App.jsx'
import { PRACTICE_BANK } from '../../data/practiceBank.js'
import { SUBJECT_COLORS } from '../../data/domains.js'
import RichText from '../RichText.jsx'
import { generatePracticeSet, recentPracticeStyles } from '../../lib/practiceClient.js'

function priorityDeck(mistakes, subject) {
  const weakTopics = [...mistakes]
    .filter((m) => m.correctness === 'Incorrect')
    .reduce((counts, m) => ({ ...counts, [m.topic]: (counts[m.topic] || 0) + 1 }), {})
  return PRACTICE_BANK
    .filter((q) => !subject || q.subject === subject)
    .map((question) => ({ question, priority: weakTopics[question.topic] || 0, tieBreaker: Math.random() }))
    .sort((a, b) => b.priority - a.priority || a.tieBreaker - b.tieBreaker)
    .map(({ question }) => question)
}

export default function PracticeDeck() {
  const { mistakes, addPracticeAttempt } = useStore()
  const [searchParams] = useSearchParams()
  const filterSubject = searchParams.get('subject') || ''
  const filterTopic = searchParams.get('topic') || ''
  const rankedDeck = useMemo(() => priorityDeck(mistakes, filterSubject).filter((question) => !filterTopic || question.topic === filterTopic), [mistakes, filterSubject, filterTopic])
  // Freeze a session at its first question. Recording an answer updates the
  // student's future recommendations, never the question currently on screen.
  const [sessionNumber, setSessionNumber] = useState(0)
  const [deck, setDeck] = useState(() => priorityDeck(mistakes, filterSubject).filter((question) => !filterTopic || question.topic === filterTopic).slice(0, 10))
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [loadingFresh, setLoadingFresh] = useState(false)
  const [freshError, setFreshError] = useState('')
  useEffect(() => { setDeck(priorityDeck(mistakes, filterSubject).filter((question) => !filterTopic || question.topic === filterTopic).slice(0, 10)); setIndex(0); setSelected(null); setSubmitted(false); setSessionNumber(0) }, [filterSubject, filterTopic])
  useEffect(() => {
    let cancelled = false
    const priorityTopics = [...new Set(priorityDeck(mistakes, filterSubject).map((question) => question.topic))]
    const rankedTopics = [...new Set([
      ...priorityTopics.slice(0, 2),
      ...(filterSubject && filterSubject !== 'Math' ? priorityTopics.slice(2, 4) : ['Functions', 'Quadratics']),
    ])].slice(0, 4)
    const focus = priorityDeck(mistakes, filterSubject).find((question) => !filterTopic || question.topic === filterTopic)
    setLoadingFresh(true); setFreshError('')
    generatePracticeSet({ subject: filterSubject || focus?.subject || 'Mixed SAT', topic: filterTopic || focus?.topic || 'Mixed SAT skills', topics: filterTopic ? [filterTopic] : rankedTopics, recentStyleTags: recentPracticeStyles() })
      .then((questions) => { if (!cancelled) { setDeck(questions); setIndex(0); setSelected(null); setSubmitted(false) } })
      .catch(() => { if (!cancelled) setFreshError('Showing a fresh local set while AI questions are unavailable.') })
      .finally(() => { if (!cancelled) setLoadingFresh(false) })
    return () => { cancelled = true }
  }, [filterSubject, filterTopic])
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
    const fullDeck = priorityDeck(mistakes, filterSubject).filter((question) => !filterTopic || question.topic === filterTopic)
    const nextSession = sessionNumber + 1
    const offset = (nextSession * 10) % fullDeck.length
    const nextDeck = [...fullDeck.slice(offset), ...fullDeck.slice(0, offset)].slice(0, 10)
    setDeck(nextDeck); setSessionNumber(nextSession); setIndex(0); setSelected(null); setSubmitted(false)
  }
  function openTutorForQuestion() {
    try {
      localStorage.setItem('satcram_tutor_handoff', JSON.stringify({
        prompt: current.prompt,
        choices: current.choices,
        studentAnswer: selected,
        correctAnswer: current.answer,
        subject: current.subject,
        topic: current.topic,
        incorrect: selected !== current.answer,
      }))
    } catch {
      // The normal tutor route still works if browser storage is unavailable.
    }
  }
  const bySubject = ['Math', 'Reading', 'Writing'].map((subject) => ({ subject, count: PRACTICE_BANK.filter((q) => q.subject === subject).length }))

  return (
    <div className="practice-page">
      <div className="practice-header"><div><div className="eyebrow">adaptive practice · 10-question set</div><h2 className="page-title">Fresh SAT-style questions, built around your weak spots.</h2><p className="page-lede">Every AI-built set uses ten different reasoning styles and avoids styles from your recent sets. Show your work in the tutor whenever you want feedback on the exact step that went wrong.</p>{loadingFresh && <p className="practice-status">Building your fresh set…</p>}{freshError && <p className="practice-status">{freshError}</p>}</div></div>
      <div className="practice-filters">
        <Link to="/app/practice" className={`filter-chip ${!filterSubject ? 'active' : ''}`}>Recommended ({PRACTICE_BANK.length})</Link>
        {bySubject.map(({ subject, count }) => <Link key={subject} to={`/app/practice?subject=${subject}`} className={`filter-chip ${filterSubject === subject ? 'active' : ''}`}>{subject} ({count})</Link>)}
      </div>
      {current && <div className="practice-card panel">
        <div className="practice-card-head"><div className="practice-tags"><span className={`subject-tag ${SUBJECT_COLORS[current.subject] || ''}`}>{current.subject}</span><span className="topic-tag">{current.topic}</span><span className="domain-tag">{current.difficulty}</span>{current.styleTag && <span className="domain-tag">{current.styleTag.replaceAll('-', ' ')}</span>}</div><span className="practice-counter mono">{index + 1} / {deck.length}</span></div>
        <div className="practice-question"><RichText text={current.prompt} /></div>
        <div className="answer-choice-list">{current.choices.map((choice) => <button type="button" key={choice} disabled={submitted} onClick={() => setSelected(choice)} className={`answer-choice ${selected === choice ? 'selected' : ''} ${submitted && choice === current.answer ? 'correct-choice' : ''} ${submitted && selected === choice && choice !== current.answer ? 'incorrect-choice' : ''}`}><RichText text={choice} /></button>)}</div>
        {submitted && <div className="practice-feedback">{selected === current.answer ? <strong>Correct — nice work.</strong> : <div className="correct-answer"><strong>Not quite.</strong><span>The correct answer is</span><RichText text={current.answer} /></div>}<RichText text={current.explanation} /></div>}
        <div className="practice-nav">{submitted ? <button type="button" className="btn" onClick={next} disabled={index === deck.length - 1}>Next question</button> : <button type="button" className="btn" disabled={!selected} onClick={submit}>Check answer</button>}<Link to={`/app/tutor?practice=${current.id}`} onClick={openTutorForQuestion} className="btn btn-ghost">{submitted && selected !== current.answer ? 'Tutor this miss' : 'Work through with tutor'}</Link></div>
      </div>}
      {submitted && index === deck.length - 1 && <div className="panel panel-pad practice-done"><div><div className="eyebrow">set complete</div><h3>Building your next study step.</h3><p>Opening your personalized study plan now…</p></div><div className="practice-done-actions"><Link to="/app/plan" className="btn">Open plan now</Link><button type="button" className="btn btn-ghost" onClick={startAnotherSet}>Start another set</button></div></div>}
    </div>
  )
}
