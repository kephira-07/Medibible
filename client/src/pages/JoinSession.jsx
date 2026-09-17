import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button.jsx'
import AppHeader from '../components/common/AppHeader.jsx'

export default function JoinSession() {
  const navigate = useNavigate()
  const [accessCode, setAccessCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bergerName, setBergerName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!accessCode.trim() || !displayName.trim() || !bergerName.trim()) return
    navigate(`/session/${accessCode.trim().toUpperCase()}`, {
      state: { displayName: displayName.trim(), bergerName: bergerName.trim() },
    })
  }

  return (
    <main className="flex min-h-svh flex-col items-center bg-medi-cream px-4 py-6">
      <div className="w-full max-w-5xl">
        <AppHeader />
      </div>

      <div className="flex w-full flex-1 items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border-2 border-medi-border bg-medi-surface/95 p-6 shadow-[0_22px_50px_rgba(22,50,62,0.1)] backdrop-blur-sm sm:p-8">
          <div className="mb-6 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-medi-coral">
              Session en cours
            </p>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-medi-petrol">Rejoindre un quiz</h1>
            <p className="mt-2 text-sm text-medi-petrol/60">
              Demande le code à 6 caractères à l’animateur de la session.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm font-bold text-medi-petrol/75">
              Code de session
              <input
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="AB12CD"
                className="min-h-14 rounded-2xl border-2 border-medi-gold/50 bg-medi-gold/10 px-4 text-center text-2xl font-extrabold uppercase tracking-[0.35em] text-medi-petrol outline-none transition focus:border-medi-gold focus:ring-4 focus:ring-medi-gold/25"
                maxLength={6}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-bold text-medi-petrol/75">
              Votre prénom
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Julie"
                className="min-h-12 rounded-2xl border-2 border-medi-border bg-white px-4 text-medi-petrol outline-none transition focus:border-medi-sky focus:ring-4 focus:ring-medi-sky/20"
                maxLength={30}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-bold text-medi-petrol/75">
              Votre groupe de maison / berger
              <input
                value={bergerName}
                onChange={(e) => setBergerName(e.target.value)}
                placeholder="Ex: Groupe Bethsaïda"
                required
                className="min-h-12 rounded-2xl border-2 border-medi-border bg-white px-4 text-medi-petrol outline-none transition focus:border-medi-sky focus:ring-4 focus:ring-medi-sky/20"
                maxLength={40}
              />
            </label>

            <Button variant="coral" type="submit" className="mt-2 w-full text-base">
              🎮 Rejoindre
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
