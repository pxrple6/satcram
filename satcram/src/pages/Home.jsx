import React from 'react'
import { Link } from '../lib/router.jsx'
import SiteHeader from '../components/Marketing/SiteHeader.jsx'
import { upcomingSatDates, formatCountdown } from '../data/satDates.js'

const STEPS = [
  {
    title: 'Upload a mistake',
    body: 'Screenshot a question from Bluebook or paste the text. Add your answer and the correct one.',
  },
  {
    title: 'Get a diagnosis',
    body: 'AI identifies the reasoning error, confidence level, and recurring pattern behind the miss.',
  },
  {
    title: 'Study what matters',
    body: 'Your dashboard, study plan, and tutor all build from your actual mistake history.',
  },
]

const FEATURES = [
  { title: 'Mistake DNA', body: 'Topic-by-topic mastery across Math, Reading, and Writing.' },
  { title: 'Score prediction', body: 'Estimated SAT score that updates as your accuracy improves.' },
  { title: 'Study plan', body: 'Daily focus areas paced to your SAT date and weak spots.' },
  { title: 'AI tutor', body: 'Walk through any question — hints first, full explanation when you need it.' },
  { title: 'Practice deck', body: 'Re-visit every question you have uploaded.' },
  { title: 'Mistake journal', body: 'Searchable history of every analyzed question.' },
]

export default function Home() {
  const upcoming = upcomingSatDates().slice(0, 4)

  return (
    <div className="home">
      <section className="home-hero">
        <SiteHeader />
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="hero-label">SAT prep from your mistakes</p>
            <h1>Turn wrong answers into a study plan that actually fits you.</h1>
            <p className="hero-lede">
              Upload questions you missed. SATcram diagnoses the reasoning error, tracks patterns over time,
              and builds your practice deck and study plan from real data — not a generic question bank.
            </p>
            <div className="hero-actions">
              <Link to="/signup" className="btn">
                Get started free
              </Link>
              <Link to="/app/upload" className="btn btn-ghost">
                Try without signing up
              </Link>
            </div>
          </div>

          <div className="hero-preview panel">
            <div className="preview-header">
              <span className="preview-dot" />
              <span className="preview-dot" />
              <span className="preview-dot" />
              <span className="preview-title">Your dashboard</span>
            </div>
            <div className="preview-body">
              <div className="preview-stat">
                <span className="eyebrow">Predicted score</span>
                <strong>1340</strong>
              </div>
              <div className="preview-stat">
                <span className="eyebrow">Accuracy</span>
                <strong>72%</strong>
              </div>
              <div className="preview-stat">
                <span className="eyebrow">Needs review</span>
                <strong className="review">5</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {upcoming.length > 0 && (
        <section className="home-section sat-dates-section">
          <div className="section-inner">
            <h2>Upcoming SAT dates</h2>
            <p className="section-lede">Pick your test date in the app to get a paced study plan.</p>
            <div className="sat-dates-grid">
              {upcoming.map((d) => (
                <div key={d.date} className="sat-date-chip panel">
                  <span className="sat-date-label">{d.label}</span>
                  <span className="sat-date-countdown">{formatCountdown(d.date)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="home-section" id="how-it-works">
        <div className="section-inner">
          <h2>How it works</h2>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div key={s.title} className="step-item">
                <span className="step-num">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-section-alt" id="features">
        <div className="section-inner">
          <h2>Built around your mistakes</h2>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-item panel panel-pad">
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-cta">
        <div className="section-inner cta-inner">
          <div>
            <h2>Ready to start?</h2>
            <p>Upload your first mistake — free, no credit card required.</p>
          </div>
          <Link to="/app/upload" className="btn">
            Upload a mistake
          </Link>
        </div>
      </section>

      <footer className="site-footer">
        <span>SATcram</span>
        <span>Built for students who fix patterns, not repeat them.</span>
      </footer>
    </div>
  )
}
