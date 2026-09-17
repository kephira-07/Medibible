import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api.js'
import QuizForm from '../../components/admin/QuizForm.jsx'
import AppHeader from '../../components/common/AppHeader.jsx'

function extractErrorMessage(err) {
  const data = err.response?.data
  if (data?.errors) return Object.values(data.errors).join(' ')
  return data?.message || "Impossible d'enregistrer le quiz."
}

export default function QuizEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [initialQuiz, setInitialQuiz] = useState(null)
  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEditing) return
    api
      .get(`/quizzes/${id}`)
      .then(({ data }) => setInitialQuiz(data))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id, isEditing])

  const handleSubmit = async (quiz) => {
    setSubmitting(true)
    setError(null)
    try {
      if (isEditing) {
        await api.put(`/quizzes/${id}`, quiz)
      } else {
        await api.post('/quizzes', quiz)
      }
      navigate('/admin')
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-medi-cream">
        <p className="flex items-center gap-2 text-medi-petrol/60">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-medi-sky border-t-transparent" />
          Chargement…
        </p>
      </main>
    )
  }

  return (
    <main className="flex min-h-svh flex-col items-center gap-6 bg-medi-cream px-4 py-4">
      <div className="w-full max-w-2xl">
        <AppHeader />
      </div>

      <div className="w-full max-w-2xl">
        <div className="mb-1 flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-medi-green-deep/70">Éditeur de quiz</p>
          <span className="rounded-full bg-medi-chip px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-medi-petrol/70">
            {initialQuiz?.status === 'published' ? 'Publié' : 'Brouillon'}
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-medi-petrol">
          {isEditing ? 'Modifier le quiz' : 'Créer un quiz'}
        </h1>
        <p className="mt-1 text-sm text-medi-petrol/60">
          Rédige tes questions et prépare les réponses pour dynamiser ton assemblée ou ton groupe de maison.
        </p>
      </div>

      <QuizForm initialQuiz={initialQuiz} onSubmit={handleSubmit} submitting={submitting} error={error} />
    </main>
  )
}
