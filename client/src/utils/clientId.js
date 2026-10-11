const STORAGE_KEY = 'medibible_client_id'

function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  // Repli pour les navigateurs/contextes sans crypto.randomUUID (http non
  // sécurisé sur certains mobiles) : l'unicité suffit à distinguer deux
  // joueurs, aucune propriété cryptographique n'est attendue ici.
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

// Identifie le navigateur du joueur de façon stable, d'un rechargement de page
// à l'autre. C'est ce qui permet au serveur de reconnaître un invité sans
// compte : le socketId change à chaque reconnexion et un prénom n'est pas
// unique, donc sans cet identifiant un joueur qui recharge la page peut
// répondre une seconde fois à la même question, et deux homonymes sont
// confondus en un seul participant.
export function getClientId() {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) return existing
    const created = randomId()
    localStorage.setItem(STORAGE_KEY, created)
    return created
  } catch {
    // Navigation privée ou stockage bloqué : on renvoie un identifiant valable
    // pour la durée de l'onglet. La partie reste jouable, seule la
    // reconnaissance après rechargement est perdue.
    if (!globalThis.__medibibleClientId) globalThis.__medibibleClientId = randomId()
    return globalThis.__medibibleClientId
  }
}
