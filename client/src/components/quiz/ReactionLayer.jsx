import Avatar from '../common/Avatar.jsx'
import { getReactionEmoji } from '../../utils/reactions.js'

// Les réactions reçues descendentnt le long du bord droit puis disparaissent,
// avec le prénom de la personne — ne bloque jamais les clics (pointer-events).
export default function ReactionLayer({ reactions }) {
  return (
    <div className="pointer-events-none fixed inset-y-0 right-3 z-30 flex w-64 max-w-[85vw] flex-col justify-start gap-2 overflow-hidden pt-[8.5rem]">
      {reactions.map((r) => (
        <div key={r.id} className="animate-reaction-fall flex items-center justify-end gap-2">
          <span className="flex min-w-0 items-center gap-1.5 rounded-full bg-white/95 py-1 pl-1 pr-3 text-sm font-bold text-medi-petrol shadow-md">
            <Avatar name={r.displayName} size={22} />
            <span className="break-words leading-tight">{r.displayName}</span>
          </span>
          <span className="text-3xl drop-shadow">{getReactionEmoji(r.reaction)}</span>
        </div>
      ))}
    </div>
  )
}
