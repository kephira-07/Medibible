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
    <main className="flex min-h-svh flex-col items-center bg-medi-cream px-4">
      <AppHeader />
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-medi-petrol">Rejoindre un quiz</h1>
          <p className="mt-1 text-sm text-medi-petrol/60">
            Demande le code à 6 caractères à l'animateur de la session
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
          <input
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="Code de session (ex: AB12CD)"
            className="min-h-12 rounded-2xl border-2 border-medi-petrol/15 bg-white px-4 text-center text-lg uppercase tracking-[0.3em] text-medi-petrol"
            maxLength={6}
          />
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Votre prénom"
            className="min-h-12 rounded-2xl border-2 border-medi-petrol/15 bg-white px-4 text-medi-petrol"
            maxLength={30}
          />
          <Button type="submit" className="w-full">
            Rejoindre
          </Button>
        </form>
      </div>
    </main>
  )
}
