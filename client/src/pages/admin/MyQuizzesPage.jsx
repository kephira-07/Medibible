import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import Button from '../../components/common/Button.jsx'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { FaSearch, FaPencilAlt } from 'react-icons/fa'

const PAGE_SIZE = 9

export default function MyQuizzesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [launchingId, setLaunchingId] = useState(null)
  const [showAllDrafts, setShowAllDrafts] = useState(false)
  const [showAllReady, setShowAllReady] = useState(false)

  useEffect(() => {
    api
      .get('/quizzes')
      .then(({ data }) => setQuizzes(data))
      .catch((err) => setError(err.response?.data?.message || 'Impossible de charger les quiz.'))
      .finally(() => setLoading(false))
  }, [])

  const filteredQuizzes = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return quizzes
    return quizzes.filter((quiz) => quiz.title?.toLowerCase().includes(q))
  }, [quizzes, search])

  const draftQuizzes = useMemo(() => filteredQuizzes.filter((q) => q.status === 'draft'), [filteredQuizzes])
  const readyQuizzes = useMemo(() => filteredQuizzes.filter((q) => q.status !== 'draft'), [filteredQuizzes])

  const visibleDrafts = showAllDrafts ? draftQuizzes : draftQuizzes.slice(0, PAGE_SIZE)
  const visibleReady = showAllReady ? readyQuizzes : readyQuizzes.slice(0, PAGE_SIZE)

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

  const renderCard = (quiz, { draft } = {}) => (
    <div
      key={quiz._id}
      className={`flex flex-col gap-3 rounded-xl border-2 p-4 ${
        draft ? 'border-medi-gold/40 bg-medi-gold/5' : 'border-medi-border bg-medi-cream/40'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
            draft ? 'bg-medi-gold/20 text-medi-petrol' : 'bg-medi-sky/15 text-medi-sky'
          }`}
        >
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
          <Button variant="outline" className="w-full text-sm">
            {draft ? (
              <span className="flex items-center justify-center gap-1.5">
                <FaPencilAlt className="text-xs" /> Compléter
              </span>
            ) : (
              'Modifier'
            )}
          </Button>
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
  )

  return (
    <AdminLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-2xl border-2 border-medi-border bg-white p-6 shadow-[0_18px_40px_rgba(22,50,62,0.06)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-medi-green-deep/70">Back-office</p>
            <h1 className="mt-1 text-2xl font-extrabold text-medi-petrol">Mes quiz</h1>
            <p className="mt-2 max-w-xl text-sm text-medi-petrol/65">
              Création, modification et lancement de tes questionnaires bibliques.
            </p>
          </div>
          <Link to="/admin/quizzes/new" className="shrink-0">
            <Button variant="primary" className="w-full text-base sm:w-auto">+ Nouveau quiz</Button>
          </Link>
        </div>

        <div className="relative w-full sm:max-w-sm">
          <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-medi-petrol/35" />
          <input
            id="quizSearch"
            name="quizSearch"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un quiz…"
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
          <>
            {/* MES BROUILLONS */}
            {draftQuizzes.length > 0 && (
              <div className="rounded-2xl border-2 border-medi-gold/30 bg-medi-gold/8 p-5 shadow-[0_18px_40px_rgba(22,50,62,0.05)] sm:p-6">
                <h2 className="text-lg font-bold text-medi-petrol">Mes brouillons</h2>
                <p className="mt-1 text-sm text-medi-petrol/60">
                  Des quiz commencés mais pas encore finalisés — reviens les compléter puis publie-les quand ils sont prêts.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleDrafts.map((quiz) => renderCard(quiz, { draft: true }))}
                </div>

                {draftQuizzes.length > PAGE_SIZE && (
                  <button
                    type="button"
                    onClick={() => setShowAllDrafts((v) => !v)}
                    className="mt-4 w-full rounded-2xl border-2 border-medi-border bg-white py-2.5 text-sm font-bold text-medi-petrol/70 transition hover:bg-medi-cream"
                  >
                    {showAllDrafts ? 'Réduire la liste' : 'Lire la suite'}
                  </button>
                )}
              </div>
            )}

            {/* MES QUIZ PRÊTS */}
            <div className="rounded-2xl border-2 border-medi-border bg-white p-5 shadow-[0_18px_40px_rgba(22,50,62,0.05)] sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleReady.map((quiz) => renderCard(quiz))}
                {filteredQuizzes.length === 0 && !error && (
                  <p className="col-span-full rounded-xl border-2 border-dashed border-medi-border bg-white/60 p-6 text-center text-sm text-medi-petrol/60">
                    {search ? 'Aucun quiz ne correspond à ta recherche.' : 'Aucun quiz pour le moment.'}
                  </p>
                )}
                {filteredQuizzes.length > 0 && readyQuizzes.length === 0 && (
                  <p className="col-span-full rounded-xl border-2 border-dashed border-medi-border bg-white/60 p-6 text-center text-sm text-medi-petrol/60">
                    Tous tes quiz sont encore en brouillon — publie-en un pour le voir ici.
                  </p>
                )}
              </div>

              {readyQuizzes.length > PAGE_SIZE && (
                <button
                  type="button"
                  onClick={() => setShowAllReady((v) => !v)}
                  className="mt-4 w-full rounded-2xl border-2 border-medi-border py-2.5 text-sm font-bold text-medi-petrol/70 transition hover:bg-medi-cream"
                >
                  {showAllReady ? 'Réduire la liste' : 'Lire la suite'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
