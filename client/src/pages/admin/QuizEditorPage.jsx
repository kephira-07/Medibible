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
        <p className="text-medi-petrol/60">Chargement…</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-svh flex-col items-center gap-6 bg-medi-cream px-4 py-4">
      <AppHeader />
      <h1 className="text-xl font-bold text-medi-petrol">
        {isEditing ? 'Modifier le quiz' : 'Nouveau quiz'}
      </h1>
      <QuizForm initialQuiz={initialQuiz} onSubmit={handleSubmit} submitting={submitting} error={error} />
    </main>
  )
}
