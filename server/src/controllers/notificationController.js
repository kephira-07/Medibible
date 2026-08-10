import webpush from 'web-push'
import { env } from '../config/env.js'
import PushSubscription from '../models/PushSubscription.js'
import { httpError } from '../utils/httpError.js'

let vapidConfigured = false
function ensureVapidConfigured() {
  if (vapidConfigured) return
  if (!env.vapidPublicKey || !env.vapidPrivateKey) {
    throw httpError(500, "Les clés VAPID ne sont pas configurées (server/.env).")
  }
  webpush.setVapidDetails('mailto:contact@medibible.app', env.vapidPublicKey, env.vapidPrivateKey)
  vapidConfigured = true
}

// GET /api/notifications/vapid-public-key — le client en a besoin pour s'abonner
export async function getVapidPublicKey(req, res, next) {
  try {
    if (!env.vapidPublicKey) return next(httpError(500, 'VAPID_PUBLIC_KEY non configurée.'))
    res.json({ publicKey: env.vapidPublicKey })
  } catch (err) {
    next(err)
  }
}

// POST /api/notifications/subscribe — public : un invité doit pouvoir s'abonner
// aux rappels sans compte, avant même de rejoindre une session.
export async function subscribe(req, res, next) {
  try {
    const { endpoint, keys } = req.body || {}
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return next(httpError(400, 'Abonnement push invalide.'))
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { endpoint, keys, user: req.user?.id || null },
      { upsert: true, setDefaultsOnInsert: true }
    )

    res.status(201).json({ ok: true })
  } catch (err) {
    next(err)
  }
}

// POST /api/notifications/unsubscribe
export async function unsubscribe(req, res, next) {
  try {
    const { endpoint } = req.body || {}
    if (!endpoint) return next(httpError(400, 'endpoint est requis.'))
    await PushSubscription.deleteOne({ endpoint })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

// POST /api/notifications/broadcast — réservé host/admin : rappel avant le
// démarrage d'un quiz live, envoyé à tous les abonnés.
export async function broadcast(req, res, next) {
  try {
    ensureVapidConfigured()

    const { title, body, url } = req.body || {}
    if (!title || !body) return next(httpError(400, 'title et body sont requis.'))

    const subscriptions = await PushSubscription.find()
    const payload = JSON.stringify({ title, body, url: url || '/' })

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload)
      )
    )

    // Un abonnement expiré/révoqué renvoie 404/410 : on le nettoie plutôt que
    // de re-tenter indéfiniment de notifier un endpoint mort.
    const staleIds = []
    results.forEach((result, i) => {
      if (result.status === 'rejected' && [404, 410].includes(result.reason?.statusCode)) {
        staleIds.push(subscriptions[i]._id)
      }
    })
    if (staleIds.length) await PushSubscription.deleteMany({ _id: { $in: staleIds } })

    const sent = results.filter((r) => r.status === 'fulfilled').length
    res.json({ sent, failed: results.length - sent, removed: staleIds.length })
  } catch (err) {
    next(err)
  }
}
