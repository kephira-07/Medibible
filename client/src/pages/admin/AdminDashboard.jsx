import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import Button from '../../components/common/Button.jsx'
import BrandMark from '../../components/common/BrandMark.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  FaUserFriends,
  FaSatelliteDish,
  FaBookOpen,
  FaCrown,
  FaTrophy,
  FaSearch,
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

const NAV_SECTIONS = [
  { id: 'dashboard-top', label: 'Tableau de bord' },
  { id: 'quiz-management', label: 'Gestion des quiz' },
  { id: 'live-sessions', label: 'Sessions en direct' },
]

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [launchingId, setLaunchingId] = useState(null)
  const [quizSearch, setQuizSearch] = useState('')
  const [showAllOnline, setShowAllOnline] = useState(false)

  const [online, setOnline] = useState([])
  const [sessionsActive, setSessionsActive] = useState([])
  const [winners, setWinners] = useState([])
  const [sessionDetail, setSessionDetail] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

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
      setSessionsActive(Array.isArray(sessionsRes.data) ? sessionsRes.data.filter((s) => ['live', 'lobby'].includes(s.status)) : [])
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

  const openSessionDetail = async (sessionId) => {
    try {
      const { data } = await api.get(`/sessions/admin/${sessionId}`)
      setSessionDetail(data)
      setDetailOpen(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger le détail de la session.')
    }
  }

  const closeSessionDetail = useCallback(() => {
    setDetailOpen(false)
    setSessionDetail(null)
  }, [])

  useEffect(() => {
    if (!detailOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeSessionDetail()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [detailOpen, closeSessionDetail])

  const stats = useMemo(
    () => [
      { label: 'Frères & sœurs connectés', value: online.length, accent: 'bg-medi-green-deep', icon: FaUserFriends },
      { label: 'Sessions actives', value: sessionsActive.length, accent: 'bg-medi-gold', icon: FaSatelliteDish },
      { label: 'Quiz publiés', value: quizzes.length, accent: 'bg-medi-sky', icon: FaBookOpen },
      { label: 'Gagnants récents', value: winners.length, accent: 'bg-medi-coral', icon: FaCrown },
    ],
    [quizzes.length, online.length, sessionsActive.length, winners.length]
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

  const filteredQuizzes = useMemo(() => {
    const q = quizSearch.trim().toLowerCase()
    if (!q) return quizzes
    return quizzes.filter((quiz) => quiz.title?.toLowerCase().includes(q))
  }, [quizzes, quizSearch])

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce quiz définitivement ?')) return
    setDeletingId(id)
    try {
      await api.delete(`/quizzes/${id}`)
      setQuizzes((prev) => prev.filter((q) => q._id !== id))
    } catch (err) {
      setError(err.response?.data?.message || 'Suppression impossible.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleLaunch = async (quizId) => {
    setLaunchingId(quizId)
    try {
      const { data } = await api.post('/sessions', { quizId })
      navigate(`/session/${data.accessCode}`, { state: { displayName: user?.name || 'Animateur' } })
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de créer la session.')
      setLaunchingId(null)
    }
  }

  const visibleOnline = showAllOnline ? online : online.slice(0, 6)

  return (
    <main id="dashboard-top" className="min-h-svh bg-medi-cream px-4 py-5 text-medi-petrol sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* NAVIGATION */}
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-full border-2 border-medi-border bg-white px-4 py-2.5 shadow-[0_10px_24px_rgba(22,50,62,0.06)]">
          <Link to="/" className="flex items-center gap-2">
            <BrandMark className="h-9 w-9" />
            <span className="hidden text-base font-extrabold uppercase tracking-widest text-medi-petrol sm:inline">MediBible</span>
            <span className="ml-1 rounded-full bg-medi-green-sage/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-medi-green-deep">
              Communauté active
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-1">
            {NAV_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold text-medi-petrol/65 transition hover:bg-medi-cream hover:text-medi-petrol"
              >
                {s.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: colorForName(user?.name) }}
            >
              {initialFrom(user?.name)}
            </div>
            <span className="hidden text-sm font-semibold text-medi-petrol sm:inline">{user?.name || 'Animateur'}</span>
            <button type="button" onClick={logout} className="text-sm font-semibold text-medi-coral transition hover:underline">
              Déconnexion
            </button>
          </div>
        </header>

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
            <Button variant="gold" className="w-full text-base sm:w-auto">+ Nouveau quiz</Button>
          </Link>
        </section>

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

        {/* UTILISATEURS CONNECTÉS / SESSIONS EN DIRECT / CLASSEMENT / RÉCOMPENSES */}
        <section id="live-sessions" className="grid items-start gap-6 xl:grid-cols-[1.1fr_0.9fr]">
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
                {ranking.map((entry, index) => (
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
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border-2 border-medi-border bg-white p-5 shadow-[0_18px_40px_rgba(22,50,62,0.05)] sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-medi-petrol">Sessions en direct</h2>
                <span className="flex items-center gap-1.5 rounded-full bg-medi-coral/10 px-2.5 py-1 text-xs font-bold text-medi-coral">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-medi-coral" /> Live
                </span>
              </div>

              <div className="space-y-3">
                {sessionsActive.map((session) => {
                  const hasProgress = session.status === 'live' && session.currentQuestionIndex >= 0 && session.questionsCount
                  const progressPct = hasProgress
                    ? Math.round(((session.currentQuestionIndex + 1) / session.questionsCount) * 100)
                    : 0
                  return (
                    <div key={session._id} className="rounded-lg border-2 border-medi-border bg-medi-cream/50 p-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="shrink-0 rounded-lg bg-medi-gold/20 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-medi-petrol">
                            #{session.accessCode}
                          </span>
                          <p className="truncate font-bold text-medi-petrol">{session.quiz?.title || 'Quiz inconnu'}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700">
                          {session.status === 'live' ? 'En cours' : 'En attente'}
                        </span>
                      </div>

                      <p className="mt-1.5 text-xs text-medi-petrol/55">Créé par : {session.host?.name || 'Inconnu'}</p>

                      {hasProgress ? (
                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-medi-petrol/60">
                            <span>Question {session.currentQuestionIndex + 1} / {session.questionsCount}</span>
                            <span>{progressPct}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-medi-border">
                            <div className="h-full rounded-full bg-medi-sky transition-all" style={{ width: `${progressPct}%` }} />
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-xs font-semibold text-medi-petrol/50">En attente du lancement…</p>
                      )}

                      <div className="mt-3 flex items-center justify-between text-xs text-medi-petrol/65">
                        <span>{session.playerCount ?? session.participants?.length ?? 0} joueurs</span>
                        <span>Leader : {session.winner?.displayName || '—'}</span>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <Button variant="outline" className="text-sm" onClick={() => openSessionDetail(session._id)}>
                          Détails
                        </Button>
                      </div>
                    </div>
                  )
                })}
                {sessionsActive.length === 0 && (
                  <p className="py-6 text-center text-sm text-medi-petrol/50">Aucune session en direct pour le moment.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border-2 border-medi-border bg-white p-5 shadow-[0_18px_40px_rgba(22,50,62,0.05)] sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-medi-petrol">Derniers gagnants</h2>
                <Button variant="outline" className="text-sm" onClick={loadAdmin}>Rafraîchir</Button>
              </div>
              <div className="space-y-3">
                {winners.map((w) => (
                  <div key={w.sessionId || w.accessCode} className="flex items-start gap-3 rounded-lg border-2 border-medi-border bg-medi-cream/50 p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-medi-gold/20 text-medi-gold">
                      <FaTrophy />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-bold text-medi-petrol">{w.winner?.displayName || '—'}</p>
                        <span className="shrink-0 text-sm font-bold text-medi-gold">{w.winner?.totalScore ?? 0} pts</span>
                      </div>
                      <p className="truncate text-xs text-medi-petrol/60">{w.quizTitle} • Animé par {w.hostName}</p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-medi-petrol/45">
                        {w.endedAt ? new Date(w.endedAt).toLocaleString('fr-FR') : '—'}
                      </p>
                    </div>
                  </div>
                ))}
                {winners.length === 0 && (
                  <p className="py-4 text-center text-sm text-medi-petrol/50">Pas encore de session terminée.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border-2 border-medi-gold/30 bg-medi-gold/8 p-5 sm:p-6">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-medi-gold">
                <FaMedal /> Verset du jour
              </p>
              <p className="mt-2 text-sm italic text-medi-petrol/80">« {verse.text} »</p>
              <p className="mt-1 text-xs font-semibold text-medi-petrol/50">{verse.ref}</p>
            </div>
          </div>
        </section>

        {/* GESTION DES QUIZ */}
        <section id="quiz-management" className="rounded-2xl border-2 border-medi-border bg-white p-5 shadow-[0_18px_40px_rgba(22,50,62,0.05)] sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-medi-green-deep/70">Back-office</p>
              <h2 className="mt-1 text-xl font-extrabold text-medi-petrol">Gestion des quiz</h2>
              <p className="text-sm text-medi-petrol/55">Création, modification et lancement de questionnaires interactifs.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-medi-petrol/35" />
                <input
                  value={quizSearch}
                  onChange={(e) => setQuizSearch(e.target.value)}
                  placeholder="Rechercher un quiz…"
                  className="min-h-11 w-full rounded-full border-2 border-medi-border bg-medi-cream/40 pl-10 pr-4 text-sm text-medi-petrol outline-none focus:border-medi-sky focus:ring-4 focus:ring-medi-sky/15 sm:w-56"
                />
              </div>
              <Link to="/admin/quizzes/new" className="w-full sm:w-auto">
                <Button variant="sky" className="w-full sm:w-auto">+ Nouveau quiz</Button>
              </Link>
            </div>
          </div>

          {error && (
            <p className="mb-4 rounded-xl border-2 border-medi-coral/30 bg-medi-coral/10 px-4 py-2 text-sm font-semibold text-medi-coral">
              {error}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredQuizzes.map((quiz) => (
              <div key={quiz._id} className="flex flex-col gap-3 rounded-xl border-2 border-medi-border bg-medi-cream/40 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-medi-sky/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-medi-sky">
                    {quiz.status === 'published' ? 'Publié' : quiz.status === 'archived' ? 'Archivé' : 'Brouillon'}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-medi-petrol/40">
                    {quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString('fr-FR') : ''}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-medi-petrol">{quiz.title}</p>
                  {quiz.description && <p className="mt-1 line-clamp-2 text-xs text-medi-petrol/55">{quiz.description}</p>}
                  <p className="mt-1 text-xs text-medi-petrol/50">{quiz.questions?.length || 0} question(s)</p>
                </div>
                <div className="mt-auto flex flex-col gap-2 sm:flex-row">
                  <Link to={`/admin/quizzes/${quiz._id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full text-sm">Modifier</Button>
                  </Link>
                  <Button
                    variant="gold"
                    className="flex-1 text-sm"
                    onClick={() => handleLaunch(quiz._id)}
                    disabled={launchingId === quiz._id}
                  >
                    {launchingId === quiz._id ? 'Lancement…' : 'Lancer'}
                  </Button>
                  <Button
                    variant="coral"
                    className="text-sm"
                    onClick={() => handleDelete(quiz._id)}
                    disabled={deletingId === quiz._id}
                  >
                    {deletingId === quiz._id ? '…' : 'Supprimer'}
                  </Button>
                </div>
              </div>
            ))}
            {filteredQuizzes.length === 0 && !error && (
              <p className="col-span-full rounded-xl border-2 border-dashed border-medi-border bg-white/60 p-6 text-center text-sm text-medi-petrol/60">
                {quizSearch ? 'Aucun quiz ne correspond à ta recherche.' : 'Aucun quiz pour le moment.'}
              </p>
            )}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="flex flex-col items-center gap-1 py-4 text-center text-xs text-medi-petrol/40">
          <p>MediBible &copy; {new Date().getFullYear()} — Communauté chrétienne</p>
          <p>Besoin d'aide ? Contacte le support de ta communauté.</p>
        </footer>

        {detailOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-medi-petrol/50 p-4 backdrop-blur-sm"
            onClick={closeSessionDetail}
          >
            <div
              className="animate-pop-in w-full max-w-2xl rounded-2xl border-2 border-medi-border bg-medi-surface p-6 shadow-[0_24px_60px_rgba(22,50,62,0.25)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-extrabold text-medi-petrol">Détail session {sessionDetail?.accessCode}</h3>
                <button
                  type="button"
                  onClick={closeSessionDetail}
                  className="rounded-full bg-medi-border/60 px-3 py-1 text-sm font-semibold text-medi-petrol/70 transition hover:bg-medi-border"
                >
                  Fermer
                </button>
              </div>
              <p className="mt-2 text-sm text-medi-petrol/70">Quiz : {sessionDetail?.quiz?.title} — Statut : {sessionDetail?.status}</p>
              <div className="mt-4">
                <h4 className="font-bold text-medi-petrol">Participants ({sessionDetail?.playerCount ?? sessionDetail?.participants?.length ?? 0})</h4>
                <ul className="mt-2 max-h-56 space-y-2 overflow-auto">
                  {sessionDetail?.participants?.map((p, idx) => (
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
        )}
      </div>
    </main>
  )
}
