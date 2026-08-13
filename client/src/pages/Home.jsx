import { Link } from 'react-router-dom'
import Button from '../components/common/Button.jsx'
import BrandMark from '../components/common/BrandMark.jsx'
import FloatingBlobs from '../components/common/FloatingBlobs.jsx'
import { usePushNotifications } from '../hooks/usePushNotifications.js'

const STATUS_LABELS = {
  idle: '🔔 Me prévenir avant le prochain quiz',
  subscribing: 'Activation…',
  subscribed: '✅ Rappels activés',
  unsupported: 'Notifications non supportées par ce navigateur',
  error: 'Réessayer',
}

export default function Home() {
  const { status, error, subscribe } = usePushNotifications()

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-medi-cream px-4 py-10 text-center">
      <FloatingBlobs />

      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-medi-green-deep/10 bg-white/75 p-6 shadow-[0_18px_45px_rgba(15,50,61,0.07)] backdrop-blur-sm sm:p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-medi-green-deep/5 ring-1 ring-medi-green-deep/10">
            <BrandMark className="animate-sway h-16 w-16" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-medi-green-deep/70">
              Quiz biblique en direct
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-medi-petrol sm:text-4xl">
              MediBible
            </h1>
            <p className="mt-2 text-sm leading-6 text-medi-petrol/70 sm:text-base">
              Quiz bibliques interactifs, en direct, entre vous.
            </p>
          </div>
        </div>

        <div className="mt-8 flex w-full flex-col gap-3">
          <Link to="/join" className="w-full">
            <Button className="w-full">Rejoindre un quiz</Button>
          </Link>
          <Link to="/login" className="w-full">
            <Button variant="outline" className="w-full">
              Espace animateur
            </Button>
          </Link>
        </div>

        <div className="mt-7 flex flex-col items-center gap-2 border-t border-medi-green-deep/10 pt-4">
          <button
            type="button"
            onClick={subscribe}
            disabled={status === 'subscribing' || status === 'subscribed'}
            className="text-sm font-medium text-medi-petrol/65 underline decoration-medi-gold/50 underline-offset-4 transition hover:text-medi-petrol disabled:no-underline"
          >
            {STATUS_LABELS[status]}
          </button>
          {status === 'error' && error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </main>
  )
}
