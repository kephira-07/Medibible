import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { registerQuizHandlers } from './quizSocket.js'

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
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
    } catch {
      socket.data.user = null
    }
    next()
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
