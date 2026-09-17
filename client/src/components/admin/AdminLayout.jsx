import { Link, useLocation, useNavigate } from 'react-router-dom'
import BrandMark from '../common/BrandMark.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  HiOutlineViewGrid,
  HiOutlineBookOpen,
  HiOutlineStatusOnline,
  HiOutlineClock,
  HiOutlineLogout,
} from 'react-icons/hi'

function initialFrom(name) {
  return name?.trim().charAt(0).toUpperCase() || '?'
}

const AVATAR_COLORS = ['#C1613C', '#8B6F4E', '#D9924A', '#4C8B3E', '#006414']
function colorForName(name) {
  let hash = 0
  const str = name || ''
  for (let i = 0; i < str.length; i += 1) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// Chaque item pointe soit vers une ancre du tableau de bord (#section),
// soit vers une page dédiée (ex: /admin/history) — les deux cohabitent tant
// que le back-office n'a pas assez de pages pour justifier de tout séparer.
const NAV_ITEMS = [
  { key: 'dashboard', to: '/admin', icon: HiOutlineViewGrid, label: 'Tableau de bord' },
  { key: 'quiz', to: '/admin#quiz-management', icon: HiOutlineBookOpen, label: 'Gestion des quiz' },
  { key: 'live', to: '/admin#live-sessions', icon: HiOutlineStatusOnline, label: 'Sessions en direct' },
  { key: 'history', to: '/admin/history', icon: HiOutlineClock, label: 'Historique' },
]

function isActive(item, pathname) {
  if (item.to.includes('#')) return pathname === '/admin' && item.key === 'dashboard'
  return pathname === item.to
}

// Layout partagé du back-office : sidebar fixe à gauche sur grand écran,
// en-tête + barre de navigation basse (boutons) sur mobile — remplace
// l'ancienne nav en pilules qui débordait sur petit écran.
export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-svh bg-medi-cream text-medi-petrol lg:flex">
      {/* SIDEBAR — grand écran */}
      <aside className="hidden w-64 shrink-0 flex-col border-r-2 border-medi-border bg-white px-4 py-6 lg:flex">
        <Link to="/" className="mb-8 flex items-center gap-2 px-2">
          <BrandMark className="h-9 w-9" />
          <span className="text-base font-extrabold uppercase tracking-widest text-medi-petrol">MediBible</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isActive(item, pathname)
            return (
              <a
                key={item.key}
                href={item.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? 'bg-medi-green-deep text-white'
                    : 'text-medi-petrol/65 hover:bg-medi-green-deep/8 hover:text-medi-petrol'
                }`}
              >
                <Icon className="text-lg" />
                {item.label}
              </a>
            )
          })}
        </nav>

        <div className="flex items-center gap-3 border-t-2 border-medi-border pt-4">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: colorForName(user?.name) }}
          >
            {initialFrom(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-medi-petrol">{user?.name || 'Animateur'}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs font-semibold text-medi-coral hover:underline"
            >
              <HiOutlineLogout /> Déconnexion
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-svh flex-1 flex-col">
        {/* EN-TÊTE — mobile */}
        <header className="flex items-center justify-between gap-3 border-b-2 border-medi-border bg-white px-4 py-3 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <BrandMark className="h-8 w-8" />
            <span className="text-sm font-extrabold uppercase tracking-widest text-medi-petrol">MediBible</span>
          </Link>
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: colorForName(user?.name) }}
            >
              {initialFrom(user?.name)}
            </div>
            <button type="button" onClick={handleLogout} className="text-xs font-bold text-medi-coral">
              <HiOutlineLogout className="text-lg" />
            </button>
          </div>
        </header>

        <main className="flex-1 pb-20 lg:pb-0">{children}</main>

        {/* BARRE DE NAVIGATION BASSE — mobile */}
        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t-2 border-medi-border bg-white shadow-[0_-8px_24px_rgba(22,50,62,0.08)] lg:hidden">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isActive(item, pathname)
            return (
              <a
                key={item.key}
                href={item.to}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition ${
                  active ? 'text-medi-green-deep' : 'text-medi-petrol/50'
                }`}
              >
                <Icon className="text-xl" />
                <span className="truncate px-1">{item.label}</span>
              </a>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
