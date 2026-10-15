import mongoose from 'mongoose'
import QuestionSchema from './Question.js'
import { DEFAULT_BASE_SCORE } from '../utils/constants.js'

const QuizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    questions: {
      type: [QuestionSchema],
      validate: {
        validator: (qs) => qs.length > 0,
        message: 'Un quiz doit contenir au moins une question.',
      },
    },
    // Valeur par défaut d'une bonne réponse, utilisée uniquement pour une
    // question qui n'a pas son propre champ `points`. Il n'y a pas de bonus
    // de vitesse : le score ne dépend pas du temps de réponse.
    scoring: {
      base: { type: Number, default: DEFAULT_BASE_SCORE },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  },
  { timestamps: true }
)

export default mongoose.model('Quiz', QuizSchema)
