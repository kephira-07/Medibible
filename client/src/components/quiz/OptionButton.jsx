import { HiCheck, HiX } from 'react-icons/hi'

// Chaque option a une couleur de jeu fixe selon sa position — cohérent avec
// les chips colorées de l'éditeur de quiz (QuestionEditor).
const GAME_COLORS = [
  { bg: 'bg-medi-coral', text: 'text-white' },
  { bg: 'bg-medi-sky', text: 'text-white' },
  { bg: 'bg-medi-gold', text: 'text-medi-petrol' },
  { bg: 'bg-medi-green-sage', text: 'text-white' },
]

export default function OptionButton({ text, letter, selected, disabled, onClick, state, colorIndex = 0, className = '' }) {
  const color = GAME_COLORS[colorIndex % GAME_COLORS.length]

  const base = 'relative flex min-h-24 w-full flex-col justify-between rounded-lg p-3.5 text-left font-bold text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-medi-surface'
  const idle = `${color.bg} ${color.text} hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 active:scale-[0.98]`

  let classes = `${base} ${idle}`

  if (state === 'correct') {
    // Bonne réponse révélée : reste dans sa couleur, mais gagne un halo net + une pastille de validation.
    classes = `${base} ${color.bg} ${color.text} ring-4 ring-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.25),0_14px_28px_rgba(16,185,129,0.3)] scale-[1.02]`
  } else if (state === 'incorrect') {
    // Mauvaise réponse cochée : s'assombrit et tremble une fois pour marquer clairement l'erreur.
    classes = `${base} ${color.bg} ${color.text} opacity-45 grayscale animate-wiggle`
  } else if (state === 'neutral') {
    // Ni la bonne réponse ni celle cochée : s'efface pour que l'œil aille droit sur la bonne réponse.
    classes = `${base} ${color.bg} ${color.text} opacity-30`
  } else if (selected) {
    classes = `${base} ${color.bg} ${color.text} ring-4 ring-white/70 shadow-[0_14px_28px_rgba(22,50,62,0.22)] scale-[1.02]`
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      aria-disabled={disabled}
      onClick={onClick}
      className={`${classes} ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-black/15 text-xs font-extrabold">
          {letter}
        </span>

        {selected && state !== 'correct' && state !== 'incorrect' && (
          <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-medi-petrol">
            <HiCheck /> Choisi
          </span>
        )}
        {(state === 'correct' || (state === 'incorrect' && selected)) && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-base">
            {state === 'correct' ? <HiCheck className="text-emerald-600" /> : <HiX className="text-rose-600" />}
          </span>
        )}
      </div>

      <span className="mt-2 leading-snug">{text}</span>
    </button>
  )
}
