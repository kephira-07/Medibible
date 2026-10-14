import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { httpError } from '../utils/httpError.js'
import User from '../models/User.js'

// Vérifie le Bearer token et attache { id, role } à req.user.
export async function authenticate(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return next(httpError(401, 'Authentification requise.'))
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret)
    const user = await User.findById(payload.sub).select('role tokenVersion')
    if (!user || (payload.tokenVersion ?? 0) !== user.tokenVersion) {
      return next(httpError(401, 'Token invalide ou expiré.'))
    }
    req.user = { id: payload.sub, role: payload.role }
    next()
  } catch {
    next(httpError(401, 'Token invalide ou expiré.'))
  }
}

// À utiliser après authenticate — restreint l'accès à certains rôles.
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(httpError(403, "Vous n'avez pas les droits pour effectuer cette action."))
    }
    next()
  }
}
