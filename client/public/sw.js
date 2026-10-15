const CACHE_NAME = 'medibible-shell-v2'
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/logo.jpeg']

// Les fichiers de /assets/ portent un hash dans leur nom : à URL identique,
// le contenu ne change jamais. On peut donc les servir depuis le cache sans
// jamais les revalider. Tout le reste (logo, manifeste, icônes) garde une
// URL fixe : servi en « cache d'abord » sans mise à jour, un nouveau logo ne
// parviendrait JAMAIS aux utilisateurs ayant déjà installé l'application,
// puisque `activate` ne purge que les caches d'un *autre* nom.
function isImmutable(pathname) {
  return pathname.startsWith('/assets/')
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url)

  if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin) {
    return
  }

  if (requestUrl.pathname.startsWith('/api') || requestUrl.pathname.startsWith('/socket.io')) {
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Sans ce garde-fou, une page d'erreur renvoyée par l'hébergeur
          // (503 au réveil d'une instance endormie, 500, page d'erreur
          // affichée pendant un déploiement) écrase l'index.html du cache.
          // L'écran hors ligne devient alors définitivement « 503 Service
          // Unavailable », même une fois le serveur revenu.
          if (response.ok) {
            const responseCopy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', responseCopy))
          }
          return response
        })
        .catch(() => caches.match('/index.html')),
    )
    return
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request)

      if (cachedResponse && isImmutable(requestUrl.pathname)) {
        return cachedResponse
      }

      const fromNetwork = fetch(event.request).then((response) => {
        if (response.ok) {
          cache.put(event.request, response.clone())
        }
        return response
      })

      if (!cachedResponse) {
        return fromNetwork
      }

      // Entrée à URL fixe déjà en cache : on répond immédiatement (l'appli
      // reste rapide et utilisable hors ligne) et on rafraîchit l'entrée en
      // arrière-plan, pour que le prochain chargement voie la nouvelle
      // version. L'échec réseau est ignoré : le cache fait déjà le travail.
      event.waitUntil(fromNetwork.catch(() => {}))
      return cachedResponse
    }),
  )
})
