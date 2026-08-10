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
    <main className="relative flex min-h-svh flex-col items-center justify-center gap-10 overflow-hidden bg-medi-cream px-4 py-10 text-center">
      <FloatingBlobs />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <BrandMark className="animate-sway h-20 w-20" />
        <div>
          <h1 className="text-3xl font-bold text-medi-petrol sm:text-4xl">MediBible</h1>
          <p className="mt-1 text-medi-petrol/70">Quiz bibliques interactifs, en direct, entre vous</p>
        </div>
      </div>

      <div className="relative z-10 flex w-full max-w-xs flex-col gap-3">
        <Link to="/join" className="w-full">
          <Button className="w-full">Rejoindre un quiz</Button>
        </Link>
        <Link to="/login" className="w-full">
          <Button variant="outline" className="w-full">
            Espace animateur
          </Button>
        </Link>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={subscribe}
          disabled={status === 'subscribing' || status === 'subscribed'}
          className="text-sm font-medium text-medi-petrol/60 underline decoration-medi-petrol/30 underline-offset-4 disabled:no-underline"
        >
          {STATUS_LABELS[status]}
        </button>
        {status === 'error' && error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </main>
  )
}
