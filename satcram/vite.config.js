import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleAnalyzeRequest } from './server/analyze.js'
import { handleTutorRequest } from './server/tutor.js'
import { usageLimitFor } from './server/usageBudget.js'

function apiPlugin(env) {
  const apiKey = env.OPENAI_API_KEY

  function allowRequest(req, res) {
    const key = `dev:${req.socket.remoteAddress || 'local'}`
    const budget = usageLimitFor(key)
    if (budget.allowed) return key

    res.statusCode = 429
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: `You have reached the $${budget.limitUsd.toFixed(2)} monthly AI usage limit. Please try again next month.` }))
    return null
  }

  function attach(server) {
    server.middlewares.use('/api/analyze', async (req, res, next) => {
      if (req.method !== 'POST') return next()
      const key = allowRequest(req, res)
      if (key) await handleAnalyzeRequest(req, res, apiKey, key)
    })
    server.middlewares.use('/api/tutor', async (req, res, next) => {
      if (req.method !== 'POST') return next()
      const key = allowRequest(req, res)
      if (key) await handleTutorRequest(req, res, apiKey, key)
    })
  }

  return {
    name: 'satcram-api',
    configureServer(server) {
      attach(server)
    },
    configurePreviewServer(server) {
      attach(server)
    },
  }
}

export default defineConfig(({ mode }) => {
  // Support existing src/.env setups while allowing server-only secrets to move to root .env.
  // Root values take precedence and are passed only to the local API plugin, never the browser.
  const sourceEnv = loadEnv(mode, 'src', '')
  const rootEnv = loadEnv(mode, '.', '')
  const serverEnv = { ...sourceEnv, ...rootEnv }
  return {
    envDir: 'src',
    plugins: [react(), apiPlugin(serverEnv)],
    server: {
      port: 5173,
    },
  }
})
