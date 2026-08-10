const MEDALS = ['🥇', '🥈', '🥉']

export default function ScoreBoard({ leaderboard, title = 'Classement' }) {
  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
      <h3 className="mb-4 text-lg font-bold text-medi-petrol">{title}</h3>
      <ol className="flex flex-col gap-2">
        {leaderboard.map((p, i) => (
          <li
            key={p.displayName}
            className={`animate-fade-in-up flex items-center justify-between rounded-xl px-4 py-2.5 ${
              i === 0
                ? 'bg-linear-to-r from-medi-gold/25 to-medi-gold-light/15 shadow-sm'
                : 'bg-medi-cream'
            }`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="flex items-center gap-2 font-semibold text-medi-petrol">
              <span className="w-6 text-center text-lg">{MEDALS[i] || `#${i + 1}`}</span>
              {p.displayName}
            </span>
            <span className="font-bold text-medi-green-deep">{p.totalScore} pts</span>
          </li>
        ))}
        {leaderboard.length === 0 && (
          <li className="text-center text-sm text-medi-petrol/50">Aucun participant pour le moment</li>
        )}
      </ol>
    </div>
  )
}
