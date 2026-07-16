import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleAnalyzeRequest } from './server/analyze.js'
import { handleTutorRequest } from './server/tutor.js'

function apiPlugin(env) {
  const apiKey = env.OPENAI_API_KEY

  function attach(server) {
    server.middlewares.use('/api/analyze', (req, res, next) => {
      if (req.method !== 'POST') return next()
      handleAnalyzeRequest(req, res, apiKey)
    })
    server.middlewares.use('/api/tutor', (req, res, next) => {
      if (req.method !== 'POST') return next()
      handleTutorRequest(req, res, apiKey)
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
  const env = loadEnv(mode, 'src', '')
  return {
    envDir: 'src',
    plugins: [react(), apiPlugin(env)],
    server: {
      port: 5173,
    },
  }
})
