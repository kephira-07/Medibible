import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api.js'
import Button from '../../components/common/Button.jsx'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import SessionDetailModal from '../../components/admin/SessionDetailModal.jsx'
import { FaSearch } from 'react-icons/fa'

export default function MySessionsPage() {
  const [sessions, setSessions] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sessionDetail, setSessionDetail] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

  async function load() {
    try {
      const { data } = await api.get('/sessions')
      setSessions(Array.isArray(data) ? data.filter((s) => ['live', 'lobby'].includes(s.status)) : [])
    } catch (err) {
      setError((prev) => prev || err.response?.data?.message || 'Impossible de charger les sessions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 8000)
    return () => clearInterval(id)
  }, [])

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sessions
    return sessions.filter(
      (s) =>
        s.quizTitle?.toLowerCase().includes(q) ||
        s.accessCode?.toLowerCase().includes(q) ||
        s.hostName?.toLowerCase().includes(q)
    )
  }, [sessions, search])

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

  return (
    <AdminLayout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-medi-green-deep/70">Back-office</p>
          <h1 className="mt-1 text-2xl font-extrabold text-medi-petrol">Mes sessions</h1>
          <p className="mt-2 text-sm text-medi-petrol/65">
            Toutes les sessions en attente ou en cours, animées par ta communauté.
          </p>
        </div>

        <div className="relative w-full sm:max-w-sm">
          <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-medi-petrol/35" />
          <input
            id="sessionSearch"
            name="sessionSearch"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par quiz, code ou animateur…"
            className="min-h-11 w-full rounded-full border-2 border-medi-border bg-white pl-10 pr-4 text-sm text-medi-petrol outline-none focus:border-medi-sky focus:ring-4 focus:ring-medi-sky/15"
          />
        </div>

        {error && (
          <p className="rounded-xl border-2 border-medi-coral/30 bg-medi-coral/10 px-4 py-2 text-sm font-semibold text-medi-coral">
            {error}
          </p>
        )}

        {loading ? (
          <p className="py-10 text-center text-sm text-medi-petrol/50">Chargement…</p>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredSessions.length === 0 && !error && (
              <p className="rounded-2xl border-2 border-dashed border-medi-border bg-white/60 p-6 text-center text-sm text-medi-petrol/60">
                {search ? 'Aucune session ne correspond à ta recherche.' : 'Aucune session en attente ou en cours pour le moment.'}
              </p>
            )}
            {filteredSessions.map((session) => {
              const hasProgress = session.status === 'live' && session.currentQuestionIndex >= 0 && session.questionsCount
              const progressPct = hasProgress
                ? Math.round(((session.currentQuestionIndex + 1) / session.questionsCount) * 100)
                : 0
              return (
                <div key={session._id} className="rounded-2xl border-2 border-medi-border bg-white p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="shrink-0 rounded-lg bg-medi-gold/20 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-medi-petrol">
                        #{session.accessCode}
                      </span>
                      <p className="truncate font-bold text-medi-petrol">{session.quizTitle}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700">
                      {session.status === 'live' ? 'En cours' : 'En attente'}
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs text-medi-petrol/55">Créé par : {session.hostName}</p>

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
          </div>
        )}

        {detailOpen && <SessionDetailModal session={sessionDetail} onClose={closeSessionDetail} />}
      </div>
    </AdminLayout>
  )
}
