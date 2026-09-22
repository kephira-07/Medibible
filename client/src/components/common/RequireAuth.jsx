import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const CHANGE_PASSWORD_PATH = '/admin/changer-mot-de-passe'

export default function RequireAuth({ children }) {
  const { user } = useAuth()
  const { pathname } = useLocation()

  if (!user) return <Navigate to="/login" replace />

  // Le compte utilise encore le mot de passe d'amorçage (connu du
  // développeur) — bloque l'accès à tout le reste tant qu'il n'a pas été
  // changé, quelle que soit la page demandée.
  if (user.mustChangePassword && pathname !== CHANGE_PASSWORD_PATH) {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace />
  }

  return children
}
