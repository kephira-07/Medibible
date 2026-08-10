// Planifie la clôture automatique d'une question à l'échéance serveur (endsAt).
// Le setTimeout est un filet de sécurité pratique, pas la garantie d'exactitude :
// chaque soumission de réponse est de toute façon revérifiée contre endsAt
// côté serveur, donc une dérive du timer (charge CPU, etc.) ne peut pas être
// exploitée pour répondre en retard.
const timers = new Map()

export function scheduleQuestionClose(sessionId, endsAt, onClose) {
  cancelQuestionClose(sessionId)
  const delay = Math.max(0, endsAt - Date.now())
  const handle = setTimeout(() => {
    timers.delete(sessionId)
    onClose()
  }, delay)
  timers.set(sessionId, handle)
}

export function cancelQuestionClose(sessionId) {
  const handle = timers.get(sessionId)
  if (handle) {
    clearTimeout(handle)
    timers.delete(sessionId)
  }
}
