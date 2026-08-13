import mongoose from 'mongoose'

// Une réponse soumise par un participant à une question donnée d'une session live.
// Sert à la fois d'audit (rejouer/vérifier le classement) et de garde-fou contre
// les doubles soumissions (index unique ci-dessous).
const ScoreSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    questionIndex: { type: Number, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    participantKey: { type: String, required: true, index: true },
    displayName: { type: String, required: true, trim: true },
    selectedOptionIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    isCorrect: { type: Boolean, required: true },
    answeredAt: { type: Date, required: true },
    timeTakenMs: { type: Number, required: true, min: 0 },
    pointsEarned: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
)

ScoreSchema.index({ session: 1, questionIndex: 1, participantKey: 1 }, { unique: true })

export default mongoose.model('Score', ScoreSchema)
