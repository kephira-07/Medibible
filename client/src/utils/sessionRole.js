const GUEST_KEY = 'medibible_guest_session'

// Pourquoi ce marqueur existe
// ---------------------------
// L'identité d'animateur était déduite silencieusement du jeton présent dans
// le navigateur. Or AuthContext restaure la session depuis `localStorage`,
// qui est partagé par TOUS les onglets et survit à la fermeture du
// navigateur : dès qu'un animateur s'était connecté une fois sur un appareil,
// n'importe qui remplissant ensuite le formulaire joueur sur ce même appareil
// envoyait son jeton. Le serveur le reconnaissait alors comme l'animateur de
// la session — ce « joueur » obtenait les commandes de l'hôte, n'était jamais
// ajouté à la liste des participants, et son micro portait l'étiquette
// « Animateur ». Sur un téléphone où l'app est installée, c'était définitif.
//
// On ne devine donc plus le rôle : celui qui passe par le formulaire joueur
// le déclare. `sessionStorage` est propre à l'onglet et survit à un
// rechargement, ce qui correspond exactement à la durée d'une partie.

export function markGuestSession(accessCode) {
  try {
    sessionStorage.setItem(GUEST_KEY, String(accessCode || '').toUpperCase())
  } catch {
    // Navigation privée ou stockage bloqué : on retombe sur une variable de
    // page. Elle disparaît au rechargement, mais vaut mieux que rien — sans
    // elle le joueur serait de nouveau promu animateur.
    globalThis.__medibibleGuestSession = String(accessCode || '').toUpperCase()
  }
}

// Appelé par les parcours animateur : si l'onglet avait servi à jouer en
// invité, ce reste ne doit pas empêcher d'animer la partie suivante.
export function clearGuestSession() {
  try {
    sessionStorage.removeItem(GUEST_KEY)
  } catch {
    // Rien à nettoyer si le stockage est indisponible.
  }
  delete globalThis.__medibibleGuestSession
}

// Vrai quand cet onglet a explicitement rejoint CETTE session par le
// formulaire joueur. Le code est comparé pour qu'un onglet ayant joué à une
// partie précédente puisse animer la suivante sans rien avoir à nettoyer.
export function isGuestSession(accessCode) {
  const wanted = String(accessCode || '').toUpperCase()
  if (!wanted) return false
  try {
    if (sessionStorage.getItem(GUEST_KEY) === wanted) return true
  } catch {
    // On bascule sur le repli ci-dessous.
  }
  return globalThis.__medibibleGuestSession === wanted
}
