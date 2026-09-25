import { useState } from 'react'
import { REACTIONS } from '../../utils/reactions.js'

// Bouton "Réagir" fixé en haut d'écran, sous l'en-tête : ouvre un plateau d'emojis à envoyer
// sans parler, comme dans une visio.
export default function ReactionBar({ onReact }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed right-3 top-[4.75rem] z-40 flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-12 items-center gap-2 rounded-full border-2 border-medi-border bg-white px-4 text-sm font-bold text-medi-petrol shadow-[0_10px_24px_rgba(22,50,62,0.15)] transition active:scale-95"
      >
        <span className="text-lg">{open ? '✕' : '😊'}</span>
        {open ? 'Fermer' : 'Réagir'}
      </button>
      {open && (
        <div className="animate-pop-in grid grid-cols-5 gap-1.5 rounded-2xl border-2 border-medi-border bg-white p-2 shadow-[0_16px_36px_rgba(22,50,62,0.2)]">
          {REACTIONS.map((r) => (
            <button
              key={r.id}
              type="button"
              title={r.label}
              aria-label={r.label}
              onClick={() => {
                onReact(r.id)
                setOpen(false)
              }}
              className="flex h-11 min-h-0 w-11 items-center justify-center rounded-xl text-2xl transition hover:bg-medi-cream active:scale-90"
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
