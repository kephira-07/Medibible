import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { connectDB } from '../src/config/db.js'
import User from '../src/models/User.js'

const SALT_ROUNDS = 10

// `--temporaire` : le mot de passe donné ici ne sert qu'à ouvrir la porte une
// fois. Le compte est marqué `mustChangePassword`, et RequireAuth bloque alors
// tout le back-office tant que la personne n'a pas choisi le sien
// (voir client/src/components/common/RequireAuth.jsx).
//
// C'est le mode à utiliser quand on crée le compte pour quelqu'un d'autre :
// sans lui, le mot de passe tapé dans cette commande resterait le mot de passe
// définitif de l'animateur, alors qu'il a transité par un terminal et par
// l'historique du shell.
const TEMP_FLAG = '--temporaire'

async function main() {
  const argv = process.argv.slice(2)
  const motDePasseTemporaire = argv.includes(TEMP_FLAG)
  const [name, email, password, role = 'player'] = argv.filter((arg) => arg !== TEMP_FLAG)

  if (!name || !email || !password) {
    console.error(
      `Usage : node scripts/createHost.js "Nom complet" email@exemple.com motdepasse [player|admin] [${TEMP_FLAG}]`
    )
    console.error('')
    console.error(`  ${TEMP_FLAG}  le mot de passe est provisoire : la personne devra`)
    console.error('                en choisir un autre à sa première connexion.')
    process.exit(1)
  }
  if (!['player', 'admin'].includes(role)) {
    console.error('Le rôle doit être "player" ou "admin".')
    process.exit(1)
  }
  // Même règle que l'API (validateAuthInput) : inutile de créer ici un compte
  // dont le mot de passe serait refusé à la connexion.
  if (password.length < 8) {
    console.error('Le mot de passe doit contenir au moins 8 caractères.')
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
    existing.mustChangePassword = motDePasseTemporaire
    await existing.save()
    console.log(`Compte mis à jour : ${normalizedEmail} (rôle : ${role})`)
  } else {
    await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role,
      mustChangePassword: motDePasseTemporaire,
    })
    console.log(`Compte créé : ${normalizedEmail} (rôle : ${role})`)
  }

  if (motDePasseTemporaire) {
    console.log('')
    console.log('Mot de passe PROVISOIRE : la première connexion imposera')
    console.log("d'en choisir un nouveau avant d'accéder au back-office.")
  } else {
    console.log('')
    console.log('Mot de passe DÉFINITIF : aucun changement ne sera demandé.')
    console.log(`Ajoutez ${TEMP_FLAG} si vous vouliez un mot de passe provisoire.`)
  }

  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error('Erreur :', err.message)
  process.exit(1)
})
