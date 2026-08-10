import mongoose from 'mongoose'
import QuestionSchema from './Question.js'
import { DEFAULT_BASE_SCORE, DEFAULT_SPEED_BONUS } from '../utils/constants.js'

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
    // Paramètres de la formule de score : Base + (tempsRestant/tempsTotal) * Bonus
    scoring: {
      base: { type: Number, default: DEFAULT_BASE_SCORE },
      speedBonus: { type: Number, default: DEFAULT_SPEED_BONUS },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  },
  { timestamps: true }
)

export default mongoose.model('Quiz', QuizSchema)
