import Avatar from '../common/Avatar.jsx'

const MEDALS = ['🥇', '🥈', '🥉']

export default function ScoreBoard({ leaderboard, title = 'Classement' }) {
  return (
    <div className="w-full max-w-md rounded-xl border-2 border-medi-border bg-medi-surface/95 p-6 shadow-[0_18px_38px_rgba(22,50,62,0.1)]">
      <h3 className="mb-4 text-lg font-extrabold text-medi-petrol">{title}</h3>
      <ol className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
        {leaderboard.map((p, i) => (
          <li
            key={p.displayName}
            className={`animate-fade-in-up flex items-center justify-between rounded-xl px-4 py-2.5 ${
              i === 0
                ? 'bg-gradient-to-r from-medi-gold-light/50 to-medi-gold/10 shadow-sm ring-2 ring-medi-gold/40'
                : i === 1
                ? 'bg-medi-sky/8'
                : i === 2
                ? 'bg-medi-coral/8'
                : 'bg-white'
            }`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="flex items-center gap-2 font-bold text-medi-petrol">
              <span className="w-6 text-center text-lg">{MEDALS[i] || `#${i + 1}`}</span>
              <Avatar name={p.displayName} size={28} />
              {p.displayName}
            </span>
            <span className="font-extrabold text-medi-green-deep">{p.totalScore} pts</span>
          </li>
        ))}
        {leaderboard.length === 0 && (
          <li className="text-center text-sm text-medi-petrol/50">Aucun participant pour le moment</li>
        )}
      </ol>
    </div>
  )
}
