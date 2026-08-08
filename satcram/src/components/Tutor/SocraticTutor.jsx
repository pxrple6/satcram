import React, { useEffect, useRef, useState } from 'react'
import ImageDropzone from '../Upload/ImageDropzone.jsx'
import RichText from '../RichText.jsx'
import { sendTutorMessage } from '../../lib/tutorClient.js'
import { useSearchParams } from '../../lib/router.jsx'
import { PRACTICE_BANK } from '../../data/practiceBank.js'
import WorkPad from './WorkPad.jsx'
import AnnotatedWork from './AnnotatedWork.jsx'
import { getTutorHandoff, saveTutorHandoff } from '../../lib/tutorHandoff.js'

function ChatBubble({ role, text }) {
  const isTutor = role === 'assistant'
  return (
    <div className={`chat-bubble ${isTutor ? 'chat-tutor' : 'chat-student'}`}>
      <div className="chat-role">{isTutor ? 'Tutor' : 'You'}</div>
      <RichText text={text} />
    </div>
  )
}

function TutorConceptVisual({ concept, retryPrompt, steps = [] }) {
  if (!concept) return null
  const visual = concept.visualType || 'input-output'
  return <section className={`tutor-concept tutor-concept-${visual}`}>
    <div className="eyebrow">see the idea</div><h3>{concept.title}</h3>
    <div className="concept-canvas" aria-label={`${concept.title} visual explanation`}>
      {visual === 'coordinate-plane' && <><span className="concept-axis axis-x" /><span className="concept-axis axis-y" /><span className="concept-line" /><span className="concept-dot dot-a" /><span className="concept-dot dot-b" /></>}
      {visual === 'input-output' && <><span className="concept-box">input</span><span className="concept-arrow">→</span><span className="concept-rule">rule</span><span className="concept-arrow">→</span><span className="concept-box">output</span></>}
      {visual === 'evidence-ladder' && <><span className="concept-rung">exact words</span><span className="concept-rung">reasonable inference</span><span className="concept-rung active">answer choice</span></>}
      {visual === 'sentence-map' && <><span className="concept-rung">first clause</span><span className="concept-rung">relationship</span><span className="concept-rung active">punctuation / transition</span></>}
    </div>
    <RichText text={concept.takeaway} />
    {steps.length > 0 && <div className="tutor-step-map">{steps.slice(0, 4).map((step, index) => <div className={`tutor-step-card mark-${step.color || 'blue'}`} key={`${step.label}-${index}`}><span>{step.label}</span><RichText text={step.detail} /></div>)}</div>}
    {retryPrompt && <div className="concept-retry"><strong>Quick retry</strong><RichText text={retryPrompt} /></div>}
  </section>
}

export default function SocraticTutor() {
  const [searchParams] = useSearchParams()
  const [questionText, setQuestionText] = useState('')
  const [images, setImages] = useState([])
  const [contextImages, setContextImages] = useState([])
  const [reviewMode, setReviewMode] = useState('photo')
  const [drawnWork, setDrawnWork] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [started, setStarted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [annotations, setAnnotations] = useState([])
  const [concept, setConcept] = useState(null)
  const [retryPrompt, setRetryPrompt] = useState(null)
  const [visualSteps, setVisualSteps] = useState([])
  const [questionFocus, setQuestionFocus] = useState({ subject: '', topic: '' })
  const [similarSource, setSimilarSource] = useState({ sourceQuestion: '', sourceImage: '', subject: '', topic: '' })
  const [isWorkReviewSession, setIsWorkReviewSession] = useState(false)
  const [sessionImages, setSessionImages] = useState([])
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)
  const startedPracticeRef = useRef(false)

  const workImages = reviewMode === 'draw' && drawnWork ? [{ id: 'drawn-work', dataUrl: drawnWork }] : images
  const activeImages = reviewMode === 'question' ? workImages : [...workImages, ...contextImages]
  const hasWorkImage = workImages.length > 0
  const hasQuestionContext = questionText.trim().length > 0 || contextImages.length > 0
  const hasQuestion = reviewMode === 'question'
    ? questionText.trim() || workImages.length > 0
    : hasWorkImage && hasQuestionContext
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
      const payload = {
        messages: nextMessages,
        workReview: options.workReview,
        visualLesson: options.visualLesson,
        questionText: options.questionText ?? questionText.trim(),
        sessionImages: options.sessionImages ?? (isWorkReviewSession ? sessionImages : []),
      }
      const { message, annotations: nextAnnotations, concept: nextConcept, retryPrompt: nextRetryPrompt, steps: nextSteps } = await sendTutorMessage(payload)
      setMessages([...nextMessages, { role: 'assistant', content: message }])
      if (nextAnnotations?.length) setAnnotations(nextAnnotations)
      if (nextConcept) setConcept(nextConcept)
      if (nextRetryPrompt) setRetryPrompt(nextRetryPrompt)
      if (nextSteps?.length) setVisualSteps(nextSteps)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    const practiceId = searchParams.get('practice')
    const handoff = getTutorHandoff(searchParams.get('handoff'))
    if (handoff?.prompt && !startedPracticeRef.current) {
      startedPracticeRef.current = true
      const choices = handoff.choices?.map((choice, index) => `${String.fromCharCode(65 + index)}. ${choice}`).join('\n') || ''
      const first = handoff.attempted && handoff.incorrect
        ? { role: 'user', content: `MISSED PRACTICE HANDOFF\nSubject: ${handoff.subject || 'SAT'}\nTopic: ${handoff.topic || 'SAT skill'}\nQuestion:\n${handoff.prompt}\nChoices:\n${choices}\nStudent chose: ${handoff.studentAnswer || 'No answer'}\nThis is recorded failed Attempt 1 of 3. Keep the solution locked and make the student reason through the original question again.` }
        : handoff.attempted
          ? { role: 'user', content: `${handoff.prompt}${choices ? `\n\nChoices:\n${choices}` : ''}\n\nMy answer is ${handoff.studentAnswer}. My reasoning was:` }
        : { role: 'user', content: `${handoff.prompt}${choices ? `\n\nChoices:\n${choices}` : ''}` }
      setQuestionText(handoff.prompt)
      setQuestionFocus({ subject: handoff.subject || '', topic: handoff.topic || '' })
      setSimilarSource({ sourceQuestion: handoff.prompt, sourceImage: handoff.sourceImage || '', subject: handoff.subject || '', topic: handoff.topic || '' })
      setStarted(true)
      setMessages([first])
      callTutor([first])
      return
    }
    const practiceQuestion = PRACTICE_BANK.find((question) => question.id === practiceId)
    if (!practiceQuestion || startedPracticeRef.current) return
    startedPracticeRef.current = true
    const first = { role: 'user', content: practiceQuestion.prompt }
    setQuestionText(practiceQuestion.prompt)
    setQuestionFocus({ subject: practiceQuestion.subject, topic: practiceQuestion.topic })
    setSimilarSource({ sourceQuestion: practiceQuestion.prompt, sourceImage: '', subject: practiceQuestion.subject, topic: practiceQuestion.topic })
    setStarted(true)
    setMessages([first])
    callTutor([first])
  }, [searchParams])

  async function handleStart(e) {
    e.preventDefault()
    if (!hasQuestion || busy) return

    const sourceImage = reviewMode === 'question' ? images[0]?.dataUrl : contextImages[0]?.dataUrl
    setSimilarSource({ sourceQuestion: questionText.trim(), sourceImage: sourceImage || '', subject: questionFocus.subject, topic: questionFocus.topic })
    const isWorkReview = reviewMode !== 'question'
    const imageUrls = activeImages.map((img) => img.dataUrl)
    setIsWorkReviewSession(isWorkReview)
    setSessionImages(isWorkReview ? imageUrls : [])
    const first = {
      role: 'user',
      content: reviewMode === 'question'
        ? (questionText.trim() || '(Screenshot attached — see image.)')
        : `WORK REVIEW MODE. Image 1 is the student's handwritten work and is the ONLY image you should annotate. Any later image is the original SAT question for context only; use it to judge the work, but never annotate it. ${questionText.trim() || 'Review the handwritten work in Image 1 and identify the first step to revisit.'}`,
      images: imageUrls,
    }
    setStarted(true)
    setMessages([first])
    await callTutor([first], { workReview: isWorkReview, questionText: questionText.trim(), sessionImages: imageUrls })
  }

  async function handleSend(text) {
    const trimmed = text.trim()
    if (!trimmed || busy || !canReply) return

    const next = [...messages, { role: 'user', content: trimmed }]
    setMessages(next)
    setInput('')
    await callTutor(next, isWorkReviewSession ? { workReview: true } : {})
  }

  function handleSubmit(e) {
    e.preventDefault()
    handleSend(input)
  }

  function openSimilarPractice() {
    const sourceQuestion = similarSource.sourceQuestion || questionText.trim()
    const sourceImage = similarSource.sourceImage || contextImages[0]?.dataUrl || (reviewMode === 'question' ? images[0]?.dataUrl : '') || ''
    if (!sourceQuestion && !sourceImage) {
      setError('Add the original question text or screenshot before practicing similar questions.')
      return
    }
    const id = saveTutorHandoff(`similar-${Date.now()}`, {
      sourceQuestion,
      sourceImage,
      subject: similarSource.subject || questionFocus.subject || 'Math',
      topic: similarSource.topic || questionFocus.topic || 'Submitted-question concept',
    })
    window.history.pushState({}, '', `/app/similar?handoff=${encodeURIComponent(id)}`)
    window.dispatchEvent(new Event('satcram:navigate'))
  }

  function resetSession() {
    setStarted(false)
    setMessages([])
    setQuestionText('')
    setImages([])
    setContextImages([])
    setDrawnWork('')
    setReviewMode('photo')
    setInput('')
    setError('')
    setAnnotations([])
    setConcept(null)
    setRetryPrompt(null)
    setVisualSteps([])
    setQuestionFocus({ subject: '', topic: '' })
    setSimilarSource({ sourceQuestion: '', sourceImage: '', subject: '', topic: '' })
    setIsWorkReviewSession(false)
    setSessionImages([])
  }

  if (!started) {
    return (
      <div className={`tutor-page ${reviewMode === 'draw' ? 'workspace-mode' : ''}`}>
        <div className="eyebrow">AI tutor</div>
        <h2 className="page-title">Solve, then get feedback on your work.</h2>
        <p className="page-lede">
          Work through an SAT question yourself. Upload your paper or draw your steps here, and the tutor will point to the first reasoning move to fix.
        </p>

        <form onSubmit={handleStart} className={`panel panel-pad tutor-setup ${reviewMode === 'draw' ? 'work-review-setup' : ''}`}>
          <div className="tutor-mode-switch"><button type="button" className={`filter-chip ${reviewMode === 'question' ? 'active' : ''}`} onClick={() => setReviewMode('question')}>Question only</button><button type="button" className={`filter-chip ${reviewMode === 'photo' ? 'active' : ''}`} onClick={() => setReviewMode('photo')}>Upload my work</button><button type="button" className={`filter-chip ${reviewMode === 'draw' ? 'active' : ''}`} onClick={() => setReviewMode('draw')}>Draw my work</button></div>
          <div className="upload-layout">
            <section>
              <div className="upload-section-label">
                <span>{reviewMode === 'question' ? 'Question screenshot' : reviewMode === 'photo' ? 'Photo of your work' : 'Your handwritten work'}</span>
                <span className="upload-optional">{reviewMode === 'question' ? 'optional' : 'required'}</span>
              </div>
              {reviewMode === 'draw' ? <WorkPad value={drawnWork} onChange={setDrawnWork} /> : <ImageDropzone images={images} onChange={setImages} maxImages={1} />}
            </section>

            <section>
              <label className="field">
                {reviewMode === 'question' ? 'Question text' : 'Original SAT question'} {reviewMode === 'question' && activeImages.length > 0 ? '(optional)' : reviewMode !== 'question' ? '(required)' : ''}
                <textarea
                  rows={5}
                  placeholder={
                    reviewMode === 'question' && images.length > 0
                    ? 'Add the original question or context…'
                    : reviewMode === 'question' ? 'Paste or type the full question…' : 'Paste the full problem text — the tutor compares your steps against this…'
                  }
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                />
              </label>

              {reviewMode !== 'question' && <section className="tutor-question-context">
                <div className="upload-section-label"><span>Original question screenshot</span><span className="upload-optional">{questionText.trim() ? 'optional if text above is complete' : 'required if no question text'}</span></div>
                <p>The tutor compares your handwritten steps to the original question. Provide the question text or a screenshot so setup errors like wrong coefficients get flagged.</p>
                <ImageDropzone images={contextImages} onChange={setContextImages} maxImages={1} />
              </section>}

              {error && <div className="upload-error">{error}</div>}

              <button type="submit" className="btn btn-analyze" disabled={!hasQuestion || busy}>
                {busy ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true" />
                    Starting…
                  </>
                ) : (
                  reviewMode === 'question' ? 'Start session' : hasQuestionContext ? 'Review my work' : 'Add question context first'
                )}
              </button>
              {reviewMode !== 'question' && !hasQuestionContext && hasWorkImage && (
                <p className="upload-error" style={{ marginTop: 8 }}>Paste the question text or upload a screenshot of the original problem so the tutor can verify your equation setup.</p>
              )}
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
        <><div className="tutor-question-images">
          {reviewMode === 'question'
            ? activeImages.map((img) => <img key={img.id} src={img.dataUrl} alt="Question screenshot" />)
            : <><AnnotatedWork image={activeImages[0]?.dataUrl} annotations={annotations} />{activeImages.slice(1).map((img) => <img key={img.id} src={img.dataUrl} alt="Original question context" />)}</>}
        </div>{annotations.length > 0 && <div className="annotation-legend"><span className="mark-green">Valid setup</span><span className="mark-amber">Check closely</span><span className="mark-red">First error</span><span className="mark-blue">Repair</span></div>}</>
      )}

      {questionText.trim() && (
        <div className="panel panel-pad tutor-question-text">
          <div className="eyebrow">question</div>
          <RichText text={questionText} />
        </div>
      )}

      {concept && <TutorConceptVisual concept={concept} retryPrompt={retryPrompt} steps={visualSteps} />}

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
          <p className="tutor-gate-note"><strong>Solution locked:</strong> make three genuine attempts. Asking for the answer or a hint does not count.</p>
          {awaitingAnswer && (
            <p className="tutor-prompt">The tutor is waiting for your answer and first reasoning step.</p>
          )}

          {canReply && (
            <div className="tutor-quick-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleSend('I need a hint')}>
                I need a hint
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={openSimilarPractice}>
                {questionFocus.topic ? `Practice similar ${questionFocus.topic} questions` : 'Practice similar questions'}
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
                  ? 'Give your answer and show your first step…'
                  : 'Try again: answer plus reasoning…'
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
