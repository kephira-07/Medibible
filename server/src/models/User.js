import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'player'], default: 'player' },
    // Vrai tant que le compte utilise encore le mot de passe d'amorçage
    // (ADMIN_EMAIL/ADMIN_PASSWORD côté serveur) — force un changement de mot
    // de passe à la première connexion pour que ce mot de passe, connu du
    // développeur qui l'a configuré, cesse de fonctionner une fois changé.
    mustChangePassword: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export default mongoose.model('User', UserSchema)
