import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from './config/env.js'
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js'
import quizRoutes from './routes/quiz.routes.js'
import authRoutes from './routes/auth.routes.js'
import sessionRoutes from './routes/session.routes.js'
import audioRoutes from './routes/audio.routes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const clientDistPath = path.resolve(__dirname, '../../client/dist')
const clientBuildExists = fs.existsSync(clientDistPath)

const defaultOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://medibible.vercel.app',
  env.clientUrl,
])

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(helmet({ crossOriginResourcePolicy: false }))
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: 'Trop de requêtes, veuillez réessayer plus tard.' },
    })
  )
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || defaultOrigins.has(origin)) {
          return callback(null, true)
        }
        return callback(new Error('Origin non autorisée par CORS'))
      },
      credentials: true,
    })
  )
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'medibible-server' })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/quizzes', quizRoutes)
  app.use('/api/sessions', sessionRoutes)
  app.use('/api/audio', audioRoutes)

  if (clientBuildExists) {
    app.use(express.static(clientDistPath))
    app.get(/^(?!\/api\/).*$/, (req, res, next) => {
      if (req.method !== 'GET') return next()
      if (req.accepts('html')) {
        return res.sendFile(path.join(clientDistPath, 'index.html'))
      }
      return next()
    })
  } else {
    app.get('/', (req, res) => {
      res.status(200).json({
        message: 'MediBible API is running. Build the client and deploy it to serve the web app at the root URL.',
      })
    })
  }

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
