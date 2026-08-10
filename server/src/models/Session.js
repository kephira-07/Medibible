import mongoose from 'mongoose'

// Un participant tel qu'il apparaît dans une session live (snapshot léger,
// distinct du User pour supporter les invités sans compte)
const ParticipantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    displayName: { type: String, required: true, trim: true },
    socketId: { type: String, default: null },
    totalScore: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const SessionSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    accessCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    status: { type: String, enum: ['lobby', 'live', 'ended'], default: 'lobby' },
    currentQuestionIndex: { type: Number, default: -1 },
    // 'open' = accepte les réponses, 'closed' = résultats affichés en attendant
    // que l'hôte clique sur "question suivante"
    questionPhase: { type: String, enum: ['idle', 'open', 'closed'], default: 'idle' },
    // Source de vérité du chrono : timestamps serveur, jamais un compteur côté client
    currentQuestionStartedAt: { type: Date, default: null },
    currentQuestionEndsAt: { type: Date, default: null },
    participants: { type: [ParticipantSchema], default: [] },
  },
  { timestamps: true }
)

export default mongoose.model('Session', SessionSchema)
