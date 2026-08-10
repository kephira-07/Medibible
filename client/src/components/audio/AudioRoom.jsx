import { useState } from 'react'
import { useAudioRoom } from '../../hooks/useAudioRoom.js'
import AvatarBubble from './AvatarBubble.jsx'
import Button from '../common/Button.jsx'

// Aucune fenêtre d'appel, aucune interface tierce : juste des avatars qui
// réagissent quand quelqu'un parle, comme un chat vocal de jeu en ligne.
export default function AudioRoom({ roomName, displayName }) {
  const { connected, participants, muted, error, connect, disconnect, toggleMute } = useAudioRoom()
  const [connecting, setConnecting] = useState(false)

  const handleToggle = async () => {
    if (connected) {
      disconnect()
      return
    }
    setConnecting(true)
    await connect(roomName, displayName)
    setConnecting(false)
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <Button
        variant="outline"
        className="w-full active:scale-95"
        onClick={handleToggle}
        disabled={connecting}
      >
        {connected ? '🎙️ Quitter le vocal' : connecting ? 'Connexion…' : '🎙️ Rejoindre le vocal'}
      </Button>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {connected && (
        <div className="animate-fade-in-up flex w-full flex-wrap items-start justify-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
          {participants.map((p) => (
            <AvatarBubble key={p.identity} name={p.name} isSpeaking={p.isSpeaking} isMuted={p.isMuted} />
          ))}
          <button
            type="button"
            onClick={toggleMute}
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-medi-petrol/15 text-xl transition-transform active:scale-90"
            title={muted ? 'Activer le micro' : 'Couper le micro'}
          >
            {muted ? '🔇' : '🎤'}
          </button>
        </div>
      )}
    </div>
  )
}
