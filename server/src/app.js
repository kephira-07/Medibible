import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js'
import quizRoutes from './routes/quiz.routes.js'
import authRoutes from './routes/auth.routes.js'
import sessionRoutes from './routes/session.routes.js'
import notificationRoutes from './routes/notification.routes.js'
import audioRoutes from './routes/audio.routes.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: env.clientUrl, credentials: true }))
  app.use(express.json())

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
