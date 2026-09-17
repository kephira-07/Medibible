import { useState } from 'react'
import { useAudioRoom } from '../../hooks/useAudioRoom.js'
import AvatarBubble from './AvatarBubble.jsx'
import Button from '../common/Button.jsx'
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa'

// Aucune fenêtre d'appel, aucune interface tierce : juste des avatars qui
// réagissent quand quelqu'un parle, comme un chat vocal de jeu en ligne.
export default function AudioRoom({ roomName, displayName, isHost }) {
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
        variant={connected ? 'coral' : 'sky'}
        className="w-full active:scale-95"
        onClick={handleToggle}
        disabled={connecting}
      >
        {connected ? <><FaMicrophone className="inline-block mr-2" />Quitter le vocal</> : connecting ? 'Connexion…' : <><FaMicrophone className="inline-block mr-2" />Rejoindre le vocal</>}
      </Button>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {connected && (
        <div className="animate-fade-in-up flex w-full flex-wrap items-start justify-center gap-4 rounded-2xl border-2 border-medi-border bg-white p-4 shadow-sm">
          {participants.map((p) => (
            <div key={p.identity} className="flex flex-col items-center gap-1">
              <AvatarBubble name={p.name} isSpeaking={p.isSpeaking} isMuted={p.isMuted} />
              {p.name === displayName && isHost && (
                <span className="rounded-full bg-medi-gold/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-medi-petrol">
                  Animateur
                </span>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={toggleMute}
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-medi-border bg-medi-cream text-xl transition-transform active:scale-90"
            title={muted ? 'Activer le micro' : 'Couper le micro'}
          >
            {muted ? <FaMicrophoneSlash className="inline-block text-medi-coral" /> : <FaMicrophone className="inline-block text-medi-green-deep" />}
          </button>
        </div>
      )}
    </div>
  )
}
