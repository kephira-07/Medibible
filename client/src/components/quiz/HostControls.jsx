import Button from '../common/Button.jsx'

const LABELS = {
  lobby: 'Démarrer le quiz',
  open: 'Révéler les réponses',
  closed: 'Question suivante',
}

export default function HostControls({ phase, onNext, disabled }) {
  return (
    <div className="w-full max-w-md rounded-2xl bg-medi-petrol p-4 text-center">
      <Button variant="gold" className="w-full" onClick={onNext} disabled={disabled}>
        {LABELS[phase] || 'Suivant'}
      </Button>
    </div>
  )
}
