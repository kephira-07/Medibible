const URGENT_THRESHOLD_S = 5

export default function CountdownRing({ remainingMs, totalMs }) {
  const size = 96
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0
  const offset = circumference * (1 - ratio)
  const seconds = Math.ceil(remainingMs / 1000)
  const urgent = seconds <= URGENT_THRESHOLD_S && seconds > 0
  const ringColor = urgent ? '#FF6B5B' : '#F4B400'

  return (
    <div
      className={`relative ${urgent ? 'animate-pulse-urgent' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#163445"
          strokeOpacity="0.1"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.2s linear, stroke 0.3s ease' }}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center text-xl font-bold ${urgent ? 'text-medi-coral' : 'text-medi-petrol'}`}
      >
        {seconds}
      </span>
    </div>
  )
}
