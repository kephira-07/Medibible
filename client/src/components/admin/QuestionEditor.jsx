import { FaTimes, FaCopy, FaCheck } from 'react-icons/fa'
import { HiOutlineBookOpen, HiOutlineClock, HiOutlineStar } from 'react-icons/hi'

const MIN_OPTIONS = 2
// Doit rester synchronisé avec QUESTION_MAX_OPTIONS côté serveur (server/src/utils/constants.js)
const MAX_OPTIONS = 4
const LETTERS = ['A', 'B', 'C', 'D']
// Mêmes couleurs que les cartes-réponses vues par les joueurs (OptionButton) —
// pour que l'animateur voie ici la couleur exacte que chaque option aura en jeu.
const OPTION_COLORS = ['bg-medi-coral', 'bg-medi-sky', 'bg-medi-gold', 'bg-medi-green-sage']
const TIME_STEP = 5
const TIME_MIN = 5
const TIME_MAX = 120
const POINTS_STEP = 25
const POINTS_MIN = 0
const POINTS_MAX = 1000
const POINTS_DEFAULT = 100

export default function QuestionEditor({ question, index, total, onChange, onRemove, onDuplicate }) {
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

  const adjustTime = (delta) => {
    const next = Math.min(TIME_MAX, Math.max(TIME_MIN, (question.timeLimit || TIME_MIN) + delta))
    update({ timeLimit: next })
  }

  const adjustPoints = (delta) => {
    const next = Math.min(POINTS_MAX, Math.max(POINTS_MIN, (question.points ?? POINTS_DEFAULT) + delta))
    update({ points: next })
  }

  return (
    <div className="rounded-2xl border-2 border-medi-border bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-medi-green-deep text-xs font-extrabold text-white">
            {index + 1}
          </span>
          <span className="text-sm font-bold text-medi-petrol/70">Question {index + 1} / {total}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onDuplicate(index)}
            className="text-medi-petrol/45 transition hover:text-medi-sky"
            title="Dupliquer cette question"
          >
            <FaCopy />
          </button>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-medi-petrol/45 transition hover:text-medi-coral"
            title="Supprimer cette question"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      <label className="mb-4 block">
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-medi-petrol/50">Intitulé de la question</span>
        <textarea
          name={`question-text-${index}`}
          value={question.text}
          onChange={(e) => update({ text: e.target.value })}
          placeholder="Énoncé de la question"
          rows={2}
          className="w-full rounded-xl border-2 border-medi-border bg-white px-4 py-3 text-medi-petrol outline-none focus:border-medi-sky focus:ring-4 focus:ring-medi-sky/15"
        />
      </label>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="block sm:col-span-1">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-medi-petrol/50">Référence biblique (optionnel)</span>
          <div className="flex items-center gap-2 rounded-xl border-2 border-medi-border bg-white px-3">
            <HiOutlineBookOpen className="shrink-0 text-medi-petrol/40" />
            <input
              name={`bible-reference-${index}`}
              value={question.bibleReference}
              onChange={(e) => update({ bibleReference: e.target.value })}
              placeholder="ex : Matthieu 14:29"
              className="min-h-12 w-full bg-transparent text-medi-petrol outline-none"
            />
          </div>
        </label>

        <div>
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-medi-petrol/50">Temps de réponse</span>
          <div className="flex min-h-12 items-center justify-between rounded-xl border-2 border-medi-border bg-white px-2">
            <button
              type="button"
              onClick={() => adjustTime(-TIME_STEP)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold text-medi-petrol/60 transition hover:bg-medi-cream"
            >
              −
            </button>
            <span className="flex items-center gap-1.5 font-bold text-medi-petrol">
              <HiOutlineClock className="text-medi-petrol/40" /> {question.timeLimit} secondes
            </span>
            <button
              type="button"
              onClick={() => adjustTime(TIME_STEP)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold text-medi-petrol/60 transition hover:bg-medi-cream"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-medi-petrol/50">Points (bonne réponse)</span>
          <div className="flex min-h-12 items-center justify-between rounded-xl border-2 border-medi-border bg-white px-2">
            <button
              type="button"
              onClick={() => adjustPoints(-POINTS_STEP)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold text-medi-petrol/60 transition hover:bg-medi-cream"
            >
              −
            </button>
            <span className="flex items-center gap-1.5 font-bold text-medi-petrol">
              <HiOutlineStar className="text-medi-gold" /> {question.points ?? POINTS_DEFAULT} pts
            </span>
            <button
              type="button"
              onClick={() => adjustPoints(POINTS_STEP)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold text-medi-petrol/60 transition hover:bg-medi-cream"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-medi-petrol/50">Options de réponse (cochez la bonne)</span>
        <span className="rounded-full bg-medi-chip px-2.5 py-1 text-[10px] font-bold text-medi-petrol/70">
          {question.options.filter((o) => o.isCorrect).length} réponse(s) requise(s)
        </span>
      </div>

      <div className="mb-3 flex flex-col gap-2">
        {question.options.map((option, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-xl border-2 p-2 transition ${
              option.isCorrect ? 'border-emerald-400 bg-emerald-50' : 'border-medi-border bg-white'
            }`}
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold text-white ${OPTION_COLORS[i % OPTION_COLORS.length]}`}>
              {LETTERS[i]}
            </span>
            <input
              name={`option-${index}-${i}`}
              value={option.text}
              onChange={(e) => updateOption(i, { text: e.target.value })}
              placeholder={`Option ${LETTERS[i]}`}
              className="min-h-10 flex-1 bg-transparent text-medi-petrol outline-none"
            />
            <button
              type="button"
              onClick={() => updateOption(i, { isCorrect: !option.isCorrect })}
              className={
                option.isCorrect
                  ? 'flex shrink-0 items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white'
                  : 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-medi-border text-transparent transition hover:border-emerald-400'
              }
              title="Marquer comme bonne réponse"
            >
              <FaCheck className={option.isCorrect ? '' : 'text-xs'} />
              {option.isCorrect && <span>Bonne réponse</span>}
            </button>
            <button
              type="button"
              onClick={() => removeOption(i)}
              disabled={question.options.length <= MIN_OPTIONS}
              className="shrink-0 px-1 text-medi-petrol/35 hover:text-medi-coral disabled:opacity-20"
              title="Retirer l'option"
            >
              <FaTimes />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addOption}
        disabled={question.options.length >= MAX_OPTIONS}
        className="text-sm font-bold text-medi-green-deep disabled:opacity-30"
      >
        {question.options.length >= MAX_OPTIONS
          ? `Maximum de ${MAX_OPTIONS} options atteint`
          : `+ Ajouter une option de réponse (Option ${LETTERS[question.options.length]})`}
      </button>
    </div>
  )
}
