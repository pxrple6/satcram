import React, { useState } from 'react'
import { useStore } from '../../App.jsx'
import { TAXONOMY, SUBJECTS } from '../../data/topics.js'
import DiagnosticReport from '../Analysis/DiagnosticReport.jsx'
import ImageDropzone from './ImageDropzone.jsx'

const SOURCES = [
  'Khan Academy',
  'Bluebook',
  'Official Practice Test',
  'School worksheet',
  'Princeton Review',
  "Tutor's homework",
  'Manual entry',
]

export default function MistakeUpload() {
  const { addMistake } = useStore()
  const [subject, setSubject] = useState('Math')
  const [topic, setTopic] = useState(TAXONOMY.Math[0])
  const [source, setSource] = useState('Khan Academy')
  const [questionText, setQuestionText] = useState('')
  const [studentAnswer, setStudentAnswer] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [images, setImages] = useState([])
  const [report, setReport] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const hasImage = images.length > 0
  const canSubmit =
    (questionText.trim() || hasImage) && studentAnswer.trim() && correctAnswer.trim()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    setReport(null)
    setError('')

    try {
      const record = await addMistake({
        subject,
        topic,
        source,
        questionText,
        studentAnswer,
        correctAnswer,
        images: images.map((img) => img.dataUrl),
      })
      setReport(record)
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  function handleSubjectChange(s) {
    setSubject(s)
    setTopic(TAXONOMY[s][0])
  }

  return (
    <div className="upload-page">
      <div className="eyebrow">step 1</div>
      <h2 className="page-title">Bring in a mistake</h2>
      <p className="page-lede">
        Screenshot a Bluebook question, paste from your clipboard, or type it in. SATcram reads
        the image with OpenAI and diagnoses the reasoning error — not just whether you got it wrong.
      </p>

      <form onSubmit={handleSubmit} className="panel panel-pad upload-form">
        <div className="upload-layout">
          <section className="upload-images-section">
            <div className="upload-section-label">
              <span>Question screenshot</span>
              <span className="upload-optional">{hasImage ? 'attached' : 'recommended'}</span>
            </div>
            <ImageDropzone images={images} onChange={setImages} />
            {hasImage && (
              <p className="upload-hint">
                Question text below is optional — the AI reads your screenshot directly.
              </p>
            )}
          </section>

          <section className="upload-details-section">
            <div className="field-row field-row-3">
              <label className="field">
                Subject
                <select value={subject} onChange={(e) => handleSubjectChange(e.target.value)}>
                  {SUBJECTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Topic
                <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                  {TAXONOMY[subject].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Source
                <select value={source} onChange={(e) => setSource(e.target.value)}>
                  {SOURCES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field">
              Question text {hasImage ? '(optional)' : ''}
              <textarea
                rows={3}
                placeholder={
                  hasImage
                    ? 'Add extra context if the screenshot is cropped…'
                    : 'Paste or type the question text…'
                }
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
              />
            </label>

            <div className="field-row field-row-2">
              <label className="field">
                Your answer
                <input
                  type="text"
                  placeholder="What you picked"
                  value={studentAnswer}
                  onChange={(e) => setStudentAnswer(e.target.value)}
                />
              </label>
              <label className="field">
                Correct answer
                <input
                  type="text"
                  placeholder="The right answer"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                />
              </label>
            </div>

            {error && <div className="upload-error">{error}</div>}

            <button type="submit" className="btn btn-analyze" disabled={!canSubmit || busy}>
              {busy ? (
                <>
                  <span className="btn-spinner" aria-hidden="true" />
                  Analyzing with AI…
                </>
              ) : (
                'Analyze mistake'
              )}
            </button>
          </section>
        </div>
      </form>

      {report && (
        <div className="upload-report">
          <DiagnosticReport report={report} />
        </div>
      )}
    </div>
  )
}
