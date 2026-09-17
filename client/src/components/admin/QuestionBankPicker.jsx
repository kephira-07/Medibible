import { useEffect, useState } from 'react'
import { FaSearch, FaTimes, FaPlus, FaCheck } from 'react-icons/fa'
import { HiOutlineClock } from 'react-icons/hi'
import api from '../../services/api.js'

// Modale de sélection : parcourt les questions déjà écrites dans n'importe
// quel quiz existant, pour que l'animateur en réutilise une copie plutôt que
// de la retaper depuis zéro.
export default function QuestionBankPicker({ onAdd, onClose }) {
  const [search, setSearch] = useState('')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [addedKeys, setAddedKeys] = useState(new Set())

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    const timer = setTimeout(() => {
      api
        .get('/quizzes/bank/questions', { params: { q: search }, signal: controller.signal })
        .then(({ data }) => {
          setEntries(data)
          setError(null)
        })
        .catch((err) => {
          if (err.name !== 'CanceledError') setError('Impossible de charger la banque de questions.')
        })
        .finally(() => setLoading(false))
    }, 250)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [search])

  const handleAdd = (entry, key) => {
    onAdd(entry.question)
    setAddedKeys((prev) => new Set(prev).add(key))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-medi-petrol/40 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl border-2 border-medi-border bg-white sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b-2 border-medi-border p-4">
          <div>
            <h2 className="text-base font-bold text-medi-petrol">Banque de questions</h2>
            <p className="text-xs text-medi-petrol/55">Réutilise une question déjà écrite dans un autre quiz.</p>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 text-medi-petrol/40 hover:text-medi-coral">
            <FaTimes />
          </button>
        </div>

        <div className="border-b-2 border-medi-border p-4">
          <div className="relative">
            <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-medi-petrol/35" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par mot-clé…"
              className="min-h-11 w-full rounded-xl border-2 border-medi-border bg-white pl-10 pr-3 text-medi-petrol outline-none focus:border-medi-sky focus:ring-4 focus:ring-medi-sky/15"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && <p className="py-6 text-center text-sm text-medi-petrol/50">Chargement…</p>}
          {!loading && error && <p className="py-6 text-center text-sm text-medi-coral">{error}</p>}
          {!loading && !error && entries.length === 0 && (
            <p className="py-6 text-center text-sm text-medi-petrol/50">
              {search ? 'Aucune question ne correspond à cette recherche.' : 'Aucune question existante pour le moment.'}
            </p>
          )}

          <div className="flex flex-col gap-2.5">
            {entries.map((entry, i) => {
              const key = `${entry.quizId}-${entry.question._id || i}`
              const added = addedKeys.has(key)
              const correctTexts = entry.question.options.filter((o) => o.isCorrect).map((o) => o.text)
              return (
                <div key={key} className="flex items-start gap-3 rounded-xl border-2 border-medi-border bg-medi-cream/40 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-bold uppercase tracking-wide text-medi-petrol/45">{entry.quizTitle}</p>
                    <p className="mt-0.5 font-semibold text-medi-petrol">{entry.question.text}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-medi-petrol/55">
                      <span className="flex items-center gap-1"><HiOutlineClock /> {entry.question.timeLimit}s</span>
                      <span>{entry.question.points ?? 100} pts</span>
                      {correctTexts.length > 0 && (
                        <span className="truncate text-emerald-600">✓ {correctTexts.join(' · ')}</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdd(entry, key)}
                    disabled={added}
                    className={
                      added
                        ? 'flex shrink-0 items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white'
                        : 'flex shrink-0 items-center gap-1 rounded-full bg-medi-green-deep px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#004d0f]'
                    }
                  >
                    {added ? <FaCheck /> : <FaPlus />}
                    {added ? 'Ajoutée' : 'Ajouter'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-t-2 border-medi-border p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border-2 border-medi-border py-2.5 text-sm font-bold text-medi-petrol/70 transition hover:bg-medi-cream"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
