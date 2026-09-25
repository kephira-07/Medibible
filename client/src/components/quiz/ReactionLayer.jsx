import Avatar from '../common/Avatar.jsx'
import { getReactionEmoji } from '../../utils/reactions.js'

// Les réactions reçues montent le long du bord droit puis disparaissent,
// avec le prénom de la personne — ne bloque jamais les clics (pointer-events).
export default function ReactionLayer({ reactions }) {
  return (
    <div className="pointer-events-none fixed inset-y-0 right-3 z-30 flex w-36 flex-col justify-end gap-2 overflow-hidden pb-24">
      {reactions.map((r) => (
        <div key={r.id} className="animate-reaction-rise flex items-center justify-end gap-2">
          <span className="flex max-w-[6.5rem] items-center gap-1.5 truncate rounded-full bg-white/95 py-1 pl-1 pr-2.5 text-xs font-bold text-medi-petrol shadow-md">
            <Avatar name={r.displayName} avatar={r.avatar} size={22} />
            <span className="truncate">{r.displayName}</span>
          </span>
          <span className="text-3xl drop-shadow">{getReactionEmoji(r.reaction)}</span>
        </div>
      ))}
    </div>
  )
}
