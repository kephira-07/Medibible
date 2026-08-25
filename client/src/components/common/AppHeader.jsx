import { Link } from 'react-router-dom'
import BrandMark from './BrandMark.jsx'

// En-tête commun à toutes les pages : sert de repère constant (le logo
// ramène toujours à l'accueil) et accueille les actions propres à chaque
// page (déconnexion, liens de navigation…) dans le slot `right`.
export default function AppHeader({ right }) {
  return (
    <header className="flex w-full items-center justify-between rounded-full border border-[#d8cdb3] bg-[#f9f4eb]/90 px-4 py-3 shadow-[0_10px_24px_rgba(26,43,50,0.05)] backdrop-blur-sm">
      <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
        <BrandMark className="h-8 w-8" />
        <span className="text-base font-bold tracking-[0.12em] text-medi-petrol uppercase">MediBible</span>
      </Link>
      {right && <div className="flex items-center gap-4">{right}</div>}
    </header>
  )
}
