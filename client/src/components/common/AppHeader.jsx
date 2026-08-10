import { Link } from 'react-router-dom'
import BrandMark from './BrandMark.jsx'

// En-tête commun à toutes les pages : sert de repère constant (le logo
// ramène toujours à l'accueil) et accueille les actions propres à chaque
// page (déconnexion, liens de navigation…) dans le slot `right`.
export default function AppHeader({ right }) {
  return (
    <header className="flex w-full items-center justify-between py-4">
      <Link to="/" className="flex items-center gap-2">
        <BrandMark className="h-8 w-8" />
        <span className="text-lg font-bold text-medi-petrol">MediBible</span>
      </Link>
      {right && <div className="flex items-center gap-4">{right}</div>}
    </header>
  )
}
