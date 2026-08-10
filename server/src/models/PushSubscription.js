import mongoose from 'mongoose'

// Abonnement Web Push (Push API) d'un navigateur/appareil, utilisé pour
// envoyer les rappels avant le démarrage d'un quiz live.
const PushSubscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true }
)

export default mongoose.model('PushSubscription', PushSubscriptionSchema)
