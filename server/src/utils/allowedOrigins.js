import { env } from '../config/env.js'

// Liste unique des origines autorisées — partagée entre le CORS Express
// (API REST) et le CORS Socket.IO (temps réel). Avant ce fichier, chacun
// avait sa propre liste et elles divergeaient : Socket.IO n'autorisait que
// `env.clientUrl`, donc un joueur arrivant depuis un domaine accepté par
// l'API (ex: Vercel) voyait sa connexion temps réel rejetée en silence et
// restait bloqué sur "Connexion à la session…" sans jamais recevoir d'erreur
// explicite côté client.
export const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://medibible.vercel.app',
  env.clientUrl,
])

export function isOriginAllowed(origin) {
  return !origin || allowedOrigins.has(origin)
}
