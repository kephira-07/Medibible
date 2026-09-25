import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import Session from '../models/Session.js'
import { httpError } from '../utils/httpError.js'
import { sanitizeAvatar } from '../utils/avatars.js'

const livekitRoom = (accessCode) => `medibible-${accessCode}`

// Salons où l'animateur a demandé "couper tous les micros" : les joueurs qui
// arrivent ensuite doivent eux aussi être muets (mémoire du processus, un
// redémarrage remet simplement les micros à l'état normal).
const mutedRooms = new Set()

function isLivekitConfigured() {
  return Boolean(env.livekitUrl && env.livekitApiKey && env.livekitApiSecret)
}

function roomService() {
  // Le SDK serveur parle en HTTPS, pas en WebSocket.
  const httpUrl = env.livekitUrl.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:')
  return new RoomServiceClient(httpUrl, env.livekitApiKey, env.livekitApiSecret)
}

// Jeton optionnel : route publique (les invités n'ont pas de compte), mais si
// un jeton admin valide accompagne la requête on peut reconnaître l'animateur.
function readOptionalUser(req) {
  const [scheme, token] = (req.headers.authorization || '').split(' ')
  if (scheme !== 'Bearer' || !token) return null
  try {
    const payload = jwt.verify(token, env.jwtSecret)
    return { id: payload.sub, role: payload.role }
  } catch {
    return null
  }
}

function parseMetadata(raw) {
  try {
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// POST /api/audio/token — jeton d'accès au salon vocal LiveKit d'une session.
// Public : les invités sans compte doivent pouvoir rejoindre le vocal.
export async function getAudioToken(req, res, next) {
  try {
    if (!isLivekitConfigured()) {
      return next(httpError(500, "LiveKit n'est pas configuré (server/.env)."))
    }

    const { roomName, displayName, avatar } = req.body || {}
    if (!roomName || !displayName) {
      return next(httpError(400, 'roomName et displayName sont requis.'))
    }

    const accessCode = String(roomName).toUpperCase()
    const session = await Session.findOne({ accessCode }).select('host')
    if (!session) return next(httpError(404, 'Session introuvable.'))

    // Seul le véritable animateur de cette session est marqué "hôte" — ce
    // statut ne vient jamais du corps de la requête.
    const user = readOptionalUser(req)
    const isHost = Boolean(user) && user.role === 'admin' && session.host.toString() === user.id

    // L'identité doit être unique dans le salon (deux invités peuvent choisir
    // le même prénom) ; `name` reste le nom affiché tel quel.
    const identity = `${displayName}-${Math.random().toString(36).slice(2, 8)}`

    const at = new AccessToken(env.livekitApiKey, env.livekitApiSecret, {
      identity,
      name: displayName,
      ttl: '4h',
      metadata: JSON.stringify({ avatar: sanitizeAvatar(avatar), isHost }),
    })
    at.addGrant({
      room: livekitRoom(accessCode),
      roomJoin: true,
      canPublish: isHost || !mutedRooms.has(accessCode),
      canSubscribe: true,
    })

    const token = await at.toJwt()
    res.json({ token, url: env.livekitUrl })
  } catch (err) {
    next(err)
  }
}

// POST /api/audio/mic-permission — l'animateur autorise ou coupe le micro d'un
// joueur (`identity`) ou de tous les joueurs (sans `identity`). Couper retire
// le droit de publier : le micro se ferme aussitôt et le joueur ne peut pas le
// rouvrir tant que l'animateur ne lui rend pas la parole.
export async function setMicPermission(req, res, next) {
  try {
    if (!isLivekitConfigured()) {
      return next(httpError(500, "LiveKit n'est pas configuré (server/.env)."))
    }

    const { accessCode, identity, canPublish } = req.body || {}
    if (!accessCode || typeof canPublish !== 'boolean') {
      return next(httpError(400, 'accessCode et canPublish (booléen) sont requis.'))
    }

    const code = String(accessCode).toUpperCase()
    const session = await Session.findOne({ accessCode: code }).select('host')
    if (!session) return next(httpError(404, 'Session introuvable.'))
    if (session.host.toString() !== req.user.id) {
      return next(httpError(403, "Vous n'êtes pas l'animateur de cette session."))
    }

    const service = roomService()
    const room = livekitRoom(code)
    const participants = await service.listParticipants(room)

    const targets = identity
      ? participants.filter((p) => p.identity === identity)
      : participants.filter((p) => !parseMetadata(p.metadata).isHost)

    if (identity && targets.length === 0) {
      return next(httpError(404, 'Participant introuvable dans le vocal.'))
    }
    if (identity && parseMetadata(targets[0].metadata).isHost) {
      return next(httpError(400, "Le micro de l'animateur ne se coupe pas ici."))
    }

    if (!identity) {
      if (canPublish) mutedRooms.delete(code)
      else mutedRooms.add(code)
    }

    await Promise.all(
      targets.map((p) =>
        service.updateParticipant(room, p.identity, undefined, {
          canPublish,
          canSubscribe: true,
          canPublishData: true,
        })
      )
    )

    res.json({ ok: true, updated: targets.length })
  } catch (err) {
    next(err)
  }
}
