import { useMemo } from 'react'
import { FaTrophy } from 'react-icons/fa'
import Avatar from '../common/Avatar.jsx'

const MEDALS = ['🥇', '🥈', '🥉']

// Modale de détail d'une session — utilisée par le dashboard et par
// "Mes sessions" ; extraite pour éviter de dupliquer le markup entre les deux.
// Donne une vue complète : vainqueur, classement des joueurs, et classement
// des bergers (pour repérer le groupe de maison le plus investi et celui
// dont un membre a remporté la session).
export default function SessionDetailModal({ session, onClose }) {
  const rankedParticipants = useMemo(
    () => [...(session?.participants || [])].sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0)),
    [session]
  )

  const winner = session?.winner || rankedParticipants[0] || null

  const bergerRanking = useMemo(() => {
    const byBerger = new Map()
    for (const p of session?.participants || []) {
      const berger = p.bergerName?.trim()
      if (!berger) continue
      const entry = byBerger.get(berger) || { bergerName: berger, totalScore: 0, players: new Set() }
      entry.totalScore += p.totalScore || 0
      entry.players.add(p.displayName)
      byBerger.set(berger, entry)
    }
    return Array.from(byBerger.values())
      .map((e) => ({ bergerName: e.bergerName, totalScore: e.totalScore, playerCount: e.players.size }))
      .sort((a, b) => b.totalScore - a.totalScore)
  }, [session])

  const maxBergerScore = bergerRanking[0]?.totalScore || 0
  const winningBerger = winner?.bergerName?.trim() || null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-medi-petrol/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-pop-in flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border-2 border-medi-border bg-medi-surface shadow-[0_24px_60px_rgba(22,50,62,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-6 pb-0">
          <div>
            <h3 className="text-lg font-extrabold text-medi-petrol">Détail session {session?.accessCode}</h3>
            <p className="mt-1 text-sm text-medi-petrol/70">
              Quiz : {session?.quiz?.title} — Statut : {session?.status}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full bg-medi-border/60 px-3 py-1 text-sm font-semibold text-medi-petrol/70 transition hover:bg-medi-border"
          >
            Fermer
          </button>
        </div>

        <div className="mt-4 flex-1 space-y-5 overflow-y-auto px-6 pb-6">
          {/* VAINQUEUR */}
          {winner && (
            <div className="flex items-center gap-3 rounded-2xl border-2 border-medi-gold/50 bg-medi-gold/10 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-medi-gold/25 text-xl text-medi-gold">
                <FaTrophy />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-medi-gold">Vainqueur de la session</p>
                <p className="truncate font-extrabold text-medi-petrol">{winner.displayName}</p>
                {winner.bergerName && (
                  <p className="text-xs text-medi-petrol/55">Berger : {winner.bergerName}</p>
                )}
              </div>
              <span className="shrink-0 text-lg font-extrabold text-medi-gold">{winner.totalScore ?? 0} pts</span>
            </div>
          )}

          {/* CLASSEMENT DES BERGERS DE CETTE SESSION */}
          {bergerRanking.length > 0 && (
            <div>
              <h4 className="font-bold text-medi-petrol">Classement des bergers</h4>
              <p className="mt-0.5 text-xs text-medi-petrol/50">
                Cumul des points de leurs enfants pour cette session — repère le groupe le plus investi.
              </p>
              <div className="mt-3 space-y-2">
                {bergerRanking.map((b, index) => {
                  const isLeader = index === 0
                  const hasWinner = winningBerger === b.bergerName
                  const relativePct = maxBergerScore > 0 ? Math.max(6, Math.round((b.totalScore / maxBergerScore) * 100)) : 0
                  return (
                    <div
                      key={b.bergerName}
                      className={`rounded-xl border-2 p-3 ${
                        isLeader ? 'border-medi-gold/50 bg-medi-gold/8' : 'border-medi-border bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                              isLeader ? 'bg-medi-gold/25 text-medi-petrol' : 'bg-medi-green-deep/8 text-medi-petrol'
                            }`}
                          >
                            {index < 3 ? MEDALS[index] : `#${index + 1}`}
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                              <p className="max-w-full truncate font-bold text-medi-petrol">{b.bergerName}</p>
                              {hasWinner && (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-medi-coral/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-medi-coral">
                                  <FaTrophy className="text-[9px]" /> a le vainqueur
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-medi-petrol/50">
                              {b.playerCount} enfant{b.playerCount > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <span className={`shrink-0 text-sm font-extrabold ${isLeader ? 'text-medi-gold' : 'text-medi-petrol'}`}>
                          {b.totalScore} pts
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-medi-cream">
                        <div
                          className={`h-full rounded-full ${isLeader ? 'bg-medi-gold' : 'bg-medi-green-sage'}`}
                          style={{ width: `${relativePct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* CLASSEMENT DES JOUEURS */}
          <div>
            <h4 className="font-bold text-medi-petrol">
              Participants ({session?.playerCount ?? session?.participants?.length ?? 0})
            </h4>
            <ul className="mt-2 space-y-2">
              {rankedParticipants.map((p, idx) => {
                const isWinner = winner && p.displayName === winner.displayName && p.totalScore === winner.totalScore
                return (
                  <li
                    key={p.socketId || `${p.displayName}-${idx}`}
                    className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2 ${
                      isWinner ? 'border-medi-gold/50 bg-medi-gold/8' : 'border-transparent bg-white'
                    }`}
                  >
                    <Avatar name={p.displayName} size={32} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate font-medium text-medi-petrol">{p.displayName}</span>
                        {idx < 3 && <span>{MEDALS[idx]}</span>}
                      </span>
                      {p.bergerName && <span className="block text-xs text-medi-petrol/50">{p.bergerName}</span>}
                    </span>
                    <span className="shrink-0 text-sm font-bold text-medi-green-deep">{p.totalScore ?? 0} pts</span>
                  </li>
                )
              })}
              {rankedParticipants.length === 0 && (
                <p className="py-4 text-center text-sm text-medi-petrol/50">Aucun participant pour le moment.</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
