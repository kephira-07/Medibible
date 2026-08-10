import mongoose from 'mongoose'
import {
  QUESTION_MIN_OPTIONS,
  QUESTION_MAX_OPTIONS,
  DEFAULT_TIME_LIMIT_SECONDS,
} from '../utils/constants.js'

// Une option de réponse — pas de champ "catégorie" par choix, conformément au cahier des charges
const OptionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    isCorrect: { type: Boolean, required: true, default: false },
  },
  { _id: true }
)

// Sous-document embarqué dans Quiz.questions — pas de collection dédiée,
// les questions n'existent pas indépendamment d'un quiz.
const QuestionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    options: {
      type: [OptionSchema],
      validate: [
        {
          validator: (opts) =>
            opts.length >= QUESTION_MIN_OPTIONS && opts.length <= QUESTION_MAX_OPTIONS,
          message: `Une question doit avoir entre ${QUESTION_MIN_OPTIONS} et ${QUESTION_MAX_OPTIONS} options.`,
        },
        {
          // Le nombre de bonnes réponses est flexible (1, 2, 3 ou toutes) mais
          // il en faut au moins une, sinon la question n'est pas jouable.
          validator: (opts) => opts.some((o) => o.isCorrect),
          message: 'Une question doit avoir au moins une bonne réponse.',
        },
      ],
      required: true,
    },
    timeLimit: { type: Number, default: DEFAULT_TIME_LIMIT_SECONDS, min: 5 },
    // Référence biblique explicative affichée après la question, ex: "Matthieu 14:29"
    bibleReference: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
)

export default QuestionSchema
