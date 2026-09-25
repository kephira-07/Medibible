const COLORS = ['#C1613C', '#8B6F4E', '#D9924A', '#4C8B3E', '#006414']

function colorForName(name) {
  let hash = 0
  const str = name || ''
  for (let i = 0; i < str.length; i += 1) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

// Pastille ronde : l'initiale du prénom sur une couleur stable.
export default function Avatar({ name, size = 32, className = '' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        backgroundColor: colorForName(name),
      }}
    >
      {name?.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}
