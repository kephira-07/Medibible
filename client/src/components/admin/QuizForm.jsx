import { useState } from 'react'
import QuestionEditor from './QuestionEditor.jsx'
import Button from '../common/Button.jsx'

function emptyQuestion() {
  return {
    text: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
    timeLimit: 45,
    bibleReference: '',
  }
}

export default function QuizForm({ initialQuiz, onSubmit, submitting, error }) {
  const [title, setTitle] = useState(initialQuiz?.title || '')
  const [description, setDescription] = useState(initialQuiz?.description || '')
  const [questions, setQuestions] = useState(
    initialQuiz?.questions?.map((q) => ({ ...q, options: q.options.map((o) => ({ ...o })) })) || [
      emptyQuestion(),
    ]
  )
  const [localError, setLocalError] = useState(null)

  const updateQuestion = (index, updated) =>
    setQuestions((prev) => prev.map((q, i) => (i === index ? updated : q)))

  const removeQuestion = (index) => setQuestions((prev) => prev.filter((_, i) => i !== index))

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (questions.length === 0) {
      setLocalError('Le quiz doit contenir au moins une question.')
      return
    }
    for (const [i, q] of questions.entries()) {
      if (!q.text.trim()) {
        setLocalError(`Question ${i + 1} : l'énoncé est requis.`)
        return
      }
      if (q.options.some((o) => !o.text.trim())) {
        setLocalError(`Question ${i + 1} : toutes les options doivent avoir un texte.`)
        return
      }
      if (!q.options.some((o) => o.isCorrect)) {
        setLocalError(`Question ${i + 1} : sélectionnez au moins une bonne réponse.`)
        return
      }
    }

    setLocalError(null)
    onSubmit({ title, description, questions })
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-2xl flex-col gap-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre du quiz"
        required
        className="min-h-12 rounded-2xl border-2 border-medi-petrol/15 bg-white px-4 text-lg font-semibold text-medi-petrol"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optionnel)"
        rows={2}
        className="rounded-2xl border-2 border-medi-petrol/15 bg-white px-4 py-3 text-medi-petrol"
      />

      <div className="flex flex-col gap-4">
        {questions.map((q, i) => (
          <QuestionEditor
            key={i}
            question={q}
            index={i}
            onChange={updateQuestion}
            onRemove={removeQuestion}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addQuestion}
        className="min-h-12 rounded-2xl border-2 border-dashed border-medi-green-sage font-semibold text-medi-green-deep"
      >
        + Ajouter une question
      </button>

      {(localError || error) && <p className="text-sm text-red-600">{localError || error}</p>}

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Enregistrement…' : 'Enregistrer le quiz'}
      </Button>
    </form>
  )
}
