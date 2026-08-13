import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api.js'
import Button from '../components/common/Button.jsx'
import AppHeader from '../components/common/AppHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function HostDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [error, setError] = useState(null)
  const [launchingId, setLaunchingId] = useState(null)

  useEffect(() => {
    api
      .get('/quizzes')
      .then(({ data }) => setQuizzes(data))
      .catch((err) => setError(err.response?.data?.message || 'Impossible de charger les quiz.'))
  }, [])

  const launchSession = async (quizId) => {
    setLaunchingId(quizId)
    try {
      const { data } = await api.post('/sessions', { quizId })
      navigate(`/session/${data.accessCode}`, { state: { displayName: user?.name || 'Animateur' } })
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de créer la session.')
      setLaunchingId(null)
    }
  }

  return (
    <main className="flex min-h-svh flex-col items-center gap-6 bg-medi-cream px-4 py-6">
      <div className="w-full max-w-5xl">
        <AppHeader
          right={
            <>
              <Link to="/admin" className="text-sm font-medium text-medi-petrol/70 transition hover:text-medi-petrol">
                Gérer les quiz
              </Link>
              <button
                type="button"
                onClick={logout}
                className="text-sm font-medium text-medi-petrol/70 transition hover:text-medi-petrol"
              >
                Déconnexion
              </button>
            </>
          }
        />
      </div>

      <div className="w-full max-w-3xl space-y-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-medi-green-deep/70">
              Animateur
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-medi-petrol">Mes quiz</h1>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex w-full flex-col gap-3">
          {quizzes.map((quiz) => (
            <div
              key={quiz._id}
              className="flex flex-col gap-3 rounded-[1.5rem] border border-medi-green-deep/10 bg-white/80 p-4 shadow-[0_12px_25px_rgba(15,50,61,0.04)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-medi-petrol">{quiz.title}</p>
                <p className="text-xs text-medi-petrol/50">{quiz.questions.length} question(s)</p>
              </div>
              <Button
                variant="gold"
                className="w-full sm:w-auto"
                onClick={() => launchSession(quiz._id)}
                disabled={launchingId === quiz._id}
              >
                Lancer
              </Button>
            </div>
          ))}
          {quizzes.length === 0 && !error && (
            <p className="rounded-[1.5rem] border border-dashed border-medi-green-deep/20 bg-white/60 p-6 text-center text-sm text-medi-petrol/60">
              Aucun quiz pour le moment.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
