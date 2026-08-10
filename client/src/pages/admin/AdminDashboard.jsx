import { useEffect, useState } from 'react'
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

  useEffect(() => {
    api
      .get('/quizzes')
      .then(({ data }) => setQuizzes(data))
      .catch((err) => setError(err.response?.data?.message || 'Impossible de charger les quiz.'))
  }, [])

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
    <main className="flex min-h-svh flex-col items-center gap-6 bg-medi-cream px-4 py-4">
      <AppHeader
        right={
          <>
            <Link to="/host" className="text-sm text-medi-petrol/60 underline">
              Espace animateur
            </Link>
            <button type="button" onClick={logout} className="text-sm text-medi-petrol/60 underline">
              Déconnexion
            </button>
          </>
        }
      />

      <h1 className="w-full max-w-2xl text-xl font-bold text-medi-petrol">Back-office quiz</h1>

      <Link to="/admin/quizzes/new" className="w-full max-w-2xl">
        <Button className="w-full">+ Nouveau quiz</Button>
      </Link>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex w-full max-w-2xl flex-col gap-3">
        {quizzes.map((quiz) => (
          <div
            key={quiz._id}
            className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-medi-petrol">{quiz.title}</p>
              <p className="text-xs text-medi-petrol/50">
                {quiz.questions.length} question(s) — {quiz.status}
              </p>
            </div>
            <div className="flex gap-2">
              <Link to={`/admin/quizzes/${quiz._id}/edit`} className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full">
                  Modifier
                </Button>
              </Link>
              <Button
                variant="gold"
                className="flex-1 sm:flex-none"
                onClick={() => handleDelete(quiz._id)}
                disabled={deletingId === quiz._id}
              >
                Supprimer
              </Button>
            </div>
          </div>
        ))}
        {quizzes.length === 0 && !error && (
          <p className="text-center text-sm text-medi-petrol/50">Aucun quiz pour le moment.</p>
        )}
      </div>
    </main>
  )
}
