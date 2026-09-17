// Modale de détail d'une session — utilisée par le dashboard et par
// "Mes sessions" ; extraite pour éviter de dupliquer le markup entre les deux.
export default function SessionDetailModal({ session, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-medi-petrol/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-pop-in w-full max-w-2xl rounded-2xl border-2 border-medi-border bg-medi-surface p-6 shadow-[0_24px_60px_rgba(22,50,62,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-extrabold text-medi-petrol">Détail session {session?.accessCode}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-medi-border/60 px-3 py-1 text-sm font-semibold text-medi-petrol/70 transition hover:bg-medi-border"
          >
            Fermer
          </button>
        </div>
        <p className="mt-2 text-sm text-medi-petrol/70">Quiz : {session?.quiz?.title} — Statut : {session?.status}</p>
        <div className="mt-4">
          <h4 className="font-bold text-medi-petrol">Participants ({session?.playerCount ?? session?.participants?.length ?? 0})</h4>
          <ul className="mt-2 max-h-56 space-y-2 overflow-auto">
            {session?.participants?.map((p, idx) => (
              <li
                key={p.socketId || `${p.displayName}-${idx}`}
                className="flex items-center justify-between rounded-xl bg-white px-3 py-2"
              >
                <span>
                  <span className="block font-medium text-medi-petrol">{p.displayName}</span>
                  {p.bergerName && <span className="block text-xs text-medi-petrol/50">{p.bergerName}</span>}
                </span>
                <span className="text-sm font-bold text-medi-green-deep">{p.totalScore} pts</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
