import { useContext } from 'react'
import { SocketContext } from '../context/SocketContext.jsx'

export function useSocket() {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket doit être utilisé dans un SocketProvider')
  return ctx
}
