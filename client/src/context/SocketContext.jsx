import { createContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext.jsx'

export const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { token } = useAuth()
  // En local (VITE_API_URL absent), io(undefined, ...) se connecte à la même
  // origine que la page — géré par le proxy Vite. En production, VITE_API_URL
  // pointe vers le serveur déployé, sur un domaine différent du client.
  //
  // `upgrade: false` — c'est le vrai correctif, pas juste un filet de
  // sécurité : beaucoup de réseaux mobiles (proxy opérateur, "économiseur
  // de données") laissent passer le HTTP classique mais bloquent ou cassent
  // silencieusement la bascule vers WebSocket (l'en-tête `Connection:
  // Upgrade`), ce qui explique le "ça marche en Wi-Fi mais pas en 4G/5G".
  // En restant en long-polling HTTP pur (transport `polling` uniquement),
  // la connexion passe par des requêtes HTTP normales que ces réseaux ne
  // bloquent pas. Léger coût en latence (~une requête toutes les
  // 20-25s en veille, quasi instantané en usage actif), largement
  // acceptable pour un quiz — la fiabilité de connexion prime.
  const [socket] = useState(() =>
    io(import.meta.env.VITE_API_URL || undefined, {
      autoConnect: false,
      transports: ['polling'],
      upgrade: false,
      timeout: 10000,
    })
  )
  const [connected, setConnected] = useState(false)
  const [connectError, setConnectError] = useState(null)

  useEffect(() => {
    socket.auth = token ? { token } : {}
    socket.connect()

    const handleConnect = () => {
      setConnected(true)
      setConnectError(null)
    }
    const handleDisconnect = () => setConnected(false)
    const handleConnectError = (err) => setConnectError(err?.message || 'Connexion impossible.')

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.disconnect()
    }
  }, [socket, token])

  // Force une nouvelle tentative de connexion — utilisé par l'UI quand la
  // connexion reste bloquée trop longtemps (ex: `Réessayer` sur mobile).
  const retryConnection = () => {
    setConnectError(null)
    socket.disconnect()
    socket.connect()
  }

  return (
    <SocketContext.Provider value={{ socket, connected, connectError, retryConnection }}>
      {children}
    </SocketContext.Provider>
  )
}
