import { createContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext.jsx'

export const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { token } = useAuth()
  // Instance stable sur toute la vie du composant (créée une seule fois via l'initialiseur useState)
  const [socket] = useState(() => io({ autoConnect: false }))
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    socket.auth = token ? { token } : {}
    socket.connect()

    const handleConnect = () => setConnected(true)
    const handleDisconnect = () => setConnected(false)
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.disconnect()
    }
  }, [socket, token])

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>
}
