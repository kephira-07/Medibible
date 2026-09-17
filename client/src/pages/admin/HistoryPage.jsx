import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import Button from '../../components/common/Button.jsx'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { FaTrophy, FaUsers } from 'react-icons/fa'
import { HiOutlineClock, HiOutlineBookOpen } from 'react-icons/hi'

const TABS = [
  { key: 'sessions', label: 'Sessions passées' },
  { key: 'quizzes', label: 'Quiz déjà utilisés' },
]

export default function HistoryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('sessions')
  const [sessions, setSessions] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [launchingId, setLaunchingId] = useState(null)

  useEffect(() => {
    Promise.all([api.get('/sessions'), api.get('/quizzes')])
      .then(([sessionsRes, quizzesRes]) => {
        setSessions(Array.isArray(sessionsRes.data) ? sessionsRes.data : [])
        setQuizzes(Array.isArray(quizzesRes.data) ? quizzesRes.data : [])
      })
      .catch((err) => setError(err.response?.data?.message || 'Impossible de charger l’historique.'))
      .finally(() => setLoading(false))
  }, [])

  const endedSessions = useMemo(
    () => sessions.filter((s) => s.status === 'ended').sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    [sessions]
  )

  // Regroupe les sessions par quiz pour construire l'historique d'utilisation :
  // combien de fois chaque quiz a servi, et sa dernière utilisation.
  const quizUsage = useMemo(() => {
    const byQuizId = new Map()
    for (const s of sessions) {
      const quizId = s.quiz?._id
      if (!quizId) continue
      const entry = byQuizId.get(quizId) || { count: 0, lastUsed: null }
      entry.count += 1
      if (!entry.lastUsed || new Date(s.updatedAt) > new Date(entry.lastUsed)) entry.lastUsed = s.updatedAt
      byQuizId.set(quizId, entry)
    }

    return quizzes
      .map((quiz) => ({
        quiz,
        count: byQuizId.get(quiz._id)?.count || 0,
        lastUsed: byQuizId.get(quiz._id)?.lastUsed || null,
      }))
      .sort((a, b) => {
        if (!a.lastUsed && !b.lastUsed) return 0
        if (!a.lastUsed) return 1
        if (!b.lastUsed) return -1
        return new Date(b.lastUsed) - new Date(a.lastUsed)
      })
  }, [sessions, quizzes])

  const handleRelaunch = async (quizId) => {
    setLaunchingId(quizId)
    try {
      const { data } = await api.post('/sessions', { quizId })
      navigate(`/session/${data.accessCode}`, { state: { displayName: user?.name || 'Animateur' } })
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de relancer ce quiz.')
      setLaunchingId(null)
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-medi-green-deep/70">Back-office</p>
          <h1 className="mt-1 text-2xl font-extrabold text-medi-petrol">Historique</h1>
          <p className="mt-1 text-sm text-medi-petrol/60">
            Retrouve les sessions passées, les gagnants, et les quiz déjà utilisés dans la communauté.
          </p>
        </div>

        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                tab === t.key
                  ? 'bg-medi-green-deep text-white'
                  : 'border-2 border-medi-border bg-white text-medi-petrol/60 hover:border-medi-green-sage'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="rounded-xl border-2 border-medi-coral/30 bg-medi-coral/10 px-4 py-2 text-sm font-semibold text-medi-coral">
            {error}
          </p>
        )}

        {loading ? (
          <p className="py-10 text-center text-sm text-medi-petrol/50">Chargement…</p>
        ) : tab === 'sessions' ? (
          <div className="flex flex-col gap-3">
            {endedSessions.length === 0 && (
              <p className="rounded-2xl border-2 border-dashed border-medi-border bg-white/60 p-6 text-center text-sm text-medi-petrol/60">
                Aucune session terminée pour le moment.
              </p>
            )}
            {endedSessions.map((s) => (
              <div key={s._id} className="rounded-2xl border-2 border-medi-border bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-lg bg-medi-gold/20 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-medi-petrol">
                      #{s.accessCode}
                    </span>
                    <p className="font-bold text-medi-petrol">{s.quizTitle}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-medi-petrol/50">
                    <HiOutlineClock /> {new Date(s.updatedAt).toLocaleString('fr-FR')}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-1.5 text-medi-petrol/65">
                    <FaUsers /> {s.playerCount} joueur{s.playerCount > 1 ? 's' : ''} · Animé par {s.hostName}
                  </span>
                  {s.winner ? (
                    <span className="flex items-center gap-1.5 font-bold text-medi-gold">
                      <FaTrophy /> {s.winner.displayName} — {s.winner.totalScore} pts
                    </span>
                  ) : (
                    <span className="text-medi-petrol/40">Aucun gagnant</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {quizUsage.length === 0 && (
              <p className="rounded-2xl border-2 border-dashed border-medi-border bg-white/60 p-6 text-center text-sm text-medi-petrol/60">
                Aucun quiz créé pour le moment.
              </p>
            )}
            {quizUsage.map(({ quiz, count, lastUsed }) => (
              <div key={quiz._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-medi-border bg-white p-4 sm:p-5">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-bold text-medi-petrol">
                    <HiOutlineBookOpen className="shrink-0 text-medi-green-deep" /> {quiz.title}
                  </p>
                  <p className="mt-1 text-xs text-medi-petrol/55">
                    {count === 0
                      ? 'Jamais utilisé'
                      : `Utilisé ${count} fois · dernière fois le ${new Date(lastUsed).toLocaleDateString('fr-FR')}`}
                  </p>
                </div>
                <Button
                  variant="gold"
                  className="text-sm"
                  onClick={() => handleRelaunch(quiz._id)}
                  disabled={launchingId === quiz._id}
                >
                  {launchingId === quiz._id ? 'Lancement…' : count > 0 ? 'Relancer' : 'Lancer'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
