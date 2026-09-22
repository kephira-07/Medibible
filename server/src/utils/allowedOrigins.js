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

// `host` est l'en-tête Host de la requête (ex: "medibible.onrender.com").
// Le serveur sert lui-même le client buildé (client/dist) sur ce même
// domaine en production, donc une requête dont l'Origin correspond
// exactement au domaine qui la sert est forcément légitime — même si
// CLIENT_URL a été mal configuré (mauvaise valeur, oubli après un
// changement de nom de domaine sur l'hébergeur, etc.). Ce filet de
// sécurité évite qu'une simple variable d'environnement mal réglée ne
// bloque silencieusement tous les joueurs avec "Connexion à la session…"
// qui ne se termine jamais.
export function isOriginAllowed(origin, host) {
  if (!origin) return true
  if (allowedOrigins.has(origin)) return true
  if (host && (origin === `https://${host}` || origin === `http://${host}`)) return true
  return false
}
