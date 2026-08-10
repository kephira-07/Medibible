import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { env } from '../config/env.js'
import { httpError } from '../utils/httpError.js'

const TOKEN_TTL = '7d'
const SALT_ROUNDS = 10

function signToken(user) {
  return jwt.sign({ role: user.role }, env.jwtSecret, {
    subject: String(user.id),
    expiresIn: TOKEN_TTL,
  })
}

function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role }
}

// POST /api/auth/register — toujours en rôle "player" : la promotion
// admin/host ne doit pas pouvoir être auto-attribuée depuis le body de la requête.
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return next(httpError(400, 'name, email et password sont requis.'))
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) return next(httpError(409, 'Un compte existe déjà avec cet email.'))

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await User.create({ name, email, passwordHash, role: 'player' })

    res.status(201).json({ user: toPublicUser(user), token: signToken(user) })
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return next(httpError(400, 'email et password sont requis.'))
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return next(httpError(401, 'Identifiants invalides.'))

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return next(httpError(401, 'Identifiants invalides.'))

    res.json({ user: toPublicUser(user), token: signToken(user) })
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
