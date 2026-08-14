import { HiCheck, HiX } from 'react-icons/hi'

export default function OptionButton({ text, selected, disabled, onClick, state, colorIndex = 0 }) {
  // Base styling for all option buttons
  const base = 'relative w-full rounded-2xl px-4 py-3 text-left font-semibold shadow-sm transition-transform duration-150 focus:outline-none focus:ring-2'
  const defaultBg = 'bg-white border border-gray-100 text-medi-petrol'
  const hover = 'hover:-translate-y-0.5'

  let classes = `${base} ${defaultBg} ${hover}`

  // Visual states
  if (state === 'correct') {
    classes = `${base} ${defaultBg} ring-2 ring-medi-green-deep/60 bg-medi-green-deep/6`
  } else if (state === 'incorrect') {
    classes = `${base} ${defaultBg} opacity-60 grayscale`
  } else if (selected) {
    classes = `${base} ${defaultBg} ring-2 ring-medi-gold/60 bg-medi-gold/6 shadow-md`
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      aria-disabled={disabled}
      onClick={onClick}
      className={classes}
    >
      <span>{text}</span>

      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-medi-petrol">
        {state === 'correct' ? <HiCheck /> : state === 'incorrect' && selected ? <HiX /> : null}
      </span>
    </button>
  )
}
