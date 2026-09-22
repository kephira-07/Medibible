import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { registerQuizHandlers } from './quizSocket.js'
import { isOriginAllowed } from '../utils/allowedOrigins.js'

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    // Forme "délégué par requête" du package `cors` (utilisée en interne par
    // Socket.IO/Engine.IO) : contrairement à `{ origin(origin, callback) }`,
    // elle donne accès à `req`, donc à `req.headers.host` — nécessaire pour
    // autoriser automatiquement le domaine qui sert l'appli lui-même (voir
    // allowedOrigins.js).
    cors: (req, callback) => {
      if (isOriginAllowed(req.headers.origin, req.headers.host)) {
        return callback(null, { origin: true, credentials: true })
      }
      return callback(new Error('Origin non autorisée par CORS'))
    },
  })

  // Auth optionnelle : un token valide identifie l'utilisateur (nécessaire
  // pour les actions d'hôte) ; sans token, la connexion reste ouverte pour
  // les joueurs invités qui rejoignent juste avec un pseudo.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) {
      socket.data.user = null
      return next()
    }

    try {
      const payload = jwt.verify(token, env.jwtSecret)
      socket.data.user = { id: payload.sub, role: payload.role }
      return next()
    } catch {
      socket.data.user = null
      return next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`[socket] Client connecté : ${socket.id}`)

    registerQuizHandlers(io, socket)

    socket.on('disconnect', () => {
      console.log(`[socket] Client déconnecté : ${socket.id}`)
    })
  })

  return io
}
