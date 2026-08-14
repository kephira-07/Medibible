import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Button from '../components/common/Button.jsx'
import AppHeader from '../components/common/AppHeader.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password)
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.message || 'Connexion impossible.')
    }
  }

  return (
    <main className="flex min-h-svh flex-col items-center bg-medi-cream px-4 py-6">
      <div className="w-full max-w-5xl">
        <AppHeader />
      </div>

      <div className="flex w-full flex-1 items-center justify-center">
        <div className="w-full max-w-md rounded-[2rem] border border-medi-green-deep/10 bg-white/80 p-6 shadow-[0_20px_45px_rgba(15,50,61,0.07)] backdrop-blur-sm sm:p-8">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-medi-green-deep/70">
              Admin
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-medi-petrol">Connexion</h1>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-medi-petrol/75">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@medibible.app"
                className="min-h-12 rounded-2xl border border-medi-green-deep/15 bg-medi-cream/60 px-4 text-medi-petrol outline-none transition focus:border-medi-green-deep/35 focus:ring-4 focus:ring-medi-sky/20"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-medi-petrol/75">
              Mot de passe
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="min-h-12 rounded-2xl border border-medi-green-deep/15 bg-medi-cream/60 px-4 text-medi-petrol outline-none transition focus:border-medi-green-deep/35 focus:ring-4 focus:ring-medi-sky/20"
              />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="mt-2 w-full">
              Se connecter
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
