import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api.js'
import Button from '../../components/common/Button.jsx'
import AppHeader from '../../components/common/AppHeader.jsx'
import { useAuth } from '../../context/AuthContext.jsx'


export default function AdminDashboard() {
  const { logout } = useAuth()
  const [quizzes, setQuizzes] = useState([])
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const [online, setOnline] = useState([])
  const [sessionsActive, setSessionsActive] = useState([])
  const [winners, setWinners] = useState([])
  const [loadingAdmin, setLoadingAdmin] = useState(false)
  const [sessionDetail, setSessionDetail] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

  async function loadAdmin() {
    setLoadingAdmin(true)
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
    } finally {
      setLoadingAdmin(false)
    }
  }

  useEffect(() => {
    loadAdmin()
    const id = setInterval(loadAdmin, 8000)
    return () => clearInterval(id)
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

  const closeSessionDetail = () => {
    setDetailOpen(false)
    setSessionDetail(null)
  }

  useEffect(() => {
    api
      .get('/quizzes')
      .then(({ data }) => setQuizzes(data))
      .catch((err) => setError(err.response?.data?.message || 'Impossible de charger les quiz.'))
  }, [])

  const stats = useMemo(
    () => [
      { label: 'Utilisateurs connectés', value: online.length, accent: 'bg-medi-green-deep' },
      { label: 'Sessions actives', value: String(sessionsActive.length), accent: 'bg-medi-gold' },
      { label: 'Quiz publiés', value: String(quizzes.length), accent: 'bg-medi-sky' },
      { label: 'Vainqueurs récents', value: String(winners.length), accent: 'bg-medi-coral' },
    ],
    [quizzes.length, online.length, sessionsActive.length, winners.length]
  )

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

  return (
    <main className="min-h-svh bg-medi-cream px-4 py-5 text-medi-petrol sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <AppHeader
          right={
            <button type="button" onClick={logout} className="text-sm font-medium text-medi-petrol/70 transition hover:text-medi-petrol">
              Déconnexion
            </button>
          }
        />

        <header className="flex flex-col gap-4 rounded-[2rem] border border-medi-green-deep/10 bg-white/80 p-5 shadow-[0_18px_40px_rgba(15,50,61,0.05)] backdrop-blur-sm sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-medi-green-deep/70">Administration</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-medi-petrol sm:text-3xl">Tableau de bord</h1>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link to="/admin/quizzes/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">+ Nouveau quiz</Button>
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-[1.5rem] border border-medi-green-deep/10 bg-white/80 p-5 shadow-[0_16px_36px_rgba(15,50,61,0.04)]">
              <div className={`mb-4 h-2.5 w-14 rounded-full ${stat.accent}`} />
              <p className="text-3xl font-bold tracking-tight text-medi-petrol">{stat.value}</p>
              <p className="mt-2 text-sm text-medi-petrol/60">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-medi-green-deep/10 bg-white/80 p-5 shadow-[0_18px_40px_rgba(15,50,61,0.05)] sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-medi-petrol">Utilisateurs connectés</h2>
              <span className="rounded-full bg-medi-green-deep/5 px-2.5 py-1 text-xs font-semibold text-medi-green-deep">
                {online.length} en ligne
              </span>
            </div>

            <div className="space-y-3">
              {online.map((user) => (
                <div
                  key={`${user.displayName}-${user.sessionId || user.socketId}`}
                  className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-medi-green-deep/10 bg-medi-cream/60 p-3"
                >
                  <div>
                    <p className="font-semibold text-medi-petrol">{user.displayName}</p>
                    <p className="text-xs text-medi-petrol/60">
                      {user.accessCode || user.sessionId || '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-medi-petrol">{user.totalScore ?? 0} pts</p>
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-600`}>
                      En ligne
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-medi-green-deep/10 bg-white/80 p-5 shadow-[0_18px_40px_rgba(15,50,61,0.05)] sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-medi-petrol">Sessions actives</h2>
              <span className="rounded-full bg-medi-gold/10 px-2.5 py-1 text-xs font-semibold text-medi-petrol">Live</span>
            </div>

            <div className="space-y-3">
              {sessionsActive.map((session) => (
                <div key={session._id} className="rounded-[1.25rem] border border-medi-green-deep/10 bg-medi-cream/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-medi-petrol">{session.quiz?.title || 'Quiz inconnu'}</p>
                      <p className="text-xs text-medi-petrol/60">{session.accessCode} • Créé par : {session.host?.name || session.host}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                      En cours
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-medi-petrol/65">
                    <span>{session.playerCount ?? (session.participants?.length || 0)} joueurs</span>
                    <span>Leader : {session.winner?.displayName || '—'}</span>
                  </div>
                  <p className="mt-2 text-right text-sm font-bold text-medi-petrol">{session.winner?.totalScore ?? 0} pts</p>

                  <div className="mt-3 flex justify-end gap-2">
                    <Button variant="outline" className="text-sm" onClick={() => openSessionDetail(session._id)}>
                      Détails
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-medi-green-deep/10 bg-white/80 p-5 shadow-[0_18px_40px_rgba(15,50,61,0.05)] sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-medi-petrol">Classement live</h2>
            <div className="space-y-3">
              {[
                { rank: 1, name: 'Aline', score: 960 },
                { rank: 2, name: 'Jean', score: 820 },
                { rank: 3, name: 'Paul', score: 760 },
                { rank: 4, name: 'Léa', score: 610 },
              ].map((entry) => (
                <div key={entry.rank} className="flex items-center justify-between rounded-[1.15rem] border border-medi-green-deep/10 bg-medi-cream/60 p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-medi-green-deep/10 font-bold text-medi-petrol">
                      #{entry.rank}
                    </span>
                    <span className="font-semibold text-medi-petrol">{entry.name}</span>
                  </div>
                  <span className="text-sm font-bold text-medi-gold">{entry.score} pts</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-medi-green-deep/10 bg-white/80 p-5 shadow-[0_18px_40px_rgba(15,50,61,0.05)] sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-medi-petrol">Derniers gagnants</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="text-sm" onClick={loadAdmin}>
                  Rafraîchir
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {winners.map((w) => (
                <div key={w.sessionId || w.accessCode} className="rounded-[1.15rem] border border-medi-green-deep/10 bg-medi-cream/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-medi-petrol">{w.winner?.displayName || '—'}</p>
                      <p className="text-xs text-medi-petrol/60">{w.quizTitle} • Créé par : {w.hostName}</p>
                    </div>
                    <span className="text-sm font-bold text-medi-gold">{w.winner?.totalScore ?? 0} pts</span>
                  </div>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-medi-petrol/60">{w.endedAt ? new Date(w.endedAt).toLocaleString() : '—'}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-medi-green-deep/10 bg-white/80 p-5 shadow-[0_18px_40px_rgba(15,50,61,0.05)] sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-medi-green-deep/70">Back-office</p>
              <h2 className="mt-1 text-xl font-bold text-medi-petrol">Gestion des quiz</h2>
            </div>
            <Link to="/admin/quizzes/new">
              <Button className="w-full sm:w-auto">+ Nouveau quiz</Button>
            </Link>
          </div>

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <div className="grid gap-3">
            {quizzes.map((quiz) => (
              <div
                key={quiz._id}
                className="flex flex-col gap-3 rounded-[1.5rem] border border-medi-green-deep/10 bg-medi-cream/60 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-medi-petrol">{quiz.title}</p>
                  <p className="text-xs text-medi-petrol/60">
                    {quiz.questions?.length || 0} question(s) • {quiz.status || 'draft'}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link to={`/admin/quizzes/${quiz._id}/edit`} className="sm:flex-none">
                    <Button variant="outline" className="w-full sm:w-auto">
                      Modifier
                    </Button>
                  </Link>
                  <Button
                    variant="gold"
                    className="w-full sm:w-auto"
                    onClick={() => handleDelete(quiz._id)}
                    disabled={deletingId === quiz._id}
                  >
                    {deletingId === quiz._id ? 'Suppression…' : 'Supprimer'}
                  </Button>
                </div>
              </div>
            ))}
            {quizzes.length === 0 && !error && (
              <p className="rounded-[1.5rem] border border-dashed border-medi-green-deep/20 bg-white/60 p-6 text-center text-sm text-medi-petrol/60">
                Aucun quiz pour le moment.
              </p>
            )}
          </div>
        </section>

      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-medi-petrol">Détail session {sessionDetail?.accessCode}</h3>
              <button type="button" onClick={closeSessionDetail} className="text-sm font-medium text-medi-petrol/70">Fermer</button>
            </div>
            <p className="text-sm text-medi-petrol/70 mt-2">Quiz: {sessionDetail?.quiz?.title} — Status: {sessionDetail?.status}</p>
            <div className="mt-4">
              <h4 className="font-semibold">Participants ({sessionDetail?.playerCount ?? sessionDetail?.participants?.length ?? 0})</h4>
              <ul className="mt-2 space-y-2 max-h-56 overflow-auto">
                {sessionDetail?.participants?.map((p, idx) => (
                  <li key={p.socketId || `${p.displayName}-${idx}`} className="flex justify-between">
                    <span className="text-medi-petrol">{p.displayName}</span>
                    <span className="text-sm text-medi-petrol/70">{p.totalScore} pts</span>
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
