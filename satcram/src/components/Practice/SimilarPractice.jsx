import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from '../../lib/router.jsx'
import { useStore } from '../../App.jsx'
import { generatePracticeSet, recentPracticeStyles } from '../../lib/practiceClient.js'
import { takeTutorHandoff } from '../../lib/tutorHandoff.js'
import RichText from '../RichText.jsx'
import { SUBJECT_COLORS } from '../../data/domains.js'

export default function SimilarPractice() {
  const { addPracticeAttempt } = useStore()
  const [params] = useSearchParams()
  const [questions, setQuestions] = useState([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const source = takeTutorHandoff(params.get('handoff'))
    if (!source?.sourceQuestion && !source?.sourceImage) {
      setError('We could not find the submitted question. Return to the tutor and choose “Practice similar questions” again.')
      setLoading(false)
      return
    }
    generatePracticeSet({
      subject: source.subject || 'Math',
      topic: source.topic || 'Submitted-question concept',
      topics: source.topic ? [source.topic] : [],
      sourceQuestion: source.sourceQuestion || '',
      sourceImage: source.sourceImage || '',
      similarToSubmitted: true,
      recentStyleTags: recentPracticeStyles(),
    }).then((freshQuestions) => setQuestions(freshQuestions)).catch((err) => setError(err.message || 'Could not create a similar practice set.')).finally(() => setLoading(false))
  }, [params])

  const current = questions[index]
  function submit() { if (!selected || !current) return; addPracticeAttempt(current, selected); setSubmitted(true) }
  function next() { setIndex((value) => Math.min(value + 1, questions.length - 1)); setSelected(null); setSubmitted(false) }

  return <div className="practice-page similar-practice-page">
    <div className="practice-header"><div className="eyebrow">submitted-question practice</div><h2 className="page-title">Hard questions built from the concept you submitted.</h2><p className="page-lede">Every question is original, changes the values or framing, and is saved to your personal generated question bank.</p></div>
    {loading && <div className="panel panel-pad"><span className="btn-spinner" aria-hidden="true" /> Building 10 hard variations from your submitted question…</div>}
    {error && <div className="panel panel-pad practice-status">{error}<div className="lesson-actions"><Link to="/app/tutor" className="btn">Return to tutor</Link></div></div>}
    {current && <div className="practice-card panel">
      <div className="practice-card-head"><div className="practice-tags"><span className={`subject-tag ${SUBJECT_COLORS[current.subject] || ''}`}>{current.subject}</span><span className="topic-tag">{current.topic}</span><span className="domain-tag">Hard</span></div><span className="practice-counter mono">{index + 1} / {questions.length}</span></div>
      <div className="practice-question"><RichText text={current.prompt} /></div>
      <div className="answer-choice-list">{current.choices.map((choice) => <button type="button" key={choice} disabled={submitted} onClick={() => setSelected(choice)} className={`answer-choice ${selected === choice ? 'selected' : ''} ${submitted && choice === current.answer ? 'correct-choice' : ''} ${submitted && selected === choice && choice !== current.answer ? 'incorrect-choice' : ''}`}><RichText text={choice} /></button>)}</div>
      {submitted && <div className="practice-feedback">{selected === current.answer ? <strong>Correct — you transferred the idea.</strong> : <div className="correct-answer"><strong>Not quite.</strong><span>The correct answer is</span><RichText text={current.answer} /></div>}<RichText text={current.explanation} /></div>}
      <div className="practice-nav">{submitted ? <button type="button" className="btn" onClick={next} disabled={index === questions.length - 1}>Next question</button> : <button type="button" className="btn" disabled={!selected} onClick={submit}>Check answer</button>}<Link to="/app/tutor" className="btn btn-ghost">Back to tutor</Link></div>
    </div>}
  </div>
}
