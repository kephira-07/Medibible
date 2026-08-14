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
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      await login(email, password)
<<<<<<< HEAD
      navigate('/admin')
=======
      navigate('/admin')  // Redirige vers le tableau de bord après une connexion réussie
>>>>>>> a432979 (agen arielle)
    } catch (err) {
      setError(err.response?.data?.message || 'Connexion impossible. Vérifiez vos identifiants.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-medi-cream flex flex-col justify-between selection:bg-medi-gold/30">
      {/* Navigation supérieure */}
      <header className="w-full px-4 pt-4 sm:px-8 max-w-7xl mx-auto">
        <AppHeader />
      </header>

<<<<<<< HEAD
      <div className="flex w-full flex-1 items-center justify-center">
        <div className="w-full max-w-md rounded-[2rem] border border-medi-green-deep/10 bg-white/80 p-6 shadow-[0_20px_45px_rgba(15,50,61,0.07)] backdrop-blur-sm sm:p-8">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-medi-green-deep/70">
              Admin
=======
      {/* Zone centrale & Formulaire Mobile-First */}
      <div className="flex-1 flex flex-col justify-end sm:justify-center items-center px-0 sm:px-6 pt-6 pb-0 sm:pb-6">
        
        {/* Card : Style Sheet sur mobile, Carte suspendue sur Desktop */}
        <div className="w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-medi-green-deep/10 p-6 sm:p-10 shadow-[0_-12px_35px_rgba(15,50,61,0.06)] sm:shadow-[0_25px_50px_rgba(15,50,61,0.08)] transition-all duration-300">
          
          {/* Header du formulaire */}
          <div className="flex flex-col items-center text-center mb-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-medi-green-deep/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.18em] text-medi-green-deep">
              <span className="h-2 w-2 rounded-full bg-medi-green-deep animate-pulse" />
              Espace Animateur
            </span>
            
            <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-medi-petrol">
              Ravi de vous revoir !
            </h1>
            <p className="mt-1.5 text-sm text-medi-petrol/60">
              Connectez-vous pour piloter vos quiz en direct.
>>>>>>> a432979 (agen arielle)
            </p>
          </div>

          {/* Alerte Erreur */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-red-50 p-4 border border-red-200/60 text-red-700 text-sm">
              <svg className="h-5 w-5 shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-medi-petrol/70">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@medibible.app"
                className="w-full min-h-[52px] rounded-2xl border border-medi-green-deep/15 bg-medi-cream/40 px-4 text-medi-petrol placeholder:text-medi-petrol/35 text-base outline-none transition-all duration-200 focus:border-medi-green-deep focus:bg-white focus:ring-4 focus:ring-medi-green-deep/10"
              />
            </div>

            {/* Mot de passe */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-medi-petrol/70">
                Mot de passe
              </label>
              
              <div className="relative flex items-center">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-[52px] rounded-2xl border border-medi-green-deep/15 bg-medi-cream/40 pl-4 pr-12 text-medi-petrol placeholder:text-medi-petrol/35 text-base outline-none transition-all duration-200 focus:border-medi-green-deep focus:bg-white focus:ring-4 focus:ring-medi-green-deep/10"
                />
                
                {/* Bouton pour afficher/masquer le mot de passe */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 p-2 text-medi-petrol/50 hover:text-medi-petrol transition-colors"
                  aria-label="Afficher ou masquer le mot de passe"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a8.98 8.98 0 013.682-.793c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m-0.469 0.469A10.02 10.02 0 0112 19c-1.28 0-2.5-.24-3.618-.68" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Bouton Valider */}
            <Button 
              type="submit" 
              disabled={loading}
              className="mt-3 w-full min-h-[52px] text-base font-bold active:scale-[0.98] transition-transform"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Connexion en cours...</span>
                </div>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Footer minimaliste */}
      <footer className="py-4 text-center text-xs text-medi-petrol/40">
        MediBible &copy; {new Date().getFullYear()} • Accès sécurisé
      </footer>
    </main>
  )
}