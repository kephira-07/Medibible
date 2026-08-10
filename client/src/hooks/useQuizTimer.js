import { useEffect, useState } from 'react'

// Ne fait jamais confiance à un compteur local qui décrémente tout seul :
// à chaque tick, le temps restant est recalculé depuis `endsAt` (timestamp
// serveur), donc aucune dérive ne peut s'accumuler côté client.
export function useQuizTimer(endsAt) {
  const [remainingMs, setRemainingMs] = useState(() => (endsAt ? Math.max(0, endsAt - Date.now()) : 0))

  useEffect(() => {
    if (!endsAt) {
      setRemainingMs(0)
      return
    }

    setRemainingMs(Math.max(0, endsAt - Date.now()))
    const interval = setInterval(() => {
      setRemainingMs(Math.max(0, endsAt - Date.now()))
    }, 200)

    return () => clearInterval(interval)
  }, [endsAt])

  return remainingMs
}
