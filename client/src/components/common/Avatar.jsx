import { getAvatar } from '../../utils/avatars.js'

const COLORS = ['#C1613C', '#8B6F4E', '#D9924A', '#4C8B3E', '#006414']

function colorForName(name) {
  let hash = 0
  const str = name || ''
  for (let i = 0; i < str.length; i += 1) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

// Pastille ronde : le pictogramme choisi à l'inscription s'il existe, sinon
// l'initiale du prénom sur une couleur stable (animateur, anciens joueurs).
export default function Avatar({ name, avatar, size = 32, className = '' }) {
  const found = getAvatar(avatar)
  const Icon = found?.Icon
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        backgroundColor: found ? found.color : colorForName(name),
      }}
    >
      {Icon ? <Icon style={{ width: size * 0.48, height: size * 0.48 }} /> : name?.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}
