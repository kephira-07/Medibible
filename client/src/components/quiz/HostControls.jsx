import Button from '../common/Button.jsx'
import { HiPlay, HiOutlineFlag } from 'react-icons/hi'

const LABELS = {
  lobby: 'Démarrer le quiz',
  open: 'Révéler les réponses',
  closed: 'Question suivante',
}

export default function HostControls({ phase, onNext, onEnd, disabled }) {
  const label = LABELS[phase] || 'Suivant'

  return (
    <div className="flex w-full max-w-md flex-col gap-2.5 rounded-2xl border-2 border-medi-border bg-white/90 p-4 shadow-md">
      <Button variant="gold" className="w-full flex items-center justify-center gap-2 text-base" onClick={onNext} disabled={disabled}>
        <HiPlay className="text-lg" />
        <span>{label}</span>
      </Button>
      {/* Clore la partie avant la dernière question — discret, pour ne pas
          concurrencer l'action principale, mais toujours accessible. */}
      {onEnd && (
        <button
          type="button"
          onClick={onEnd}
          disabled={disabled}
          className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-bold text-medi-petrol/55 transition hover:bg-medi-cream hover:text-medi-coral disabled:opacity-40"
        >
          <HiOutlineFlag />
          <span>Terminer la session</span>
        </button>
      )}
    </div>
  )
}
