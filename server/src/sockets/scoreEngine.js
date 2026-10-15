import { DEFAULT_BASE_SCORE } from '../utils/constants.js'

// Une bonne réponse vaut les points de la question, à l'identique pour tout
// le monde. Une réponse n'est exacte que si toutes les bonnes options sont
// cochées et aucune mauvaise.
//
// Il n'y a volontairement AUCUN bonus de vitesse. La formule précédente
// ajoutait `(tempsRestant / tempsTotal) * bonus` : avec les valeurs par
// défaut (100 points, 100 de bonus), deux joueurs donnant la même bonne
// réponse marquaient 198 points à une seconde et 100 points à la dernière —
// du simple au double. L'écart n'était expliqué nulle part dans l'interface
// et passait pour une erreur de calcul. Pour moduler la valeur d'une
// question, c'est son champ `points` qu'on ajuste dans l'éditeur.
export function computeAnswerResult({ question, selectedOptionIds, scoring }) {
  const correctIds = question.options.filter((o) => o.isCorrect).map((o) => o._id.toString())
  const selectedIds = [...new Set((selectedOptionIds || []).map(String))]

  const isCorrect =
    selectedIds.length === correctIds.length && correctIds.every((id) => selectedIds.includes(id))

  if (!isCorrect) {
    return { isCorrect: false, pointsEarned: 0 }
  }

  const basePoints = question.points ?? scoring?.base ?? DEFAULT_BASE_SCORE

  return { isCorrect: true, pointsEarned: Math.round(basePoints) }
}
