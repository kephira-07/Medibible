import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button.jsx'
import AppHeader from '../components/common/AppHeader.jsx'

export default function JoinSession() {
  const navigate = useNavigate()
  const [accessCode, setAccessCode] = useState('')
  const [displayName, setDisplayName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!accessCode.trim() || !displayName.trim()) return
    navigate(`/session/${accessCode.trim().toUpperCase()}`, {
      state: { displayName: displayName.trim() },
    })
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
              Session en cours
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-medi-petrol">Rejoindre un quiz</h1>
            <p className="mt-2 text-sm text-medi-petrol/60">
              Demande le code à 6 caractères à l’animateur de la session.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-medi-petrol/75">
              Code de session
              <input
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="AB12CD"
                className="min-h-12 rounded-2xl border border-medi-green-deep/15 bg-medi-cream/60 px-4 text-center text-lg uppercase tracking-[0.35em] text-medi-petrol outline-none transition focus:border-medi-green-deep/35 focus:ring-4 focus:ring-medi-sky/20"
                maxLength={6}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-medi-petrol/75">
              Votre prénom
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Julie"
                className="min-h-12 rounded-2xl border border-medi-green-deep/15 bg-medi-cream/60 px-4 text-medi-petrol outline-none transition focus:border-medi-green-deep/35 focus:ring-4 focus:ring-medi-sky/20"
                maxLength={30}
              />
            </label>

            <Button type="submit" className="mt-2 w-full">
              Rejoindre
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
