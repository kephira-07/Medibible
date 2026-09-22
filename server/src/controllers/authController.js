import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import RefreshToken from '../models/RefreshToken.js'
import { env } from '../config/env.js'
import { httpError } from '../utils/httpError.js'
import { validateAuthInput } from '../utils/validators.js'

const ACCESS_TOKEN_TTL = '30d'
const REFRESH_TOKEN_TTL = '90d'
const SALT_ROUNDS = 10

function signAccessToken(user) {
  return jwt.sign({ role: user.role }, env.jwtSecret, {
    subject: String(user.id),
    expiresIn: ACCESS_TOKEN_TTL,
  })
}

function signRefreshToken(user) {
  return jwt.sign({ type: 'refresh', role: user.role }, env.jwtSecret, {
    subject: String(user.id),
    expiresIn: REFRESH_TOKEN_TTL,
  })
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

async function issueTokens(user) {
  const token = signAccessToken(user)
  const refreshToken = signRefreshToken(user)

  await RefreshToken.create({
    user: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })

  return { token, refreshToken }
}

function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, mustChangePassword: Boolean(user.mustChangePassword) }
}

async function getStaticEnvUser(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const candidates = [
    { role: 'admin', email: env.adminEmail?.trim().toLowerCase(), password: env.adminPassword },
  ]

  const matched = candidates.find(
    (candidate) => candidate.email && candidate.password && candidate.email === normalizedEmail
  )
  if (!matched) return null

  let user = await User.findOne({ email: normalizedEmail })

  // Dès que l'admin a défini son propre mot de passe, le mot de passe
  // d'amorçage (variable d'environnement, connue du développeur qui l'a
  // configurée) ne doit plus jamais permettre de se connecter à ce compte —
  // sinon changer son mot de passe depuis l'appli ne servirait à rien.
  if (user && !user.mustChangePassword) return null

  if (matched.password !== password) return null

  if (!user) {
    user = await User.create({
      name: 'Admin Env',
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(matched.password, SALT_ROUNDS),
      role: matched.role,
      mustChangePassword: true,
    })
  } else if (user.role !== matched.role) {
    user.role = matched.role
    await user.save()
  }

  return user
}

// POST /api/auth/register — toujours en rôle "player" : la promotion admin
// ne doit pas pouvoir être auto-attribuée depuis le body de la requête.
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {}

    try {
      validateAuthInput({ name, email, password })
    } catch (err) {
      return next(httpError(400, err.message))
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const existing = await User.findOne({ email: normalizedEmail })
    if (existing) return next(httpError(409, 'Un compte existe déjà avec cet email.'))

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'player',
    })

    const tokens = await issueTokens(user)
    res.status(201).json({ user: toPublicUser(user), token: tokens.token, refreshToken: tokens.refreshToken })
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {}

    try {
      validateAuthInput({ email, password })
    } catch (err) {
      return next(httpError(400, err.message))
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    const envUser = await getStaticEnvUser(normalizedEmail, password)
    if (envUser) {
      const tokens = await issueTokens(envUser)
      return res.json({ user: toPublicUser(envUser), token: tokens.token, refreshToken: tokens.refreshToken })
    }

    const user = await User.findOne({ email: normalizedEmail })
    if (!user) return next(httpError(401, 'Identifiants invalides.'))

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return next(httpError(401, 'Identifiants invalides.'))

    const tokens = await issueTokens(user)
    res.json({ user: toPublicUser(user), token: tokens.token, refreshToken: tokens.refreshToken })
  } catch (err) {
    next(err)
  }
  }

export async function refresh(req, res, next) {
  try {
    const refreshToken = req.body?.refreshToken
    if (!refreshToken) {
      return next(httpError(401, 'Refresh token requis.'))
    }

    let payload
    try {
      payload = jwt.verify(refreshToken, env.jwtSecret)
    } catch {
      return next(httpError(401, 'Refresh token invalide ou expiré.'))
    }

    if (payload.type !== 'refresh') {
      return next(httpError(401, 'Type de token invalide.'))
    }

    const stored = await RefreshToken.findOne({
      user: payload.sub,
      tokenHash: hashToken(refreshToken),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    })

    if (!stored) {
      return next(httpError(401, 'Session de rafraîchissement introuvable.'))
    }

    const user = await User.findById(payload.sub)
    if (!user) {
      await RefreshToken.deleteOne({ _id: stored._id })
      return next(httpError(401, 'Utilisateur introuvable.'))
    }

    const rotated = await issueTokens(user)
    await RefreshToken.deleteOne({ _id: stored._id })

    res.json({ user: toPublicUser(user), token: rotated.token, refreshToken: rotated.refreshToken })
  } catch (err) {
    next(err)
  }
}

export async function logout(req, res, next) {
  try {
    const refreshToken = req.body?.refreshToken || req.headers['x-refresh-token']
    if (refreshToken) {
      await RefreshToken.deleteOne({ tokenHash: hashToken(refreshToken) })
    }
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

// GET /api/auth/me — protégé par authenticate
export async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return next(httpError(404, 'Utilisateur introuvable.'))
    res.json(toPublicUser(user))
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/change-password — protégé par authenticate. Une fois le mot
// de passe changé, `mustChangePassword` retombe à false : le mot de passe
// d'amorçage (variable d'environnement) ne fonctionnera plus pour ce compte.
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body || {}

    if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
      return next(httpError(400, 'Le nouveau mot de passe doit contenir entre 8 et 128 caractères.'))
    }

    const user = await User.findById(req.user.id)
    if (!user) return next(httpError(404, 'Utilisateur introuvable.'))

    const valid = await bcrypt.compare(String(currentPassword || ''), user.passwordHash)
    if (!valid) return next(httpError(401, 'Mot de passe actuel incorrect.'))

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
    user.mustChangePassword = false
    await user.save()

    res.json({ user: toPublicUser(user) })
  } catch (err) {
    next(err)
  }
}
