import { useEffect, useState } from 'react'
import { HiCheckCircle, HiXCircle, HiClock } from 'react-icons/hi'

const STYLES = {
  correct: { border: 'border-emerald-300', bg: 'bg-emerald-50', text: 'text-emerald-800', icon: HiCheckCircle, iconColor: 'text-emerald-600' },
  incorrect: { border: 'border-rose-300', bg: 'bg-rose-50', text: 'text-rose-800', icon: HiXCircle, iconColor: 'text-rose-600' },
  timeout: { border: 'border-amber-300', bg: 'bg-amber-50', text: 'text-amber-900', icon: HiClock, iconColor: 'text-amber-600' },
}

// Notification flottante posée sur le côté de l'écran (pas dans le flux de
// la page, donc ne pousse rien) — apparaît puis repart toute seule au bout
// d'un délai, sans action du joueur.
export default function Toast({ toast, duration = 3200, onDone }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!toast) return
    setLeaving(false)
    const leaveTimer = setTimeout(() => setLeaving(true), duration - 250)
    const doneTimer = setTimeout(() => onDone?.(), duration)
    return () => {
      clearTimeout(leaveTimer)
      clearTimeout(doneTimer)
    }
  }, [toast, duration, onDone])

  if (!toast) return null

  const style = STYLES[toast.type]
  const Icon = style.icon

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-end px-4 sm:top-24 sm:px-6">
      <div
        className={`pointer-events-auto flex max-w-xs items-center gap-2.5 rounded-2xl border-2 ${style.border} ${style.bg} px-4 py-3 shadow-[0_16px_36px_rgba(22,50,62,0.18)] ${
          leaving ? 'animate-toast-out' : 'animate-toast-in'
        }`}
      >
        <Icon className={`shrink-0 text-xl ${style.iconColor}`} />
        <div className="min-w-0">
          {toast.type === 'correct' && (
            <>
              <p className={`text-sm font-bold ${style.text}`}>Bonne réponse !</p>
              <p className={`text-xs ${style.text} opacity-75`}>
                {typeof toast.elapsedMs === 'number' && `${(toast.elapsedMs / 1000).toFixed(1)}s · `}+{toast.pointsEarned} pts
              </p>
            </>
          )}
          {toast.type === 'incorrect' && <p className={`text-sm font-bold ${style.text}`}>Mauvaise réponse — pas de points.</p>}
          {toast.type === 'timeout' && <p className={`text-sm font-bold ${style.text}`}>Temps écoulé — aucune réponse soumise.</p>}
        </div>
      </div>
    </div>
  )
}
