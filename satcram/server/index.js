import express from 'express'
import helmet from 'helmet'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { loadEnv } from './loadEnv.js'
import { recordOpenAIUsage, usageLimitFor } from './usageBudget.js'

loadEnv()

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000
const apiKey = process.env.OPENAI_API_KEY
const clerkSecretKey = process.env.CLERK_SECRET_KEY
const clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY
const requireAuth = process.env.REQUIRE_AUTH !== 'false'

const app = express()

// Render sits behind a reverse proxy. Trust exactly one proxy hop so guest IP limits are accurate.
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1)

// Security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === 'production'
        ? {
            directives: {
              defaultSrc: ["'self'"],
              baseUri: ["'self'"],
              objectSrc: ["'none'"],
              frameAncestors: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'", 'https://*.clerk.accounts.dev'],
              scriptSrcAttr: ["'none'"],
              styleSrc: ["'self'", "'unsafe-inline'", 'https://*.clerk.accounts.dev'],
              imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
              fontSrc: ["'self'", 'data:', 'https://*.clerk.accounts.dev'],
              connectSrc: ["'self'", 'https://*.clerk.accounts.dev', 'https://api.clerk.com'],
              frameSrc: ['https://*.clerk.accounts.dev'],
            },
          }
        : false,
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
    return req.auth?.userId || ipKeyGenerator(req.ip)
  },
  message: { error: 'You have reached your limit of AI requests. Please wait 15 minutes before making more requests.' },
})

app.use(express.json({ limit: '15mb' })) // Restrict JSON payload size to 15MB

// Optional Clerk auth check middleware scoped exclusively to /api routes
let clerkAuthMiddleware = (_req, res, next) => {
  if (requireAuth) {
    return res.status(503).json({ error: 'Server authentication is not configured. Set CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY.' })
  }
  next()
}

if (clerkSecretKey && clerkPublishableKey) {
  try {
    const { clerkMiddleware, getAuth } = await import('@clerk/express')
    app.use('/api', clerkMiddleware({ secretKey: clerkSecretKey, publishableKey: clerkPublishableKey }))
    clerkAuthMiddleware = (req, res, next) => {
      if (requireAuth) {
        const auth = getAuth(req)
        if (!auth || !auth.userId) {
          return res.status(401).json({ error: 'Authentication required. Please log in to continue.' })
        }
      }
      next()
    }
  } catch (err) {
    console.warn('[Clerk] Could not load @clerk/express middleware:', err.message)
  }
} else if (clerkSecretKey) {
  console.warn('[Clerk] CLERK_PUBLISHABLE_KEY is missing. AI API access is disabled until Clerk is fully configured.')
}

// Run after optional Clerk middleware so signed-in users receive an account-based limit.
app.use('/api/', userApiLimiter)

function usageKey(req) {
  return req.auth?.userId || `ip:${ipKeyGenerator(req.ip)}`
}

function enforceUsageBudget(req, res, next) {
  const budget = usageLimitFor(usageKey(req))
  if (!budget.allowed) {
    return res.status(429).json({
      error: `You have reached the $${budget.limitUsd.toFixed(2)} monthly AI usage limit. Please try again next month.`,
    })
  }
  next()
}

// Input validation helpers
function validateAnalyzeInput(body) {
  if (!body || typeof body !== 'object') throw new Error('Invalid payload')
  if (body.images && (!Array.isArray(body.images) || body.images.length > 1)) {
    throw new Error('Maximum of 1 image allowed per request.')
  }
  if (body.images?.some((image) => typeof image !== 'string' || image.length > 2_800_000)) {
    throw new Error('Screenshot exceeds the 2 MB limit.')
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
  if (body.messages.some((message) => typeof message?.content !== 'string' || message.content.length > 10000)) {
    throw new Error('A tutor message exceeds the maximum length.')
  }
  const imageCount = body.messages.reduce((count, message) => count + (Array.isArray(message.images) ? message.images.length : 0), 0)
  if (imageCount > 1) throw new Error('Maximum of 1 screenshot allowed per tutor session.')
}

app.post('/api/analyze', clerkAuthMiddleware, enforceUsageBudget, async (req, res) => {
  if (!apiKey) {
    return res.status(503).json({ error: 'OPENAI_API_KEY is not configured on the server' })
  }
  try {
    validateAnalyzeInput(req.body)
    const { analyzeWithOpenAI } = await import('./analyze.js')
    const result = await analyzeWithOpenAI(req.body, apiKey)
    const { usage, ...analysis } = result
    recordOpenAIUsage(usageKey(req), usage)
    res.json(analysis)
  } catch (err) {
    console.error('[analyze error]', err.message)
    const isClientErr = err.message.includes('Maximum') || err.message.includes('Invalid')
    res.status(isClientErr ? 400 : 500).json({
      error: err.message || 'Analysis failed',
    })
  }
})

app.post('/api/tutor', clerkAuthMiddleware, enforceUsageBudget, async (req, res) => {
  if (!apiKey) {
    return res.status(503).json({ error: 'OPENAI_API_KEY is not configured on the server' })
  }
  try {
    validateTutorInput(req.body)
    const { tutorWithOpenAI } = await import('./tutor.js')
    const result = await tutorWithOpenAI(req.body, apiKey)
    const { usage, ...tutor } = result
    recordOpenAIUsage(usageKey(req), usage)
    res.json(tutor)
  } catch (err) {
    console.error('[tutor error]', err.message)
    const isClientErr = err.message.includes('Invalid') || err.message.includes('exceeds')
    res.status(isClientErr ? 400 : 500).json({
      error: err.message || 'Tutor request failed',
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
