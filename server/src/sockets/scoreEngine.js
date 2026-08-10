// Score = Base + (tempsRestant / tempsTotal) * Bonus, uniquement si la réponse
// est exacte : toutes les bonnes options cochées, et aucune mauvaise.
export function computeAnswerResult({ question, selectedOptionIds, endsAt, answeredAt, scoring }) {
  const correctIds = question.options.filter((o) => o.isCorrect).map((o) => o._id.toString())
  const selectedIds = [...new Set((selectedOptionIds || []).map(String))]

  const isCorrect =
    selectedIds.length === correctIds.length && correctIds.every((id) => selectedIds.includes(id))

  if (!isCorrect) {
    return { isCorrect: false, pointsEarned: 0 }
  }

  const totalMs = question.timeLimit * 1000
  const remainingMs = Math.max(0, endsAt - answeredAt)
  const ratio = totalMs > 0 ? remainingMs / totalMs : 0
  const pointsEarned = Math.round(scoring.base + ratio * scoring.speedBonus)

  return { isCorrect: true, pointsEarned }
}
