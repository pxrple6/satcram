import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { loadEnv } from './loadEnv.js'

loadEnv()

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000
const apiKey = process.env.OPENAI_API_KEY

const app = express()
app.use(express.json({ limit: '32mb' }))

app.post('/api/analyze', async (req, res) => {
  if (!apiKey) {
    return res.status(503).json({ error: 'OPENAI_API_KEY is not configured' })
  }
  try {
    const { analyzeWithOpenAI } = await import('./analyze.js')
    const result = await analyzeWithOpenAI(req.body, apiKey)
    res.json(result)
  } catch (err) {
    console.error('[analyze]', err)
    res.status(500).json({ error: err.message || 'Analysis failed' })
  }
})

app.post('/api/tutor', async (req, res) => {
  if (!apiKey) {
    return res.status(503).json({ error: 'OPENAI_API_KEY is not configured' })
  }
  try {
    const { tutorWithOpenAI } = await import('./tutor.js')
    const result = await tutorWithOpenAI(req.body, apiKey)
    res.json(result)
  } catch (err) {
    console.error('[tutor]', err)
    res.status(500).json({ error: err.message || 'Tutor request failed' })
  }
})

const dist = join(__dirname, '..', 'dist')
app.use(express.static(dist))
app.get('*', (_req, res) => {
  res.sendFile(join(dist, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`SATcram running at http://localhost:${PORT}`)
  if (!apiKey) console.warn('Warning: OPENAI_API_KEY not set — analysis will fail until you add it to .env')
})
