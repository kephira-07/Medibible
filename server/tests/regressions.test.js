// Tests ciblés sur deux comportements soupçonnés depuis le code client :
//  - « Dupliquer une question » renvoie les mêmes _id de sous-documents
//  - le rate limit global est atteint par le simple polling du dashboard admin
const TEST_DB_NAME = 'medibible_e2e_test'
let mongod = null
let testUri = process.env.TEST_MONGO_URI || ''

if (!testUri) {
  const { MongoMemoryServer } = await import('mongodb-memory-server')
  mongod = await MongoMemoryServer.create()
  testUri = mongod.getUri(TEST_DB_NAME)
}
if (!testUri.includes(TEST_DB_NAME)) {
  throw new Error(`TEST_MONGO_URI doit pointer vers la base ${TEST_DB_NAME}.`)
}

process.env.MONGO_URI = testUri
process.env.JWT_SECRET = 'test-secret'
process.env.ADMIN_EMAIL = 'admin2@test.app'
process.env.ADMIN_PASSWORD = 'admin-bootstrap-pass'
process.env.NODE_ENV = 'test'

const { createServer } = await import('http')
const { createApp } = await import('../src/app.js')
const { connectDB } = await import('../src/config/db.js')
const mongoose = (await import('mongoose')).default

await connectDB()
const httpServer = createServer(createApp())
await new Promise((r) => httpServer.listen(0, r))
const base = `http://127.0.0.1:${httpServer.address().port}`

let passed = 0
const failures = []
function check(name, condition, detail = '') {
  if (condition) {
    passed += 1
    console.log(`  PASS  ${name}`)
  } else {
    failures.push(`${name}${detail ? ` -- ${detail}` : ''}`)
    console.log(`  FAIL  ${name}${detail ? ` -- ${detail}` : ''}`)
  }
}
async function req(method, path, { token, body } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  return { status: res.status, data }
}

const login = await req('POST', '/api/auth/login', {
  body: { email: 'admin2@test.app', password: 'admin-bootstrap-pass' },
})
const token = login.data?.token

console.log('\n== Dupliquer une question dans l editeur')
{
  const created = await req('POST', '/api/quizzes', {
    token,
    body: {
      title: 'Duplication',
      questions: [
        {
          text: 'Question originale',
          timeLimit: 10,
          options: [
            { text: 'Vrai', isCorrect: true },
            { text: 'Faux', isCorrect: false },
          ],
        },
      ],
    },
  })
  const quiz = created.data
  // Exactement ce que fait QuizForm.duplicateQuestion : copie superficielle,
  // les _id de la question et des options sont conserves tels quels.
  const original = quiz.questions[0]
  const copy = { ...original, options: original.options.map((o) => ({ ...o })) }
  const put = await req('PUT', `/api/quizzes/${quiz._id}`, {
    token,
    body: { questions: [original, copy] },
  })

  check(
    'dupliquer une question est refuse ou genere de nouveaux _id',
    put.status >= 400 ||
      (put.data?.questions?.[0]?._id !== put.data?.questions?.[1]?._id &&
        put.data?.questions?.[0]?.options?.[0]?._id !== put.data?.questions?.[1]?.options?.[0]?._id),
    `HTTP ${put.status} ; question _id identiques = ${
      put.data?.questions?.[0]?._id === put.data?.questions?.[1]?._id
    } ; option _id identiques = ${
      put.data?.questions?.[0]?.options?.[0]?._id === put.data?.questions?.[1]?.options?.[0]?._id
    } -> deux options distinctes partagent le meme identifiant, le scoring ne peut plus les distinguer`
  )
  await req('DELETE', `/api/quizzes/${quiz._id}`, { token })
}

console.log('\n== Rate limit global (200 requetes / 15 min, toutes IP confondues)')
{
  // Le dashboard admin appelle /sessions + /sessions/admin/winners toutes les
  // 8 s => 15 requetes/min => 225 requetes en 15 min, au-dessus du plafond.
  let firstBlockedAt = null
  for (let i = 1; i <= 230; i += 1) {
    // Pas /api/health : il est volontairement exempte du plafond, donc il ne
    // mesurerait rien. On tape une route 404 sans acces base.
    const r = await req('GET', '/api/inconnu')
    if (r.status === 429) {
      firstBlockedAt = i
      break
    }
  }
  check(
    'le plafond de requetes laisse passer plus de 15 min de dashboard admin (>225)',
    firstBlockedAt === null || firstBlockedAt > 225,
    `premiere reponse 429 a la requete n°${firstBlockedAt} -> le dashboard admin (15 req/min) se bloque tout seul en ~${Math.round(
      (firstBlockedAt || 0) / 15
    )} min, et le plafond est partage par tous les joueurs derriere la meme IP`
  )
}

console.log(`\n${'='.repeat(72)}`)
console.log(`${passed} test(s) reussi(s), ${failures.length} echec(s)`)
failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`))
console.log('='.repeat(72))

if (mongoose.connection.name === TEST_DB_NAME) {
  await mongoose.connection.dropDatabase()
}
await mongoose.disconnect()
httpServer.close()
if (mongod) await mongod.stop()
process.exit(failures.length ? 1 : 0)
