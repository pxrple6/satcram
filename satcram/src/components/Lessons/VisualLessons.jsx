import React, { useMemo, useState } from 'react'
import { Link, useSearchParams } from '../../lib/router.jsx'
import { useStore } from '../../App.jsx'
import RichText from '../RichText.jsx'

function visualFor(subject, topic) {
  if (subject === 'Math') return { kicker: 'See the relationship', title: `${topic}: make the invisible visible`, idea: 'Change one value at a time, then follow what the equation does.', steps: ['Label what changes', 'Show the relationship', 'Check one concrete example'] }
  if (subject === 'Reading') return { kicker: 'Follow the evidence', title: `${topic}: prove it from the text`, idea: 'Start with the exact words in the passage, then eliminate choices that reach further.', steps: ['Read the question', 'Underline proof', 'Match the claim'] }
  return { kicker: 'See the sentence structure', title: `${topic}: make the rule visible`, idea: 'Separate the parts of the sentence before choosing the punctuation or transition.', steps: ['Find the core sentence', 'Name the relationship', 'Choose the cleanest rule'] }
}

function LinearEquationLab() {
  const [slope, setSlope] = useState(2)
  const [intercept, setIntercept] = useState(1)
  const toX = (x) => 180 + x * 28
  const toY = (y) => 125 - y * 18
  const equation = `y = ${slope}x ${intercept >= 0 ? '+' : '−'} ${Math.abs(intercept)}`
  const start = { x: -4, y: slope * -4 + intercept }
  const end = { x: 4, y: slope * 4 + intercept }
  return <div className="linear-lab">
    <div className="lab-equation"><RichText text={`$${equation}$`} /></div>
    <svg className="lab-graph" viewBox="0 0 360 250" role="img" aria-label={`Graph of ${equation}`}>
      {[-4, -2, 0, 2, 4].map((n) => <React.Fragment key={n}><line x1={toX(n)} x2={toX(n)} y1="16" y2="234" className="graph-grid" /><line x1="34" x2="326" y1={toY(n)} y2={toY(n)} className="graph-grid" /></React.Fragment>)}
      <line x1="34" x2="326" y1="125" y2="125" className="graph-axis" /><line x1="180" x2="180" y1="16" y2="234" className="graph-axis" />
      <line x1={toX(start.x)} y1={toY(start.y)} x2={toX(end.x)} y2={toY(end.y)} className="graph-slope-line" />
      <circle cx={toX(0)} cy={toY(intercept)} r="5" className="graph-dot" /><text x="313" y="118" className="graph-label">x</text><text x="187" y="27" className="graph-label">y</text>
    </svg>
    <div className="lab-controls"><label>Slope <input aria-label="Slope" type="range" min="-3" max="3" value={slope} onChange={(event) => setSlope(Number(event.target.value))} /><b>{slope}</b></label><label>Starting value <input aria-label="Starting value" type="range" min="-4" max="4" value={intercept} onChange={(event) => setIntercept(Number(event.target.value))} /><b>{intercept}</b></label></div>
    <p className="lab-caption">Move the sliders: slope tilts the line; the starting value moves it up or down.</p>
  </div>
}

function AnimatedDiagram({ subject, topic }) {
  if (subject === 'Math' && topic === 'Linear Equations') return <LinearEquationLab />
  if (subject === 'Math') return <div className="lesson-diagram math-diagram"><strong>Interactive lesson coming next</strong><span className="diagram-caption">Start with targeted practice and the tutor while we build this skill’s concept lab.</span></div>
  if (subject === 'Reading') return <div className="lesson-diagram reading-diagram"><span className="passage-line line-one">Passage evidence</span><span className="passage-line line-two">specific words →</span><span className="evidence-card">best-supported answer</span><span className="diagram-caption">The answer must be proved, not just plausible.</span></div>
  return <div className="lesson-diagram writing-diagram"><span className="sentence-chip">Independent clause</span><span className="diagram-arrow">→</span><span className="sentence-chip accent">relationship</span><span className="diagram-arrow">→</span><span className="sentence-chip">correct rule</span><span className="diagram-caption">Build the sentence before editing it.</span></div>
}

export default function VisualLessons() {
  const { mastery, mistakes } = useStore()
  const [params] = useSearchParams()
  const ranked = useMemo(() => Object.entries(mastery).map(([topic, score]) => {
    const example = mistakes.find((m) => m.topic === topic)
    return { topic, score, subject: example?.subject || 'Math' }
  }).sort((a, b) => a.score - b.score), [mastery, mistakes])
  const selectedTopic = params.get('topic')
  const selected = ranked.find((item) => item.topic === selectedTopic) || ranked[0]

  if (!selected) return <div className="lessons-page"><div className="eyebrow">visual lessons</div><h2 className="page-title">Your visual lessons will appear here.</h2><p className="page-lede">Answer a few practice questions or log a miss first. We’ll turn the weakest skill into a focused visual explanation.</p><Link to="/app/practice" className="btn">Start practice</Link></div>

  const lesson = visualFor(selected.subject, selected.topic)
  return <div className="lessons-page">
    <div className="eyebrow">visual lesson · built from your weak spot</div>
    <h2 className="page-title">{selected.topic}: learn the idea, then practise it.</h2>
    <p className="page-lede">{lesson.idea}</p>
    <div className="lesson-layout">
      <section className="panel lesson-stage"><AnimatedDiagram subject={selected.subject} topic={selected.topic} /></section>
      <section className="panel panel-pad lesson-steps"><div className="eyebrow">{lesson.kicker}</div>{lesson.steps.map((step, index) => <div className="lesson-step" key={step}><span>{index + 1}</span><p>{step}</p></div>)}<RichText text={selected.subject === 'Math' ? 'For example, watch how $y = 2x + 1$ changes when $x$ moves by one.' : 'Use this pattern on a fresh question while the idea is still visible.'} /><div className="lesson-actions"><Link to={`/app/practice?subject=${selected.subject}`} className="btn">Practice this skill</Link><Link to="/app/tutor" className="btn btn-ghost">Ask the tutor</Link></div></section>
    </div>
    <section className="lesson-topic-strip"><div className="eyebrow">choose another weak spot</div>{ranked.slice(0, 5).map((item) => <Link key={item.topic} to={`/app/lessons?topic=${encodeURIComponent(item.topic)}`} className={`lesson-topic ${item.topic === selected.topic ? 'active' : ''}`}><span>{item.topic}</span><small>{item.score}%</small></Link>)}</section>
  </div>
}
