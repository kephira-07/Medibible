const AVATAR_COLORS = ['#2D5A4C', '#3D8B7A', '#D4AF37', '#E5A93C', '#1D3B48']

// Couleur déterministe : le même prénom donne toujours le même avatar
function colorForName(name) {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function initialFrom(name) {
  return name?.trim().charAt(0).toUpperCase() || '?'
}

export default function AvatarBubble({ name, isSpeaking, isMuted, size = 56 }) {
  const color = colorForName(name || '')

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`relative flex items-center justify-center rounded-full font-bold text-white transition-transform duration-200 ${isSpeaking ? 'scale-110' : ''}`}
        style={{ width: size, height: size, backgroundColor: color }}
      >
        {isSpeaking && (
          <span
            className="animate-speaking-ring absolute inset-0 rounded-full"
            style={{ boxShadow: `0 0 0 4px ${color}` }}
          />
        )}
        <span style={{ fontSize: size * 0.4 }}>{initialFrom(name)}</span>
        {isMuted && (
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-medi-petrol text-[10px]">
            🔇
          </span>
        )}
      </div>
      <span className="max-w-16 truncate text-xs text-medi-petrol/70">{name}</span>
    </div>
  )
}
