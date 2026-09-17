import { useEffect, useState } from 'react'
import CountdownRing from './CountdownRing.jsx'
import OptionButton from './OptionButton.jsx'
import Button from '../common/Button.jsx'
import { useQuizTimer } from '../../hooks/useQuizTimer.js'

const LETTERS = ['A', 'B', 'C', 'D']

export default function QuestionCard({ question, phase, correctOptionIds, hasAnswered, onSubmit }) {
  const [selectedIds, setSelectedIds] = useState([])
  const remainingMs = useQuizTimer(phase === 'open' ? question.endsAt : null)
  const totalMs = question.timeLimit * 1000
  const progressPct = Math.round(((question.questionIndex + 1) / question.totalQuestions) * 100)

  useEffect(() => {
    setSelectedIds([])
  }, [question.questionIndex])

  const toggleOption = (id) => {
    if (hasAnswered || phase !== 'open') return
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const optionState = (option) => {
    if (phase !== 'closed') return null
    if (correctOptionIds?.includes(option.id)) return 'correct'
    if (selectedIds.includes(option.id)) return 'incorrect'
    return 'neutral'
  }

  const handleSubmit = () => {
    const elapsedMs = Math.max(0, totalMs - remainingMs)
    onSubmit(selectedIds, elapsedMs)
  }

  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border-2 border-medi-border bg-medi-surface/95 shadow-[0_18px_42px_rgba(22,50,62,0.1)] backdrop-blur-sm">
      <div className="p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs font-bold text-medi-petrol/60">
              <span>Question {question.questionIndex + 1} / {question.totalQuestions}</span>
              <span>{progressPct}% franchi</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-medi-border">
              <div className="h-full rounded-full bg-medi-green-sage transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          {phase === 'open' && <CountdownRing remainingMs={remainingMs} totalMs={totalMs} />}
        </div>

        <h2 className="mb-1 mt-5 text-xl font-extrabold leading-snug tracking-tight text-medi-petrol">
          « {question.text} »
        </h2>
        {phase === 'open' && !hasAnswered && (
          <p className="mb-5 text-xs font-semibold text-medi-petrol/45">Touche une réponse pour verrouiller ton choix.</p>
        )}
        {(phase !== 'open' || hasAnswered) && <div className="mb-5" />}

        <div className="grid grid-cols-2 gap-3">
          {question.options.map((option, index) => {
            const isLastOdd = question.options.length % 2 === 1 && index === question.options.length - 1
            return (
              <OptionButton
                key={option.id}
                text={option.text}
                letter={LETTERS[index]}
                colorIndex={index}
                selected={selectedIds.includes(option.id)}
                disabled={hasAnswered || phase !== 'open'}
                state={optionState(option)}
                onClick={() => toggleOption(option.id)}
                className={isLastOdd ? 'col-span-2' : ''}
              />
            )
          })}
        </div>

        {phase === 'open' && !hasAnswered && (
          <Button
            className="mt-6 w-full"
            disabled={selectedIds.length === 0}
            onClick={handleSubmit}
          >
            Valider ma réponse
          </Button>
        )}

        {hasAnswered && phase === 'open' && (
          <p className="mt-6 text-center text-sm text-medi-petrol/60">
            Réponse envoyée — en attente des autres participants…
          </p>
        )}
      </div>
    </div>
  )
}
