import mongoose from 'mongoose'

const RefreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('RefreshToken', RefreshTokenSchema)
