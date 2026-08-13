import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { env } from './config/env.js'
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js'
import quizRoutes from './routes/quiz.routes.js'
import authRoutes from './routes/auth.routes.js'
import sessionRoutes from './routes/session.routes.js'
import notificationRoutes from './routes/notification.routes.js'
import audioRoutes from './routes/audio.routes.js'

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
  app.use('/api/notifications', notificationRoutes)
  app.use('/api/audio', audioRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
