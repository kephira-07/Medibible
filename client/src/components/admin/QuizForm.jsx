import { useState } from 'react'
import QuestionEditor from './QuestionEditor.jsx'
import QuestionBankPicker from './QuestionBankPicker.jsx'
import Button from '../common/Button.jsx'
import { HiOutlineAdjustments, HiOutlinePlus, HiOutlinePencil } from 'react-icons/hi'
import { HiOutlineBookOpen, HiOutlineClock } from 'react-icons/hi'
import { FaBookOpen } from 'react-icons/fa'

function emptyQuestion() {
  return {
    text: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
    timeLimit: 30,
    points: 100,
    bibleReference: '',
  }
}

function CollapsedQuestionRow({ question, index, onExpand }) {
  const correctTexts = question.options.filter((o) => o.isCorrect).map((o) => o.text).filter(Boolean)
  return (
    <button
      type="button"
      onClick={() => onExpand(index)}
      className="flex w-full flex-col gap-1.5 rounded-2xl border-2 border-medi-border bg-white p-4 text-left transition hover:border-medi-sky"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-bold text-medi-petrol/50">
          {question.bibleReference && (
            <span className="flex items-center gap-1"><HiOutlineBookOpen /> {question.bibleReference}</span>
          )}
          <span className="flex items-center gap-1"><HiOutlineClock /> {question.timeLimit}s</span>
          <span>{question.options.length} options</span>
        </span>
        <HiOutlinePencil className="text-medi-petrol/40" />
      </div>
      <p className="truncate font-bold text-medi-petrol">{question.text || `Question ${index + 1} (vide)`}</p>
      {correctTexts.length > 0 && (
        <p className="truncate text-xs font-semibold text-emerald-600">✓ {correctTexts.join(' · ')}</p>
      )}
    </button>
  )
}

export default function QuizForm({ initialQuiz, onSubmit, submitting, error }) {
  const [title, setTitle] = useState(initialQuiz?.title || '')
  const [description, setDescription] = useState(initialQuiz?.description || '')
  const [questions, setQuestions] = useState(
    initialQuiz?.questions?.map((q) => ({ ...q, options: q.options.map((o) => ({ ...o })) })) || [
      emptyQuestion(),
    ]
  )
  const [expandedIndex, setExpandedIndex] = useState(0)
  const [localError, setLocalError] = useState(null)
  const [bankOpen, setBankOpen] = useState(false)

  const addQuestionFromBank = (question) => {
    const { _id, ...rest } = question
    const copy = { ...rest, options: rest.options.map(({ _id: optId, ...opt }) => ({ ...opt })) }
    setQuestions((prev) => [...prev, copy])
    setExpandedIndex(questions.length)
  }

  const updateQuestion = (index, updated) =>
    setQuestions((prev) => prev.map((q, i) => (i === index ? updated : q)))

  const removeQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index))
    setExpandedIndex((prev) => (prev >= index ? Math.max(0, prev - 1) : prev))
  }

  const duplicateQuestion = (index) => {
    setQuestions((prev) => {
      const copy = { ...prev[index], options: prev[index].options.map((o) => ({ ...o })) }
      const next = [...prev]
      next.splice(index + 1, 0, copy)
      return next
    })
    setExpandedIndex(index + 1)
  }

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion()])
    setExpandedIndex(questions.length)
  }

  const submitAs = (status) => (e) => {
    e.preventDefault()

    if (!title.trim()) {
      setLocalError('Le titre du quiz est requis.')
      return
    }
    if (questions.length === 0) {
      setLocalError('Le quiz doit contenir au moins une question.')
      return
    }
    for (const [i, q] of questions.entries()) {
      if (!q.text.trim()) {
        setLocalError(`Question ${i + 1} : l'énoncé est requis.`)
        setExpandedIndex(i)
        return
      }
      if (q.options.some((o) => !o.text.trim())) {
        setLocalError(`Question ${i + 1} : toutes les options doivent avoir un texte.`)
        setExpandedIndex(i)
        return
      }
      if (!q.options.some((o) => o.isCorrect)) {
        setLocalError(`Question ${i + 1} : sélectionnez au moins une bonne réponse.`)
        setExpandedIndex(i)
        return
      }
    }

    setLocalError(null)
    onSubmit({ title, description, questions, status })
  }

  return (
    <form onSubmit={submitAs('draft')} className="flex w-full max-w-2xl flex-col gap-5">
      <div className="rounded-2xl border-2 border-medi-border bg-white p-5">
        <p className="mb-4 flex items-center gap-2 text-sm font-extrabold text-medi-petrol">
          <HiOutlineAdjustments className="text-medi-green-deep" /> Informations générales
        </p>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-medi-petrol/50">Titre du quiz</span>
          <input
            id="quizTitle"
            name="quizTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Les Actes des Apôtres • Foi et Mission"
            required
            className="min-h-12 w-full rounded-xl border-2 border-medi-border bg-white px-4 text-lg font-bold text-medi-petrol outline-none focus:border-medi-sky focus:ring-4 focus:ring-medi-sky/15"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-medi-petrol/50">Notes pour l'animateur (optionnel)</span>
          <textarea
            id="quizDescription"
            name="quizDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex : Quiz interactif pour la séance d'étude de jeunesse de vendredi soir."
            rows={2}
            className="w-full rounded-xl border-2 border-medi-border bg-white px-4 py-3 text-medi-petrol outline-none focus:border-medi-sky focus:ring-4 focus:ring-medi-sky/15"
          />
        </label>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <p className="text-sm font-extrabold text-medi-petrol">Questions du quiz</p>
          <span className="rounded-full bg-medi-chip px-2.5 py-1 text-[10px] font-bold text-medi-petrol/70">
            {questions.length} créée{questions.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {questions.map((q, i) =>
            i === expandedIndex ? (
              <QuestionEditor
                key={i}
                question={q}
                index={i}
                total={questions.length}
                onChange={updateQuestion}
                onRemove={removeQuestion}
                onDuplicate={duplicateQuestion}
              />
            ) : (
              <CollapsedQuestionRow key={i} question={q} index={i} onExpand={setExpandedIndex} />
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={addQuestion}
          className="flex flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-medi-green-sage bg-medi-green-sage/5 p-5 text-center transition hover:bg-medi-green-sage/10"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-medi-green-deep text-white">
            <HiOutlinePlus />
          </span>
          <span className="font-bold text-medi-green-deep">Ajouter une question</span>
          <span className="text-xs text-medi-petrol/50">Choix multiples pour tester les connaissances bibliques.</span>
        </button>

        <button
          type="button"
          onClick={() => setBankOpen(true)}
          className="flex flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-medi-border bg-medi-cream/40 p-5 text-center transition hover:bg-medi-cream"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-medi-petrol/10 text-medi-petrol">
            <FaBookOpen />
          </span>
          <span className="font-bold text-medi-petrol">Réutiliser une question</span>
          <span className="text-xs text-medi-petrol/50">Piocher une question déjà écrite dans un autre quiz.</span>
        </button>
      </div>

      {bankOpen && (
        <QuestionBankPicker onAdd={addQuestionFromBank} onClose={() => setBankOpen(false)} />
      )}

      {(localError || error) && (
        <p className="rounded-xl border-2 border-medi-coral/30 bg-medi-coral/10 px-4 py-2 text-sm font-semibold text-medi-coral">
          {localError || error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="outline"
          type="button"
          onClick={submitAs('draft')}
          disabled={submitting}
          className="flex-1 text-base"
        >
          {submitting ? 'Enregistrement…' : 'Enregistrer comme brouillon'}
        </Button>
        <Button
          variant="primary"
          type="button"
          onClick={submitAs('published')}
          disabled={submitting}
          className="flex-1 text-base"
        >
          {submitting ? 'Enregistrement…' : 'Publier le quiz'}
        </Button>
      </div>
      <p className="text-center text-xs text-medi-petrol/45">
        Un brouillon reste modifiable et peut toujours être lancé — publie-le quand il est prêt à être annoncé.
      </p>
    </form>
  )
}
