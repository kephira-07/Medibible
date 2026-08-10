import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { connectDB } from '../src/config/db.js'
import User from '../src/models/User.js'

const SALT_ROUNDS = 10

async function main() {
  const [name, email, password, role = 'host'] = process.argv.slice(2)

  if (!name || !email || !password) {
    console.error(
      'Usage : node scripts/createHost.js "Nom complet" email@exemple.com motdepasse [host|admin]'
    )
    process.exit(1)
  }
  if (!['host', 'admin'].includes(role)) {
    console.error('Le rôle doit être "host" ou "admin".')
    process.exit(1)
  }

  await connectDB()

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const normalizedEmail = email.toLowerCase()

  const existing = await User.findOne({ email: normalizedEmail })
  if (existing) {
    existing.name = name
    existing.passwordHash = passwordHash
    existing.role = role
    await existing.save()
    console.log(`Compte mis à jour : ${normalizedEmail} (rôle : ${role})`)
  } else {
    await User.create({ name, email: normalizedEmail, passwordHash, role })
    console.log(`Compte créé : ${normalizedEmail} (rôle : ${role})`)
  }

  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error('Erreur :', err.message)
  process.exit(1)
})
