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
  const [reminderTitle, setReminderTitle] = useState('Le quiz commence bientôt !')
  const [reminderBody, setReminderBody] = useState('Rejoins-nous pour le quiz biblique en direct.')
  const [reminderStatus, setReminderStatus] = useState(null) // null | 'sending' | { sent, failed }

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

  const sendReminder = async (e) => {
    e.preventDefault()
    setReminderStatus('sending')
    try {
      const { data } = await api.post('/notifications/broadcast', {
        title: reminderTitle,
        body: reminderBody,
      })
      setReminderStatus(data)
    } catch (err) {
      setReminderStatus({ error: err.response?.data?.message || "Impossible d'envoyer le rappel." })
    }
  }

  return (
    <main className="flex min-h-svh flex-col items-center gap-6 bg-medi-cream px-4 py-4">
      <AppHeader
        right={
          <>
            <Link to="/admin" className="text-sm text-medi-petrol/60 underline">
              Gérer les quiz
            </Link>
            <button type="button" onClick={logout} className="text-sm text-medi-petrol/60 underline">
              Déconnexion
            </button>
          </>
        }
      />

      <h1 className="w-full max-w-md text-xl font-bold text-medi-petrol">Mes quiz</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form
        onSubmit={sendReminder}
        className="flex w-full max-w-md flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm"
      >
        <p className="text-sm font-semibold text-medi-petrol">📣 Envoyer un rappel push</p>
        <input
          value={reminderTitle}
          onChange={(e) => setReminderTitle(e.target.value)}
          placeholder="Titre de la notification"
          className="min-h-12 rounded-2xl border-2 border-medi-petrol/15 bg-white px-4 text-medi-petrol"
        />
        <input
          value={reminderBody}
          onChange={(e) => setReminderBody(e.target.value)}
          placeholder="Message"
          className="min-h-12 rounded-2xl border-2 border-medi-petrol/15 bg-white px-4 text-medi-petrol"
        />
        <Button variant="outline" type="submit" disabled={reminderStatus === 'sending'}>
          {reminderStatus === 'sending' ? 'Envoi…' : 'Envoyer le rappel'}
        </Button>
        {reminderStatus && reminderStatus !== 'sending' && (
          <p className="text-xs text-medi-petrol/60">
            {reminderStatus.error
              ? reminderStatus.error
              : `Envoyé à ${reminderStatus.sent} abonné(s)${reminderStatus.failed ? `, ${reminderStatus.failed} échec(s)` : ''}.`}
          </p>
        )}
      </form>

      <div className="flex w-full max-w-md flex-col gap-3">
        {quizzes.map((quiz) => (
          <div
            key={quiz._id}
            className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
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
          <p className="text-center text-sm text-medi-petrol/50">Aucun quiz pour le moment.</p>
        )}
      </div>
    </main>
  )
}
