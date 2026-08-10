const MIN_OPTIONS = 2
const MAX_OPTIONS = 3

export default function QuestionEditor({ question, index, onChange, onRemove }) {
  const update = (patch) => onChange(index, { ...question, ...patch })

  const updateOption = (optionIndex, patch) => {
    const options = question.options.map((o, i) => (i === optionIndex ? { ...o, ...patch } : o))
    update({ options })
  }

  const addOption = () => {
    if (question.options.length >= MAX_OPTIONS) return
    update({ options: [...question.options, { text: '', isCorrect: false }] })
  }

  const removeOption = (optionIndex) => {
    if (question.options.length <= MIN_OPTIONS) return
    update({ options: question.options.filter((_, i) => i !== optionIndex) })
  }

  return (
    <div className="rounded-2xl border-2 border-medi-petrol/10 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-medi-petrol/60">Question {index + 1}</span>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-sm text-red-600 hover:underline"
        >
          Supprimer
        </button>
      </div>

      <textarea
        value={question.text}
        onChange={(e) => update({ text: e.target.value })}
        placeholder="Énoncé de la question"
        rows={2}
        className="mb-4 w-full rounded-2xl border-2 border-medi-petrol/15 bg-white px-4 py-3 text-medi-petrol"
      />

      <div className="mb-3 flex flex-col gap-2">
        {question.options.map((option, i) => (
          <div key={i} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={option.isCorrect}
              onChange={(e) => updateOption(i, { isCorrect: e.target.checked })}
              className="h-5 w-5 accent-medi-green-sage"
              title="Bonne réponse"
            />
            <input
              value={option.text}
              onChange={(e) => updateOption(i, { text: e.target.value })}
              placeholder={`Option ${i + 1}`}
              className="min-h-12 flex-1 rounded-2xl border-2 border-medi-petrol/15 bg-white px-4 text-medi-petrol"
            />
            <button
              type="button"
              onClick={() => removeOption(i)}
              disabled={question.options.length <= MIN_OPTIONS}
              className="px-2 text-medi-petrol/40 hover:text-red-600 disabled:opacity-30"
              title="Retirer l'option"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addOption}
        disabled={question.options.length >= MAX_OPTIONS}
        className="mb-4 text-sm font-semibold text-medi-green-deep disabled:opacity-30"
      >
        + Ajouter une option ({question.options.length}/{MAX_OPTIONS})
      </button>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-medi-petrol/70">
          Temps (secondes)
          <input
            type="number"
            min={5}
            value={question.timeLimit}
            onChange={(e) => update({ timeLimit: Number(e.target.value) })}
            className="min-h-12 rounded-2xl border-2 border-medi-petrol/15 bg-white px-4 text-medi-petrol"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-medi-petrol/70">
          Référence biblique
          <input
            value={question.bibleReference}
            onChange={(e) => update({ bibleReference: e.target.value })}
            placeholder="ex : Matthieu 14:29"
            className="min-h-12 rounded-2xl border-2 border-medi-petrol/15 bg-white px-4 text-medi-petrol"
          />
        </label>
      </div>
    </div>
  )
}
