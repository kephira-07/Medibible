import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button.jsx'
import AppHeader from '../components/common/AppHeader.jsx'
import WelcomeIllustration from '../components/common/WelcomeIllustration.jsx'
import api from '../services/api.js'
import { HiCheckCircle, HiXCircle } from 'react-icons/hi'

const BERGERS = ['Charles HE', 'Charles DAKPE', 'Edwige', 'Délali', 'Pascaline', 'Prunelle']

export default function JoinSession() {
  const navigate = useNavigate()
  const [accessCode, setAccessCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bergerName, setBergerName] = useState('')
  // idle | checking | valid | invalid | unreachable — vérifie le code auprès
  // du serveur dès que 6 caractères sont saisis, pour prévenir tout de suite
  // d'une faute de frappe plutôt que de laisser le joueur naviguer vers une
  // session qui n'existe pas et découvrir l'erreur plus tard.
  const [codeStatus, setCodeStatus] = useState('idle')
  const [codeInfo, setCodeInfo] = useState(null)
  const [codeError, setCodeError] = useState(null)
  // L'instance gratuite de l'hébergeur s'endort après quelques minutes sans
  // trafic : la première requête peut alors mettre 50 secondes ou plus à
  // revenir. Sans ce signal, le joueur n'a sous les yeux qu'un bouton grisé
  // et conclut que l'application est cassée.
  const [serverIsWakingUp, setServerIsWakingUp] = useState(false)
  // Une panne réseau ne change pas le code saisi : sans ce compteur, l'effet
  // ne se rejouerait jamais et le joueur resterait bloqué sans recours.
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const normalized = accessCode.trim().toUpperCase()
    if (normalized.length !== 6) {
      setCodeStatus('idle')
      setCodeInfo(null)
      setCodeError(null)
      setServerIsWakingUp(false)
      return
    }

    let cancelled = false
    setCodeStatus('checking')
    setServerIsWakingUp(false)

    const wakeUpNotice = setTimeout(() => {
      if (!cancelled) setServerIsWakingUp(true)
    }, 4000)

    const timer = setTimeout(() => {
      api
        .get(`/sessions/${normalized}`)
        .then(({ data }) => {
          if (cancelled) return
          setCodeStatus('valid')
          setCodeInfo(data)
          setCodeError(null)
        })
        .catch((err) => {
          if (cancelled) return
          setCodeInfo(null)
          // Sans réponse HTTP, le serveur est injoignable : le code saisi n'y
          // est pour rien. Annoncer « aucune session ne correspond » enverrait
          // le joueur chercher une faute de frappe inexistante, alors que le
          // vrai geste utile est de réessayer.
          if (!err.response) {
            setCodeStatus('unreachable')
            setCodeError(null)
            return
          }
          setCodeStatus('invalid')
          // Le code peut être refusé pour une raison précise — par exemple un
          // quiz supprimé entre-temps (410).
          setCodeError(err.response.status === 410 ? err.response.data?.message : null)
        })
        .finally(() => {
          if (!cancelled) setServerIsWakingUp(false)
        })
    }, 350)

    return () => {
      cancelled = true
      clearTimeout(timer)
      clearTimeout(wakeUpNotice)
    }
  }, [accessCode, retryCount])

  // Le bouton était simplement grisé quand l'une des trois conditions
  // manquait, sans jamais dire laquelle — on énumère donc ce qui reste à
  // faire plutôt que de laisser le joueur deviner.
  const missing = []
  if (codeStatus !== 'valid') missing.push('un code de session valide')
  if (!displayName.trim()) missing.push('ton prénom')
  if (!bergerName) missing.push('ton berger')
  const canSubmit = missing.length === 0
  const missingText =
    missing.length > 1
      ? `${missing.slice(0, -1).join(', ')} et ${missing[missing.length - 1]}`
      : missing[0]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return

    navigate(`/session/${accessCode.trim().toUpperCase()}`, {
      state: { displayName: displayName.trim(), bergerName },
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
                    : codeStatus === 'invalid' || codeStatus === 'unreachable'
                      ? 'border-medi-coral focus:border-medi-coral focus:ring-medi-coral/20'
                      : 'border-medi-gold/50 focus:border-medi-gold focus:ring-medi-gold/25'
                }`}
                maxLength={6}
              />
              {codeStatus === 'checking' && (
                <span className="text-center text-xs font-semibold text-medi-petrol/50">
                  {serverIsWakingUp
                    ? 'Le serveur se réveille, cela peut prendre jusqu’à une minute…'
                    : 'Vérification du code…'}
                </span>
              )}
              {codeStatus === 'unreachable' && (
                <span className="flex flex-col items-center gap-1 text-center text-xs font-bold text-medi-coral">
                  <span className="flex items-center gap-1.5">
                    <HiXCircle className="text-sm" /> Serveur injoignable — vérifie ta connexion.
                  </span>
                  <button
                    type="button"
                    onClick={() => setRetryCount((count) => count + 1)}
                    className="font-bold text-medi-petrol/70 underline underline-offset-2 transition hover:text-medi-petrol"
                  >
                    Réessayer
                  </button>
                </span>
              )}
              {codeStatus === 'valid' && (
                <span className="flex items-center justify-center gap-1.5 text-center text-xs font-bold text-emerald-600">
                  <HiCheckCircle className="text-sm" /> {codeInfo?.quizTitle}
                  {codeInfo?.status === 'ended' && ' — session terminée'}
                </span>
              )}
              {codeStatus === 'invalid' && (
                <span className="flex items-center justify-center gap-1.5 text-center text-xs font-bold text-medi-coral">
                  <HiXCircle className="text-sm" /> {codeError || 'Aucune session ne correspond à ce code.'}
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

            {!canSubmit && (
              <p className="-mt-2 text-center text-xs font-semibold text-medi-petrol/55">
                Il manque {missingText} pour pouvoir rejoindre.
              </p>
            )}
          </form>
        </div>
      </div>
    </main>
  )
}
