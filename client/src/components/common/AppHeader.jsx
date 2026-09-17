import { Link } from 'react-router-dom'
import BrandMark from './BrandMark.jsx'

// En-tête commun à toutes les pages : sert de repère constant (le logo
// ramène toujours à l'accueil) et accueille les actions propres à chaque
// page (déconnexion, liens de navigation…) dans le slot `right`.
// `onBrandClick` permet à une page sensible (partie en direct) d'intercepter
// le clic sur le logo pour demander confirmation avant de quitter, plutôt que
// de naviguer immédiatement — évite qu'une fausse manip ne sorte un joueur
// de sa session.
export default function AppHeader({ right, onBrandClick }) {
  const handleBrandClick = (e) => {
    if (!onBrandClick) return
    e.preventDefault()
    onBrandClick()
  }

  return (
    <header className="flex w-full items-center justify-between rounded-full border-2 border-medi-border bg-white/90 px-4 py-2.5 shadow-[0_10px_24px_rgba(22,50,62,0.06)] backdrop-blur-sm">
      <Link to="/" onClick={handleBrandClick} className="flex items-center gap-2 transition-transform hover:scale-105">
        <BrandMark className="h-9 w-9" />
        <span className="text-base font-extrabold tracking-widest text-medi-petrol uppercase">MediBible</span>
      </Link>
      {right && <div className="flex items-center gap-4">{right}</div>}
    </header>
  )
}
