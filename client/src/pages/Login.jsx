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
      navigate('/host')
    } catch (err) {
      setError(err.response?.data?.message || 'Connexion impossible.')
    }
  }

  return (
    <main className="flex min-h-svh flex-col items-center bg-medi-cream px-4">
      <AppHeader />
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-6">
        <h1 className="text-2xl font-bold text-medi-petrol">Connexion animateur</h1>
        <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="min-h-12 rounded-2xl border-2 border-medi-petrol/15 bg-white px-4 text-medi-petrol"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="min-h-12 rounded-2xl border-2 border-medi-petrol/15 bg-white px-4 text-medi-petrol"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full">
            Se connecter
          </Button>
        </form>
      </div>
    </main>
  )
}
