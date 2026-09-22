import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import api from '../../services/api.js'
import Button from '../../components/common/Button.jsx'
import BrandMark from '../../components/common/BrandMark.jsx'
import { HiOutlineLockClosed } from 'react-icons/hi'

// Passage obligé pour tout compte encore sur le mot de passe d'amorçage
// (variable d'environnement, connue de la personne qui a configuré le
// serveur) — tant que ce n'est pas fait, RequireAuth redirige systématiquement
// ici, quelle que soit la page demandée.
export default function ChangePasswordPage() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setSubmitting(true)
    try {
      const { data } = await api.post('/auth/change-password', { currentPassword, newPassword })
      updateUser(data.user)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de changer le mot de passe.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-medi-cream px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border-2 border-medi-border bg-medi-surface/95 p-6 shadow-[0_22px_50px_rgba(22,50,62,0.1)] sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandMark className="h-12 w-12" />
          <span className="mt-4 flex h-11 w-11 items-center justify-center rounded-full bg-medi-gold/15 text-xl text-medi-gold">
            <HiOutlineLockClosed />
          </span>
          <h1 className="mt-3 text-xl font-extrabold text-medi-petrol">Choisis ton mot de passe</h1>
          <p className="mt-2 text-sm text-medi-petrol/65">
            Bienvenue {user?.name} — pour sécuriser ton compte, choisis un mot de passe personnel avant de continuer.
            Le mot de passe fourni au démarrage ne fonctionnera plus ensuite.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-bold text-medi-petrol/75">
            Mot de passe actuel
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="min-h-12 rounded-2xl border-2 border-medi-border bg-white px-4 text-medi-petrol outline-none transition focus:border-medi-sky focus:ring-4 focus:ring-medi-sky/20"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-bold text-medi-petrol/75">
            Nouveau mot de passe
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="8 caractères minimum"
              className="min-h-12 rounded-2xl border-2 border-medi-border bg-white px-4 text-medi-petrol outline-none transition focus:border-medi-sky focus:ring-4 focus:ring-medi-sky/20"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-bold text-medi-petrol/75">
            Confirme le nouveau mot de passe
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="min-h-12 rounded-2xl border-2 border-medi-border bg-white px-4 text-medi-petrol outline-none transition focus:border-medi-sky focus:ring-4 focus:ring-medi-sky/20"
              required
            />
          </label>

          {error && (
            <p className="rounded-xl border-2 border-medi-coral/30 bg-medi-coral/10 px-4 py-2 text-sm font-semibold text-medi-coral">
              {error}
            </p>
          )}

          <Button variant="primary" type="submit" disabled={submitting} className="mt-2 w-full text-base">
            {submitting ? 'Enregistrement…' : 'Enregistrer et continuer'}
          </Button>

          <button
            type="button"
            onClick={logout}
            className="text-center text-xs font-semibold text-medi-petrol/50 hover:underline"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </main>
  )
}
