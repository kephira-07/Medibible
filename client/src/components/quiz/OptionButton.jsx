// Palette façon jeu — chaque option a sa propre couleur vive, comme les
// cartes de réponse d'un quiz en direct, plutôt qu'un simple contour sobre.
const OPTION_STYLES = [
  { bg: 'bg-medi-coral', text: 'text-white' },
  { bg: 'bg-medi-sky', text: 'text-white' },
  { bg: 'bg-medi-gold', text: 'text-medi-petrol' },
]

// state: null | 'neutral' | 'correct' | 'incorrect' — 'neutral'/'correct'/'incorrect'
// n'apparaissent qu'après clôture, pour révéler les réponses.
export default function OptionButton({ text, selected, disabled, onClick, state, colorIndex = 0 }) {
  const palette = OPTION_STYLES[colorIndex % OPTION_STYLES.length]

  let extraClasses = `${palette.bg} ${palette.text}`
  let animationClass = ''

  if (state === 'correct') {
    extraClasses += ' ring-4 ring-white shadow-xl scale-[1.02]'
    animationClass = 'animate-bounce-in'
  } else if (state === 'incorrect') {
    extraClasses += ' opacity-50 grayscale-[0.4]'
    if (selected) animationClass = 'animate-wiggle'
  } else if (state === 'neutral') {
    extraClasses += ' opacity-40'
  } else if (selected) {
    extraClasses += ' ring-4 ring-white scale-[1.03] shadow-lg'
  } else {
    extraClasses += ' opacity-90 hover:opacity-100 hover:-translate-y-0.5'
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`relative min-h-14 w-full rounded-2xl px-4 py-3 text-left font-bold shadow-md transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:active:scale-100 ${extraClasses} ${animationClass}`}
    >
      {text}
      {state === 'correct' && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">✓</span>
      )}
      {state === 'incorrect' && selected && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">✕</span>
      )}
    </button>
  )
}
