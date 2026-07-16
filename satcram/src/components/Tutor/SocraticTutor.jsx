import React, { useEffect, useRef, useState } from 'react'
import ImageDropzone from '../Upload/ImageDropzone.jsx'
import RichText from '../RichText.jsx'
import { sendTutorMessage } from '../../lib/tutorClient.js'

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
  const [questionText, setQuestionText] = useState('')
  const [images, setImages] = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [started, setStarted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  const hasQuestion = questionText.trim() || images.length > 0
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

  async function callTutor(nextMessages) {
    setBusy(true)
    setError('')
    try {
      const { message } = await sendTutorMessage({ messages: nextMessages })
      setMessages([...nextMessages, { role: 'assistant', content: message }])
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  async function handleStart(e) {
    e.preventDefault()
    if (!hasQuestion || busy) return

    const first = {
      role: 'user',
      content: questionText.trim() || '(Screenshot attached — see image.)',
      images: images.map((img) => img.dataUrl),
    }
    setStarted(true)
    setMessages([first])
    await callTutor([first])
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
    setInput('')
    setError('')
  }

  if (!started) {
    return (
      <div className="tutor-page">
        <div className="eyebrow">AI tutor</div>
        <h2 className="page-title">Practice a question</h2>
        <p className="page-lede">
          Paste or screenshot a SAT question. The tutor will ask for your answer first — then give
          hints if you're stuck, and only explain fully when you need it.
        </p>

        <form onSubmit={handleStart} className="panel panel-pad tutor-setup">
          <div className="upload-layout">
            <section>
              <div className="upload-section-label">
                <span>Question screenshot</span>
                <span className="upload-optional">optional</span>
              </div>
              <ImageDropzone images={images} onChange={setImages} maxImages={2} />
            </section>

            <section>
              <label className="field">
                Question text {images.length > 0 ? '(optional)' : ''}
                <textarea
                  rows={5}
                  placeholder={
                    images.length > 0
                      ? 'Add context if the screenshot is cropped…'
                      : 'Paste or type the full question…'
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
                  'Start session'
                )}
              </button>
            </section>
          </div>
        </form>

        <div className="tutor-flow-hint panel panel-pad">
          <div className="eyebrow">how this works</div>
          <ol className="tutor-steps">
            <li>You share the question (text or image)</li>
            <li>Tutor asks what answer you'd pick</li>
            <li>You try — get a hint if you're wrong</li>
            <li>Still stuck? Ask for the full explanation</li>
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

      {images.length > 0 && (
        <div className="tutor-question-images">
          {images.map((img) => (
            <img key={img.id} src={img.dataUrl} alt="Question screenshot" />
          ))}
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
