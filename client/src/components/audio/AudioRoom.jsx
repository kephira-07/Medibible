import { useState } from 'react'
import { useAudioRoom } from '../../hooks/useAudioRoom.js'
import AvatarBubble from './AvatarBubble.jsx'
import Button from '../common/Button.jsx'
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa'

// Aucune fenêtre d'appel, aucune interface tierce : juste des avatars qui
// réagissent quand quelqu'un parle, comme un chat vocal de jeu en ligne.
// L'animateur peut couper (ou rendre) le micro d'un joueur, ou de tous.
export default function AudioRoom({ roomName, displayName, avatar, isHost }) {
  const { connected, participants, muted, forcedMute, error, connect, disconnect, toggleMute, setMicPermission } =
    useAudioRoom()
  const [connecting, setConnecting] = useState(false)

  const handleToggle = async () => {
    if (connected) {
      disconnect()
      return
    }
    setConnecting(true)
    await connect(roomName, displayName, avatar)
    setConnecting(false)
  }

  const players = participants.filter((p) => !p.isLocal && !p.isHostUser)
  const anyoneAllowed = players.some((p) => p.canPublish)

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
      {forcedMute && connected && (
        <p className="text-center text-xs font-semibold text-medi-coral">
          L'animateur a coupé ton micro — tu peux écouter, il te rendra la parole.
        </p>
      )}

      {connected && (
        <div className="animate-fade-in-up flex w-full flex-col gap-3 rounded-2xl border-2 border-medi-border bg-white p-4 shadow-sm">
          <div className="flex w-full flex-wrap items-start justify-center gap-4">
            {participants.map((p) => (
              <div key={p.identity} className="flex flex-col items-center gap-1">
                <AvatarBubble name={p.name} avatar={p.avatar} isSpeaking={p.isSpeaking} isMuted={p.isMuted || !p.canPublish} />
                {p.isHostUser && (
                  <span className="rounded-full bg-medi-gold/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-medi-petrol">
                    Animateur
                  </span>
                )}
                {isHost && !p.isLocal && !p.isHostUser && (
                  <button
                    type="button"
                    onClick={() => setMicPermission(roomName, p.identity, !p.canPublish)}
                    className={`min-h-0 rounded-full px-2.5 py-1 text-[10px] leading-tight font-bold transition active:scale-95 ${
                      p.canPublish
                        ? 'bg-medi-coral/15 text-medi-coral hover:bg-medi-coral/25'
                        : 'bg-medi-green-deep/10 text-medi-green-deep hover:bg-medi-green-deep/20'
                    }`}
                  >
                    {p.canPublish ? 'Couper le micro' : 'Rendre la parole'}
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={toggleMute}
              disabled={forcedMute}
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-medi-border bg-medi-cream text-xl transition-transform active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
              title={forcedMute ? "L'animateur a coupé ton micro" : muted ? 'Activer le micro' : 'Couper le micro'}
            >
              {muted ? <FaMicrophoneSlash className="inline-block text-medi-coral" /> : <FaMicrophone className="inline-block text-medi-green-deep" />}
            </button>
          </div>

          {isHost && players.length > 0 && (
            <button
              type="button"
              onClick={() => setMicPermission(roomName, undefined, !anyoneAllowed)}
              className="w-full rounded-xl border-2 border-medi-border bg-medi-cream py-2 text-xs font-bold text-medi-petrol transition hover:bg-white active:scale-95"
            >
              {anyoneAllowed ? 'Couper tous les micros des joueurs' : 'Rendre la parole à tous les joueurs'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
