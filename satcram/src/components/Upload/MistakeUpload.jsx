import React, { useState } from 'react'
import { useStore } from '../../App.jsx'
import DiagnosticReport from '../Analysis/DiagnosticReport.jsx'
import ImageDropzone from './ImageDropzone.jsx'

export default function MistakeUpload() {
  const { addMistake } = useStore()
  const [questionText, setQuestionText] = useState('')
  const [studentAnswer, setStudentAnswer] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [images, setImages] = useState([])
  const [showDetails, setShowDetails] = useState(false)
  const [report, setReport] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const hasImage = images.length > 0
  const canSubmit = questionText.trim() || hasImage

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setBusy(true); setReport(null); setError('')
    try {
      const record = await addMistake({
        source: 'Student upload',
        questionText,
        studentAnswer: studentAnswer || 'Not provided',
        correctAnswer: correctAnswer || 'Not provided',
        images: images.map((img) => img.dataUrl),
      })
      setReport(record)
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
    } finally { setBusy(false) }
  }

  return (
    <div className="upload-page">
      <div className="eyebrow">log a question</div>
      <h2 className="page-title">Drop in a question you missed.</h2>
      <p className="page-lede">Paste it or add a screenshot. SATcram identifies the SAT subject, skill, answer choices, and likely mistake pattern for you.</p>

      <form onSubmit={handleSubmit} className="panel panel-pad upload-form simple-upload-form">
        <div className="upload-layout">
          <section className="upload-images-section">
            <div className="upload-section-label"><span>Screenshot</span><span className="upload-optional">optional</span></div>
            <ImageDropzone images={images} onChange={setImages} />
          </section>
          <section className="upload-details-section">
            <label className="field">
              Paste the question {hasImage ? '(or add extra context)' : ''}
              <textarea rows={6} placeholder="Paste an SAT Math or Reading & Writing question…" value={questionText} onChange={(e) => setQuestionText(e.target.value)} />
            </label>
            <button type="button" className="text-action" onClick={() => setShowDetails((shown) => !shown)}>
              {showDetails ? 'Hide answer details' : 'Add the answer I chose (optional)'}
            </button>
            {showDetails && (
              <div className="field-row field-row-2 upload-details-reveal">
                <label className="field">Your answer<input type="text" placeholder="What you picked" value={studentAnswer} onChange={(e) => setStudentAnswer(e.target.value)} /></label>
                <label className="field">Correct answer<input type="text" placeholder="If you know it" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} /></label>
              </div>
            )}
            <p className="upload-hint">You can correct the AI’s labels after it analyzes the question. No subject or topic form required.</p>
            {error && <div className="upload-error">{error}</div>}
            <button type="submit" className="btn btn-analyze" disabled={!canSubmit || busy}>
              {busy ? <><span className="btn-spinner" aria-hidden="true" />Reading your question…</> : 'Find the skill and next step'}
            </button>
          </section>
        </div>
      </form>
      {report && <div className="upload-report"><DiagnosticReport report={report} /></div>}
    </div>
  )
}
