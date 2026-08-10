import { AccessToken } from 'livekit-server-sdk'
import { env } from '../config/env.js'
import { httpError } from '../utils/httpError.js'

// POST /api/audio/token — jeton d'accès au salon vocal LiveKit d'une session.
// Public : les invités sans compte doivent pouvoir rejoindre le vocal.
export async function getAudioToken(req, res, next) {
  try {
    if (!env.livekitUrl || !env.livekitApiKey || !env.livekitApiSecret) {
      return next(httpError(500, "LiveKit n'est pas configuré (server/.env)."))
    }

    const { roomName, displayName } = req.body || {}
    if (!roomName || !displayName) {
      return next(httpError(400, 'roomName et displayName sont requis.'))
    }

    // L'identité doit être unique dans le salon (deux invités peuvent choisir
    // le même prénom) ; `name` reste le nom affiché tel quel.
    const identity = `${displayName}-${Math.random().toString(36).slice(2, 8)}`

    const at = new AccessToken(env.livekitApiKey, env.livekitApiSecret, {
      identity,
      name: displayName,
      ttl: '4h',
    })
    at.addGrant({
      room: `medibible-${roomName}`,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    })

    const token = await at.toJwt()
    res.json({ token, url: env.livekitUrl })
  } catch (err) {
    next(err)
  }
}
