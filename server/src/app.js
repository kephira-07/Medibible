import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js'
import quizRoutes from './routes/quiz.routes.js'
import authRoutes from './routes/auth.routes.js'
import sessionRoutes from './routes/session.routes.js'
import audioRoutes from './routes/audio.routes.js'
import { isOriginAllowed } from './utils/allowedOrigins.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const clientDistPath = path.resolve(__dirname, '../../client/dist')
const clientBuildExists = fs.existsSync(clientDistPath)

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      // Par défaut, Helmet ne définit pas `connect-src`, qui retombe alors
      // sur `default-src 'self'` — cela bloque silencieusement, côté
      // navigateur, TOUTE connexion sortante vers un autre domaine, y
      // compris le vocal LiveKit (appels REST `/settings/regions`,
      // `/rtc/v1/validate` et le WebSocket `wss://…livekit.cloud`). Sans
      // cette autorisation explicite, le chat vocal échoue pour tout le
      // monde, sur n'importe quel réseau, avec "could not establish signal
      // connection : Failed to fetch" — ce n'est jamais un souci réseau
      // côté client, la CSP bloque la requête avant même qu'elle ne parte.
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          connectSrc: ["'self'", 'https://*.livekit.cloud', 'wss://*.livekit.cloud'],
        },
      },
    })
  )
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
    cors((req, callback) => {
      if (isOriginAllowed(req.headers.origin, req.headers.host)) {
        return callback(null, { origin: true, credentials: true })
      }
      return callback(new Error('Origin non autorisée par CORS'))
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
