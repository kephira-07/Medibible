import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { httpError } from '../utils/httpError.js'

// Vérifie le Bearer token et attache { id, role } à req.user.
export function authenticate(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return next(httpError(401, 'Authentification requise.'))
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret)
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
