import { useEffect, useState } from 'react'
import CountdownRing from './CountdownRing.jsx'
import OptionButton from './OptionButton.jsx'
import Button from '../common/Button.jsx'
import { useQuizTimer } from '../../hooks/useQuizTimer.js'

export default function QuestionCard({ question, phase, correctOptionIds, hasAnswered, onSubmit }) {
  const [selectedIds, setSelectedIds] = useState([])
  const remainingMs = useQuizTimer(phase === 'open' ? question.endsAt : null)
  const totalMs = question.timeLimit * 1000

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

  return (
    <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-[#d8cdb3] bg-[#faf5ee]/95 shadow-[0_18px_42px_rgba(26,43,50,0.08)] backdrop-blur-sm">
      <div className="h-2 bg-gradient-to-r from-[#1f2f39] via-[#c9a569] to-[#dfe8e2]" />
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="rounded-full bg-[#f2e8d7] px-3 py-1 text-sm font-semibold text-medi-petrol/75">
            Question {question.questionIndex + 1} / {question.totalQuestions}
          </span>
          {phase === 'open' && <CountdownRing remainingMs={remainingMs} totalMs={totalMs} />}
        </div>

        <h2 className="mb-6 text-xl font-bold tracking-tight text-medi-petrol">{question.text}</h2>

        <div className="flex flex-col gap-3">
          {question.options.map((option, index) => (
            <OptionButton
              key={option.id}
              text={option.text}
              colorIndex={index}
              selected={selectedIds.includes(option.id)}
              disabled={hasAnswered || phase !== 'open'}
              state={optionState(option)}
              onClick={() => toggleOption(option.id)}
            />
          ))}
        </div>

        {phase === 'open' && !hasAnswered && (
          <Button
            className="mt-6 w-full"
            disabled={selectedIds.length === 0}
            onClick={() => onSubmit(selectedIds)}
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
