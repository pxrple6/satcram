import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { loadEnv } from './loadEnv.js'

loadEnv()

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000
const apiKey = process.env.OPENAI_API_KEY
const clerkSecretKey = process.env.CLERK_SECRET_KEY

const app = express()

// Security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled by default for SPA flex with KaTeX & Clerk fonts/CDN scripts
    crossOriginEmbedderPolicy: false,
  })
)

// Per-user rate limiting (tracks Clerk User ID if logged in, otherwise client IP)
const userApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 20, // Max 20 requests per 15 mins per user account (or per IP for guests)
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Key by Clerk User ID when logged in, or client IP when unauthenticated
    return req.auth?.userId || req.ip
  },
  message: { error: 'You have reached your limit of AI requests. Please wait 15 minutes before making more requests.' },
})

app.use('/api/', userApiLimiter)
app.use(express.json({ limit: '15mb' })) // Restrict JSON payload size to 15MB

// Optional Clerk auth check middleware scoped exclusively to /api routes
let clerkAuthMiddleware = (_req, _res, next) => next()

if (clerkSecretKey) {
  try {
    const { clerkMiddleware, requireAuth } = await import('@clerk/express')
    app.use('/api', clerkMiddleware())
    clerkAuthMiddleware = requireAuth()
  } catch (err) {
    console.warn('[Clerk] Could not load @clerk/express middleware:', err.message)
  }
}

// Input validation helpers
function validateAnalyzeInput(body) {
  if (!body || typeof body !== 'object') throw new Error('Invalid payload')
  if (body.images && (!Array.isArray(body.images) || body.images.length > 4)) {
    throw new Error('Maximum of 4 images allowed per request.')
  }
  if (body.questionText && typeof body.questionText === 'string' && body.questionText.length > 10000) {
    throw new Error('Question text exceeds maximum allowed length.')
  }
}

function validateTutorInput(body) {
  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    throw new Error('Invalid conversation payload.')
  }
  if (body.messages.length > 50) {
    throw new Error('Conversation history exceeds limit (50 messages).')
  }
}

app.post('/api/analyze', clerkAuthMiddleware, async (req, res) => {
  if (!apiKey) {
    return res.status(503).json({ error: 'OPENAI_API_KEY is not configured on the server' })
  }
  try {
    validateAnalyzeInput(req.body)
    const { analyzeWithOpenAI } = await import('./analyze.js')
    const result = await analyzeWithOpenAI(req.body, apiKey)
    res.json(result)
  } catch (err) {
    console.error('[analyze error]', err.message)
    const isClientErr = err.message.includes('Maximum') || err.message.includes('Invalid')
    res.status(isClientErr ? 400 : 500).json({
      error: process.env.NODE_ENV === 'production' && !isClientErr
        ? 'AI analysis service encountered an error. Please try again later.'
        : err.message || 'Analysis failed',
    })
  }
})

app.post('/api/tutor', clerkAuthMiddleware, async (req, res) => {
  if (!apiKey) {
    return res.status(503).json({ error: 'OPENAI_API_KEY is not configured on the server' })
  }
  try {
    validateTutorInput(req.body)
    const { tutorWithOpenAI } = await import('./tutor.js')
    const result = await tutorWithOpenAI(req.body, apiKey)
    res.json(result)
  } catch (err) {
    console.error('[tutor error]', err.message)
    const isClientErr = err.message.includes('Invalid') || err.message.includes('exceeds')
    res.status(isClientErr ? 400 : 500).json({
      error: process.env.NODE_ENV === 'production' && !isClientErr
        ? 'AI tutor service encountered an error. Please try again later.'
        : err.message || 'Tutor request failed',
    })
  }
})

const dist = join(__dirname, '..', 'dist')
app.use(express.static(dist))
app.get('*', (_req, res) => {
  res.sendFile(join(dist, 'index.html'), (err) => {
    if (err) {
      console.error('[sendFile error]', err.message)
      if (!res.headersSent) {
        res.status(500).send('Front end build files not found. Ensure npm run build completed.')
      }
    }
  })
})

// Global error handler middleware
app.use((err, _req, res, _next) => {
  console.error('[Unhandled Express Error]', err)
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.listen(PORT, () => {
  console.log(`SATcram running on port ${PORT} [NODE_ENV=${process.env.NODE_ENV || 'development'}]`)
  if (!apiKey) console.warn('Warning: OPENAI_API_KEY not set in environment')
})

