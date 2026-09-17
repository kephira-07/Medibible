import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api.js'
import Button from '../../components/common/Button.jsx'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import {
  FaUserFriends,
  FaSatelliteDish,
  FaBookOpen,
  FaCrown,
  FaMedal,
} from 'react-icons/fa'

// Quelques versets bien connus — un seul est affiché, choisi de façon stable
// pour la journée (pas de fabrication de contenu biblique inventé).
const VERSES = [
  { text: 'Ta parole est une lampe à mes pieds, une lumière sur mon sentier.', ref: 'Psaume 119:105' },
  { text: 'Je puis tout par celui qui me fortifie.', ref: 'Philippiens 4:13' },
  { text: "L'Éternel est mon berger : je ne manquerai de rien.", ref: 'Psaume 23:1' },
  { text: 'Que tout ce que vous faites se fasse avec amour.', ref: '1 Corinthiens 16:14' },
  { text: 'Approchez-vous de Dieu, et il s’approchera de vous.', ref: 'Jacques 4:8' },
  { text: 'Réjouissez-vous toujours dans le Seigneur.', ref: 'Philippiens 4:4' },
  { text: 'Confie-toi en l’Éternel de tout ton cœur.', ref: 'Proverbes 3:5' },
]

function verseOfTheDay() {
  const dayIndex = Math.floor(Date.now() / 86400000)
  return VERSES[dayIndex % VERSES.length]
}

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

export default function AdminDashboard() {
  const [quizzes, setQuizzes] = useState([])
  const [error, setError] = useState(null)
  const [showAllOnline, setShowAllOnline] = useState(false)
  const [showAllRanking, setShowAllRanking] = useState(false)
  const [showAllBergers, setShowAllBergers] = useState(false)

  const [online, setOnline] = useState([])
  const [allSessions, setAllSessions] = useState([])
  const [winners, setWinners] = useState([])

  const verse = useMemo(verseOfTheDay, [])
  const today = useMemo(
    () => new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    []
  )

  async function loadAdmin() {
    try {
      const [onlineRes, sessionsRes, winnersRes] = await Promise.all([
        api.get('/sessions/admin/online'),
        api.get('/sessions'),
        api.get('/sessions/admin/winners'),
      ])

      setOnline(onlineRes.data || [])
      setAllSessions(Array.isArray(sessionsRes.data) ? sessionsRes.data : [])
      setWinners(winnersRes.data || [])
    } catch (err) {
      setError((prev) => prev || (err.response?.data?.message || 'Impossible de charger les données admin.'))
    }
  }

  useEffect(() => {
    loadAdmin()
    const id = setInterval(loadAdmin, 8000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    api
      .get('/quizzes')
      .then(({ data }) => setQuizzes(data))
      .catch((err) => setError(err.response?.data?.message || 'Impossible de charger les quiz.'))
  }, [])

  const sessionsActiveCount = useMemo(
    () => allSessions.filter((s) => ['live', 'lobby'].includes(s.status)).length,
    [allSessions]
  )

  const stats = useMemo(
    () => [
      { label: 'Frères & sœurs connectés', value: online.length, accent: 'bg-medi-green-deep', icon: FaUserFriends },
      { label: 'Sessions actives', value: sessionsActiveCount, accent: 'bg-medi-gold', icon: FaSatelliteDish },
      { label: 'Quiz publiés', value: quizzes.length, accent: 'bg-medi-sky', icon: FaBookOpen },
      { label: 'Gagnants récents', value: winners.length, accent: 'bg-medi-coral', icon: FaCrown },
    ],
    [quizzes.length, online.length, sessionsActiveCount, winners.length]
  )

  const podium = useMemo(
    () =>
      online
        .slice()
        .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0))
        .slice(0, 3),
    [online]
  )

  const ranking = useMemo(
    () =>
      online
        .slice()
        .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0))
        .slice(3),
    [online]
  )

  // Classement des bergers : cumul des points de tous leurs joueurs, toutes
  // sessions confondues (pas seulement ceux en ligne maintenant) — reflète
  // qui, parmi les groupes de maison, s'est le plus investi dans la durée.
  const bergerRanking = useMemo(() => {
    const byBerger = new Map()
    for (const session of allSessions) {
      for (const p of session.participants || []) {
        const berger = p.bergerName?.trim()
        if (!berger) continue
        const entry = byBerger.get(berger) || { bergerName: berger, totalScore: 0, players: new Set() }
        entry.totalScore += p.totalScore || 0
        entry.players.add(p.displayName)
        byBerger.set(berger, entry)
      }
    }
    return Array.from(byBerger.values())
      .map((e) => ({ bergerName: e.bergerName, totalScore: e.totalScore, playerCount: e.players.size }))
      .sort((a, b) => b.totalScore - a.totalScore)
  }, [allSessions])

  const visibleOnline = showAllOnline ? online : online.slice(0, 6)
  const visibleRanking = showAllRanking ? ranking : ranking.slice(0, 5)
  const visibleBergers = showAllBergers ? bergerRanking : bergerRanking.slice(0, 5)

  return (
    <AdminLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        {/* HERO */}
        <section className="flex flex-col gap-4 rounded-2xl border-2 border-medi-border bg-white p-6 shadow-[0_18px_40px_rgba(22,50,62,0.06)] sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-medi-gold/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-medi-petrol">
              Session de Grâce &amp; Partage
            </span>
            <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-medi-petrol/45">{today}</p>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-medi-petrol sm:text-3xl">Tableau de bord Animateur</h1>
            <p className="mt-2 max-w-xl text-sm text-medi-petrol/65">
              Supervise les sessions en direct, anime ta communauté et gère tes questionnaires bibliques, tout depuis un seul endroit.
            </p>
          </div>
          <Link to="/admin/quizzes/new" className="shrink-0">
            <Button variant="primary" className="w-full text-base sm:w-auto">+ Nouveau quiz</Button>
          </Link>
        </section>

        {error && (
          <p className="rounded-xl border-2 border-medi-coral/30 bg-medi-coral/10 px-4 py-2 text-sm font-semibold text-medi-coral">
            {error}
          </p>
        )}

        {/* STATS */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="relative overflow-hidden rounded-xl border-2 border-medi-border bg-white p-5 shadow-[0_16px_36px_rgba(22,50,62,0.05)]">
                <div className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-white ${stat.accent}`}>
                  <Icon />
                </div>
                <div className={`mb-4 h-2.5 w-14 rounded-full ${stat.accent}`} />
                <p className="text-3xl font-extrabold tracking-tight text-medi-petrol">{stat.value}</p>
                <p className="mt-2 text-sm text-medi-petrol/60">{stat.label}</p>
              </div>
            )
          })}
        </section>

        {/* UTILISATEURS CONNECTÉS / CLASSEMENTS / RACCOURCIS */}
        <section className="grid items-start gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border-2 border-medi-border bg-white p-5 shadow-[0_18px_40px_rgba(22,50,62,0.05)] sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-medi-petrol">Utilisateurs connectés</h2>
                <span className="rounded-full bg-medi-green-deep/8 px-2.5 py-1 text-xs font-semibold text-medi-green-deep">
                  {online.length} en ligne
                </span>
              </div>

              <div className="space-y-3">
                {visibleOnline.map((u) => (
                  <div
                    key={`${u.displayName}-${u.sessionId || u.socketId}`}
                    className="flex items-center gap-3 rounded-lg border-2 border-medi-border bg-medi-cream/50 p-3"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: colorForName(u.displayName) }}
                    >
                      {initialFrom(u.displayName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-medi-petrol">{u.displayName}</p>
                      <p className="truncate text-xs text-medi-petrol/55">{u.bergerName || u.accessCode || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-medi-petrol">{u.totalScore ?? 0} pts</p>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-600">En ligne</p>
                    </div>
                  </div>
                ))}
                {online.length === 0 && (
                  <p className="py-6 text-center text-sm text-medi-petrol/50">Aucun frère ou sœur connecté pour le moment.</p>
                )}
              </div>

              {online.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllOnline((v) => !v)}
                  className="mt-4 w-full rounded-2xl border-2 border-medi-border py-2.5 text-sm font-bold text-medi-petrol/70 transition hover:bg-medi-cream"
                >
                  {showAllOnline ? 'Réduire la liste' : 'Voir les autres frères et sœurs'}
                </button>
              )}
            </div>

            <div className="rounded-2xl border-2 border-medi-border bg-white p-5 shadow-[0_18px_40px_rgba(22,50,62,0.05)] sm:p-6">
              <h2 className="mb-6 text-lg font-bold text-medi-petrol">Classement général</h2>

              {podium.length > 0 ? (
                <div className="mb-6 flex items-end justify-center gap-3">
                  {[podium[1], podium[0], podium[2]].map((p, slot) => {
                    if (!p) return <div key={slot} className="w-24" />
                    const isFirst = slot === 1
                    const height = isFirst ? 'h-28' : slot === 0 ? 'h-20' : 'h-14'
                    const ring = isFirst ? 'ring-medi-gold' : slot === 0 ? 'ring-slate-300' : 'ring-medi-coral/60'
                    const medal = isFirst ? '🥇' : slot === 0 ? '🥈' : '🥉'
                    return (
                      <div key={p.socketId || p.displayName} className="flex w-24 flex-col items-center gap-2">
                        <span className="text-2xl">{medal}</span>
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-white ring-4 ${ring}`}
                          style={{ backgroundColor: colorForName(p.displayName) }}
                        >
                          {initialFrom(p.displayName)}
                        </div>
                        <p className="max-w-full truncate text-sm font-bold text-medi-petrol">{p.displayName}</p>
                        <p className="text-xs font-semibold text-medi-gold">{p.totalScore ?? 0} pts</p>
                        <div className={`w-full rounded-t-xl bg-gradient-to-b from-medi-gold-light/60 to-medi-gold/20 ${height}`} />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="mb-6 text-center text-sm text-medi-petrol/50">Aucun joueur connecté pour le moment.</p>
              )}

              <div className="space-y-2.5">
                {visibleRanking.map((entry, index) => (
                  <div key={entry.socketId || `${entry.displayName}-${index}`} className="flex items-center justify-between rounded-lg border-2 border-medi-border bg-medi-cream/50 p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-medi-green-deep/8 font-bold text-medi-petrol">
                        #{index + 4}
                      </span>
                      <span className="font-semibold text-medi-petrol">{entry.displayName}</span>
                    </div>
                    <span className="text-sm font-bold text-medi-gold">{entry.totalScore ?? 0} pts</span>
                  </div>
                ))}
              </div>

              {ranking.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllRanking((v) => !v)}
                  className="mt-4 w-full rounded-2xl border-2 border-medi-border py-2.5 text-sm font-bold text-medi-petrol/70 transition hover:bg-medi-cream"
                >
                  {showAllRanking ? 'Réduire la liste' : 'Lire la suite'}
                </button>
              )}
            </div>

            <div className="rounded-2xl border-2 border-medi-border bg-white p-5 shadow-[0_18px_40px_rgba(22,50,62,0.05)] sm:p-6">
              <h2 className="text-lg font-bold text-medi-petrol">Classement des bergers</h2>
              <p className="mt-1 text-sm text-medi-petrol/55">
                Les groupes de maison dont les joueurs ont cumulé le plus de points, toutes sessions confondues.
              </p>

              <div className="mt-4 space-y-2.5">
                {visibleBergers.map((b, index) => (
                  <div key={b.bergerName} className="flex items-center justify-between rounded-lg border-2 border-medi-border bg-medi-cream/50 p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-medi-green-deep/8 text-sm font-bold text-medi-petrol">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>
                      <div>
                        <p className="font-semibold text-medi-petrol">{b.bergerName}</p>
                        <p className="text-xs text-medi-petrol/50">{b.playerCount} joueur{b.playerCount > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-medi-gold">{b.totalScore} pts</span>
                  </div>
                ))}
                {bergerRanking.length === 0 && (
                  <p className="py-4 text-center text-sm text-medi-petrol/50">Aucune donnée pour le moment.</p>
                )}
              </div>

              {bergerRanking.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllBergers((v) => !v)}
                  className="mt-4 w-full rounded-2xl border-2 border-medi-border py-2.5 text-sm font-bold text-medi-petrol/70 transition hover:bg-medi-cream"
                >
                  {showAllBergers ? 'Réduire la liste' : 'Lire la suite'}
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <Link
              to="/admin/sessions"
              className="flex items-center justify-between gap-3 rounded-2xl border-2 border-medi-border bg-white p-5 transition hover:border-medi-green-sage sm:p-6"
            >
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-medi-petrol">
                  Mes sessions
                  <span className="flex items-center gap-1.5 rounded-full bg-medi-coral/10 px-2 py-0.5 text-[10px] font-bold uppercase text-medi-coral">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-medi-coral" /> Live
                  </span>
                </h2>
                <p className="mt-1 text-sm text-medi-petrol/55">{sessionsActiveCount} session(s) en attente ou en cours.</p>
              </div>
              <FaSatelliteDish className="shrink-0 text-2xl text-medi-gold" />
            </Link>

            <Link
              to="/admin/quizzes"
              className="flex items-center justify-between gap-3 rounded-2xl border-2 border-medi-border bg-white p-5 transition hover:border-medi-green-sage sm:p-6"
            >
              <div>
                <h2 className="text-lg font-bold text-medi-petrol">Mes quiz</h2>
                <p className="mt-1 text-sm text-medi-petrol/55">{quizzes.length} quiz créé{quizzes.length > 1 ? 's' : ''} — modifier, lancer, rechercher.</p>
              </div>
              <FaBookOpen className="shrink-0 text-2xl text-medi-sky" />
            </Link>

            <div className="rounded-2xl border-2 border-medi-gold/30 bg-medi-gold/8 p-5 sm:p-6">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-medi-gold">
                <FaMedal /> Verset du jour
              </p>
              <p className="mt-2 text-sm italic text-medi-petrol/80">« {verse.text} »</p>
              <p className="mt-1 text-xs font-semibold text-medi-petrol/50">{verse.ref}</p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="flex flex-col items-center gap-1 py-4 text-center text-xs text-medi-petrol/40">
          <p>MediBible &copy; {new Date().getFullYear()} — Communauté chrétienne</p>
          <p>Besoin d'aide ? Contacte le support de ta communauté.</p>
        </footer>
      </div>
    </AdminLayout>
  )
}
