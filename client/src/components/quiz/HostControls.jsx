import Button from '../common/Button.jsx'
import { HiPlay } from 'react-icons/hi'

const LABELS = {
  lobby: 'Démarrer le quiz',
  open: 'Révéler les réponses',
  closed: 'Question suivante',
}

export default function HostControls({ phase, onNext, disabled }) {
  const label = LABELS[phase] || 'Suivant'

  return (
    <div className="w-full max-w-md rounded-2xl bg-white/90 p-4 shadow-md">
      <Button variant="gold" className="w-full flex items-center justify-center gap-2" onClick={onNext} disabled={disabled}>
        <HiPlay className="text-lg" />
        <span>{label}</span>
      </Button>
    </div>
  )
}
