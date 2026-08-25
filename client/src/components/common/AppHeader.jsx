import { Link } from 'react-router-dom'
import BrandMark from './BrandMark.jsx'

// En-tête commun à toutes les pages : sert de repère constant (le logo
// ramène toujours à l'accueil) et accueille les actions propres à chaque
// page (déconnexion, liens de navigation…) dans le slot `right`.
export default function AppHeader({ right }) {
  return (
    <header className="flex w-full items-center justify-between rounded-full border border-[#d9d1c2] bg-[#f6f1e8]/90 px-4 py-3 shadow-[0_8px_22px_rgba(29,43,50,0.05)] backdrop-blur-sm">
      <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
        <BrandMark className="h-8 w-8" />
        <span className="text-lg font-bold tracking-[0.08em] text-medi-petrol uppercase">MediBible</span>
      </Link>
      {right && <div className="flex items-center gap-4">{right}</div>}
    </header>
  )
}
