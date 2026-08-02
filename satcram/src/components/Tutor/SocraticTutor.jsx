import React, { useEffect, useRef, useState } from 'react'
import ImageDropzone from '../Upload/ImageDropzone.jsx'
import RichText from '../RichText.jsx'
import { sendTutorMessage } from '../../lib/tutorClient.js'
import { useSearchParams } from '../../lib/router.jsx'
import { PRACTICE_BANK } from '../../data/practiceBank.js'
import WorkPad from './WorkPad.jsx'
import AnnotatedWork from './AnnotatedWork.jsx'

function ChatBubble({ role, text }) {
  const isTutor = role === 'assistant'
  return (
    <div className={`chat-bubble ${isTutor ? 'chat-tutor' : 'chat-student'}`}>
      <div className="chat-role">{isTutor ? 'Tutor' : 'You'}</div>
      {isTutor ? <RichText text={text} /> : <p>{text}</p>}
    </div>
  )
}

export default function SocraticTutor() {
  const [searchParams] = useSearchParams()
  const [questionText, setQuestionText] = useState('')
  const [images, setImages] = useState([])
  const [reviewMode, setReviewMode] = useState('question')
  const [drawnWork, setDrawnWork] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [started, setStarted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [annotation, setAnnotation] = useState(null)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)
  const startedPracticeRef = useRef(false)

  const activeImages = reviewMode === 'draw' && drawnWork ? [{ id: 'drawn-work', dataUrl: drawnWork }] : images
  const hasQuestion = questionText.trim() || activeImages.length > 0
  const hasAskedForAnswer = messages.some((m) => m.role === 'assistant')
  const studentReplies = messages.filter((m, i) => m.role === 'user' && i > 0).length
  const awaitingAnswer = started && hasAskedForAnswer && studentReplies === 0
  const canReply = started && hasAskedForAnswer && !busy

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  useEffect(() => {
    if (awaitingAnswer) inputRef.current?.focus()
  }, [awaitingAnswer])

  async function callTutor(nextMessages, options = {}) {
    setBusy(true)
    setError('')
    try {
      const { message, annotation: nextAnnotation } = await sendTutorMessage({ messages: nextMessages, workReview: options.workReview })
      setMessages([...nextMessages, { role: 'assistant', content: message }])
      if (nextAnnotation) setAnnotation(nextAnnotation)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    const practiceId = searchParams.get('practice')
    const practiceQuestion = PRACTICE_BANK.find((question) => question.id === practiceId)
    if (!practiceQuestion || startedPracticeRef.current) return
    startedPracticeRef.current = true
    const first = { role: 'user', content: practiceQuestion.prompt }
    setQuestionText(practiceQuestion.prompt)
    setStarted(true)
    setMessages([first])
    callTutor([first])
  }, [searchParams])

  async function handleStart(e) {
    e.preventDefault()
    if (!hasQuestion || busy) return

    const first = {
      role: 'user',
      content: reviewMode === 'question' ? (questionText.trim() || '(Screenshot attached — see image.)') : `WORK REVIEW MODE. ${questionText.trim() || 'Review the handwritten work in the image and identify the first step to revisit.'}`,
      images: activeImages.map((img) => img.dataUrl),
    }
    setStarted(true)
    setMessages([first])
    await callTutor([first], { workReview: reviewMode !== 'question' })
  }

  async function handleSend(text) {
    const trimmed = text.trim()
    if (!trimmed || busy || !canReply) return

    const next = [...messages, { role: 'user', content: trimmed }]
    setMessages(next)
    setInput('')
    await callTutor(next)
  }

  function handleSubmit(e) {
    e.preventDefault()
    handleSend(input)
  }

  function resetSession() {
    setStarted(false)
    setMessages([])
    setQuestionText('')
    setImages([])
    setDrawnWork('')
    setReviewMode('question')
    setInput('')
    setError('')
    setAnnotation(null)
  }

  if (!started) {
    return (
      <div className="tutor-page">
        <div className="eyebrow">AI tutor</div>
        <h2 className="page-title">Solve, then get feedback on your work.</h2>
        <p className="page-lede">
          Work through an SAT question yourself. Upload your paper or draw your steps here, and the tutor will point to the first reasoning move to fix.
        </p>

        <form onSubmit={handleStart} className="panel panel-pad tutor-setup">
          <div className="tutor-mode-switch"><button type="button" className={`filter-chip ${reviewMode === 'question' ? 'active' : ''}`} onClick={() => setReviewMode('question')}>Question only</button><button type="button" className={`filter-chip ${reviewMode === 'photo' ? 'active' : ''}`} onClick={() => setReviewMode('photo')}>Upload my work</button><button type="button" className={`filter-chip ${reviewMode === 'draw' ? 'active' : ''}`} onClick={() => setReviewMode('draw')}>Draw my work</button></div>
          <div className="upload-layout">
            <section>
              <div className="upload-section-label">
                <span>{reviewMode === 'question' ? 'Question screenshot' : reviewMode === 'photo' ? 'Photo of your work' : 'Your handwritten work'}</span>
                <span className="upload-optional">optional</span>
              </div>
              {reviewMode === 'draw' ? <WorkPad value={drawnWork} onChange={setDrawnWork} /> : <ImageDropzone images={images} onChange={setImages} maxImages={1} />}
            </section>

            <section>
              <label className="field">
                {reviewMode === 'question' ? 'Question text' : 'Original question or goal'} {activeImages.length > 0 ? '(optional)' : ''}
                <textarea
                  rows={5}
                  placeholder={
                    images.length > 0
                    ? 'Add the original question or context…'
                    : reviewMode === 'question' ? 'Paste or type the full question…' : 'Paste the question you were solving…'
                  }
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                />
              </label>

              {error && <div className="upload-error">{error}</div>}

              <button type="submit" className="btn btn-analyze" disabled={!hasQuestion || busy}>
                {busy ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true" />
                    Starting…
                  </>
                ) : (
                  reviewMode === 'question' ? 'Start session' : 'Review my work'
                )}
              </button>
            </section>
          </div>
        </form>

        <div className="tutor-flow-hint panel panel-pad">
          <div className="eyebrow">how this works</div>
          <ol className="tutor-steps">
            <li>Choose a question, photo, or drawn-work review</li>
            <li>Solve the problem in your own words or steps</li>
            <li>Tutor flags the first incorrect step only</li>
            <li>Repair that step, then continue</li>
          </ol>
        </div>
      </div>
    )
  }

  return (
    <div className="tutor-page tutor-session">
      <div className="tutor-session-head">
        <div>
          <div className="eyebrow">practice session</div>
          <h2 className="page-title" style={{ fontSize: 20 }}>
            Working through your question
          </h2>
        </div>
        <button type="button" className="btn btn-ghost" onClick={resetSession}>
          New question
        </button>
      </div>

      {activeImages.length > 0 && (
        <div className="tutor-question-images">
          {reviewMode === 'question' ? activeImages.map((img) => <img key={img.id} src={img.dataUrl} alt="Question screenshot" />) : <AnnotatedWork image={activeImages[0]?.dataUrl} annotation={annotation} />}
        </div>
      )}

      {questionText.trim() && (
        <div className="panel panel-pad tutor-question-text">
          <div className="eyebrow">question</div>
          <p>{questionText}</p>
        </div>
      )}

      <div className="tutor-chat panel">
        <div className="tutor-chat-messages">
          {messages.slice(1).map((m, i) => (
            <ChatBubble key={i} role={m.role} text={m.content} />
          ))}
          {busy && (
            <div className="chat-bubble chat-tutor chat-typing">
              <div className="chat-role">Tutor</div>
              <span className="btn-spinner" aria-hidden="true" />
              Thinking…
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="tutor-chat-input">
          {awaitingAnswer && (
            <p className="tutor-prompt">The tutor is waiting for your answer.</p>
          )}

          {canReply && (
            <div className="tutor-quick-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleSend('I need a hint')}>
                I need a hint
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => handleSend('Explain the whole question to me')}
              >
                Explain it fully
              </button>
            </div>
          )}

          {error && <div className="upload-error">{error}</div>}

          <form onSubmit={handleSubmit} className="tutor-input-row">
            <input
              ref={inputRef}
              type="text"
              placeholder={
                awaitingAnswer
                  ? 'Type your answer (e.g. B, 42, "the author disagrees")…'
                  : 'Your answer, or ask for a hint…'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
            />
            <button type="submit" className="btn" disabled={!input.trim() || busy}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
