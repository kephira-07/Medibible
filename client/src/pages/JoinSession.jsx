import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button.jsx'
import AppHeader from '../components/common/AppHeader.jsx'
import WelcomeIllustration from '../components/common/WelcomeIllustration.jsx'
import api from '../services/api.js'
import { HiCheckCircle, HiXCircle } from 'react-icons/hi'
import { AVATARS } from '../utils/avatars.js'
import Avatar from '../components/common/Avatar.jsx'

const BERGERS = ['Charles HE', 'Charles DAKPE', 'Edwige', 'Délali', 'Pascaline', 'Prunelle']

export default function JoinSession() {
  const navigate = useNavigate()
  const [accessCode, setAccessCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bergerName, setBergerName] = useState('')
  const [avatar, setAvatar] = useState('')
  // idle | checking | valid | invalid — vérifie le code auprès du serveur dès
  // que 6 caractères sont saisis, pour prévenir tout de suite d'une faute de
  // frappe plutôt que de laisser le joueur naviguer vers une session qui
  // n'existe pas et découvrir l'erreur plus tard.
  const [codeStatus, setCodeStatus] = useState('idle')
  const [codeInfo, setCodeInfo] = useState(null)

  useEffect(() => {
    const normalized = accessCode.trim().toUpperCase()
    if (normalized.length !== 6) {
      setCodeStatus('idle')
      setCodeInfo(null)
      return
    }

    let cancelled = false
    setCodeStatus('checking')
    const timer = setTimeout(() => {
      api
        .get(`/sessions/${normalized}`)
        .then(({ data }) => {
          if (cancelled) return
          setCodeStatus('valid')
          setCodeInfo(data)
        })
        .catch(() => {
          if (cancelled) return
          setCodeStatus('invalid')
          setCodeInfo(null)
        })
    }, 350)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [accessCode])

  const canSubmit = codeStatus === 'valid' && displayName.trim() && bergerName && avatar

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return

    navigate(`/session/${accessCode.trim().toUpperCase()}`, {
      state: { displayName: displayName.trim(), bergerName, avatar },
    })
  }

  return (
    <main className="flex min-h-svh flex-col items-center bg-medi-cream px-4 py-6">
      <div className="w-full max-w-5xl">
        <AppHeader />
      </div>

      <div className="flex w-full flex-1 items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border-2 border-medi-border bg-medi-surface/95 p-6 shadow-[0_22px_50px_rgba(22,50,62,0.1)] backdrop-blur-sm sm:p-8">
          <div className="mb-4 flex justify-center">
            <WelcomeIllustration className="h-32 w-32" />
          </div>

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
                id="accessCode"
                name="accessCode"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="AB12CD"
                autoComplete="off"
                className={`min-h-14 rounded-2xl border-2 bg-medi-gold/10 px-4 text-center text-2xl font-extrabold uppercase tracking-[0.35em] text-medi-petrol outline-none transition focus:ring-4 ${
                  codeStatus === 'valid'
                    ? 'border-emerald-400 focus:border-emerald-400 focus:ring-emerald-200/40'
                    : codeStatus === 'invalid'
                      ? 'border-medi-coral focus:border-medi-coral focus:ring-medi-coral/20'
                      : 'border-medi-gold/50 focus:border-medi-gold focus:ring-medi-gold/25'
                }`}
                maxLength={6}
              />
              {codeStatus === 'checking' && (
                <span className="text-center text-xs font-semibold text-medi-petrol/50">Vérification du code…</span>
              )}
              {codeStatus === 'valid' && (
                <span className="flex items-center justify-center gap-1.5 text-center text-xs font-bold text-emerald-600">
                  <HiCheckCircle className="text-sm" /> {codeInfo?.quizTitle}
                  {codeInfo?.status === 'ended' && ' — session terminée'}
                </span>
              )}
              {codeStatus === 'invalid' && (
                <span className="flex items-center justify-center gap-1.5 text-center text-xs font-bold text-medi-coral">
                  <HiXCircle className="text-sm" /> Aucune session ne correspond à ce code.
                </span>
              )}
            </label>

            <label className="flex flex-col gap-2 text-sm font-bold text-medi-petrol/75">
              Votre prénom
              <input
                id="displayName"
                name="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Julie"
                className="min-h-12 rounded-2xl border-2 border-medi-border bg-white px-4 text-medi-petrol outline-none transition focus:border-medi-sky focus:ring-4 focus:ring-medi-sky/20"
                maxLength={30}
              />
            </label>

            <div className="flex flex-col gap-2 text-sm font-bold text-medi-petrol/75">
              Choisis ton avatar
              <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Avatar">
                {AVATARS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    role="radio"
                    aria-checked={avatar === a.id}
                    aria-label={a.label}
                    title={a.label}
                    onClick={() => setAvatar(a.id)}
                    className={`flex aspect-square items-center justify-center rounded-2xl border-2 transition ${
                      avatar === a.id
                        ? 'scale-105 border-medi-green-deep bg-medi-green-deep/10 shadow-md'
                        : 'border-medi-border bg-white hover:border-medi-sky'
                    }`}
                  >
                    <Avatar name={a.label} avatar={a.id} size={36} />
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-2 text-sm font-bold text-medi-petrol/75">
              Votre berger
              <select
                id="bergerName"
                name="bergerName"
                value={bergerName}
                onChange={(e) => setBergerName(e.target.value)}
                className={`min-h-12 appearance-none rounded-2xl border-2 bg-white bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%2316323E%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.1rem] bg-[right_1rem_center] bg-no-repeat px-4 pr-10 text-medi-petrol outline-none transition focus:ring-4 ${
                  bergerName ? 'border-medi-green-deep' : 'border-medi-border'
                } focus:border-medi-sky focus:ring-medi-sky/20`}
              >
                <option value="" disabled>
                  Choisis ton berger…
                </option>
                {BERGERS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>

            <Button
              variant="primary"
              type="submit"
              disabled={!canSubmit}
              className="mt-2 w-full text-base"
            >
              Rejoindre
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
