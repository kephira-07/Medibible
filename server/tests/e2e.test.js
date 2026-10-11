// Suite de tests end-to-end : API REST (back-office admin) + temps reel
// (socket.io, parcours joueur). Lancer avec : npm test
// Base de test dediee. Par defaut on tente un mongod en memoire ; si le
// binaire n'est pas disponible (machine hors ligne), on retombe sur
// TEST_MONGO_URI -- qui doit pointer vers une base *distincte* de la base de
// production : la suite la supprime entierement a la fin.
const TEST_DB_NAME = 'medibible_e2e_test'
let mongod = null
let testUri = process.env.TEST_MONGO_URI || ''

if (!testUri) {
  const { MongoMemoryServer } = await import('mongodb-memory-server')
  mongod = await MongoMemoryServer.create()
  testUri = mongod.getUri(TEST_DB_NAME)
}

if (!testUri.includes(TEST_DB_NAME)) {
  throw new Error(`TEST_MONGO_URI doit pointer vers la base ${TEST_DB_NAME}, pas vers la base de production.`)
}

process.env.MONGO_URI = testUri
process.env.JWT_SECRET = 'test-secret'
process.env.ADMIN_EMAIL = 'admin@test.app'
process.env.ADMIN_PASSWORD = 'admin-bootstrap-pass'
process.env.NODE_ENV = 'test'

const { createServer } = await import('http')
const { createApp } = await import('../src/app.js')
const { initSocket } = await import('../src/sockets/index.js')
const { connectDB } = await import('../src/config/db.js')
const mongoose = (await import('mongoose')).default
const { io: ioClient } = await import('socket.io-client')
const Session = (await import('../src/models/Session.js')).default
const Score = (await import('../src/models/Score.js')).default
const User = (await import('../src/models/User.js')).default
const bcrypt = (await import('bcryptjs')).default
const jwt = (await import('jsonwebtoken')).default

await connectDB()
const app = createApp()
const httpServer = createServer(app)
initSocket(httpServer)
await new Promise((r) => httpServer.listen(0, r))
const base = `http://127.0.0.1:${httpServer.address().port}`

// ---------------------------------------------------------------- utilitaires
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
function section(title) {
  console.log(`\n== ${title}`)
}
async function req(method, path, { token, body } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  let data = null
  const text = await res.text()
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  return { status: res.status, data }
}
function connectSocket(token) {
  const socket = ioClient(base, {
    transports: ['polling'],
    upgrade: false,
    auth: token ? { token } : {},
    forceNew: true,
  })
  return new Promise((resolve, reject) => {
    socket.once('connect', () => resolve(socket))
    socket.once('connect_error', (e) => reject(new Error(`connect_error: ${e.message}`)))
    setTimeout(() => reject(new Error('timeout de connexion socket')), 5000)
  })
}
function emitAck(socket, event, payload, ms = 5000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`pas d'ack pour ${event}`)), ms)
    socket.emit(event, payload, (res) => {
      clearTimeout(t)
      resolve(res)
    })
  })
}
function waitEvent(socket, event, ms = 5000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`evenement ${event} jamais recu`)), ms)
    socket.once(event, (p) => {
      clearTimeout(t)
      resolve(p)
    })
  })
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const openSockets = []
async function socketFor(token) {
  const s = await connectSocket(token)
  openSockets.push(s)
  return s
}

// ------------------------------------------------------------------- 1. sante
section('Sante & routage')
{
  const health = await req('GET', '/api/health')
  check('GET /api/health repond 200 ok', health.status === 200 && health.data?.status === 'ok')
  const unknown = await req('GET', '/api/inconnu')
  check('route API inconnue -> 404 JSON', unknown.status === 404, `recu ${unknown.status}`)
}

// --------------------------------------------------------------- 2. auth admin
section('Authentification admin')
let adminToken
let adminRefresh
{
  const bad = await req('POST', '/api/auth/login', {
    body: { email: 'admin@test.app', password: 'mauvais-mot-de-passe' },
  })
  check('login avec mauvais mot de passe -> 401', bad.status === 401, `recu ${bad.status}`)

  const shortPw = await req('POST', '/api/auth/login', {
    body: { email: 'admin@test.app', password: 'court' },
  })
  check('login avec mot de passe trop court -> 400', shortPw.status === 400, `recu ${shortPw.status}`)

  const ok = await req('POST', '/api/auth/login', {
    body: { email: 'admin@test.app', password: 'admin-bootstrap-pass' },
  })
  check('login admin via ADMIN_EMAIL/ADMIN_PASSWORD -> 200', ok.status === 200, JSON.stringify(ok.data))
  check('le compte amorce exige un changement de mot de passe', ok.data?.user?.mustChangePassword === true)
  check('role admin attribue', ok.data?.user?.role === 'admin')
  adminToken = ok.data?.token
  adminRefresh = ok.data?.refreshToken

  const me = await req('GET', '/api/auth/me', { token: adminToken })
  check('GET /api/auth/me avec token -> 200', me.status === 200)
  const meNoToken = await req('GET', '/api/auth/me')
  check('GET /api/auth/me sans token -> 401', meNoToken.status === 401)
  const meBadToken = await req('GET', '/api/auth/me', { token: 'pas-un-jwt' })
  check('GET /api/auth/me avec token bidon -> 401', meBadToken.status === 401)

  const refreshed = await req('POST', '/api/auth/refresh', { body: { refreshToken: adminRefresh } })
  check('refresh token valide -> nouveau couple de tokens', refreshed.status === 200 && Boolean(refreshed.data?.token))
  const replay = await req('POST', '/api/auth/refresh', { body: { refreshToken: adminRefresh } })
  check('rejouer un refresh token deja consomme -> 401', replay.status === 401, `recu ${replay.status}`)
  adminToken = refreshed.data?.token
  adminRefresh = refreshed.data?.refreshToken
}

// ------------------------------------------------- 3. escalade de privileges
section('Cloisonnement des roles')
let playerToken
{
  const reg = await req('POST', '/api/auth/register', {
    body: { name: 'Joueur Test', email: 'joueur@test.app', password: 'motdepasse-joueur', role: 'admin' },
  })
  check('register public -> 201', reg.status === 201, JSON.stringify(reg.data))
  check(
    'register ignore role:admin envoye dans le body',
    reg.data?.user?.role === 'player',
    `role = ${reg.data?.user?.role}`
  )
  playerToken = reg.data?.token

  const quizzesAsPlayer = await req('GET', '/api/quizzes', { token: playerToken })
  check(
    'un joueur ne peut pas lister les quiz (reponses exposees) -> 403',
    quizzesAsPlayer.status === 403,
    `recu ${quizzesAsPlayer.status}`
  )
  const sessionsAsPlayer = await req('GET', '/api/sessions', { token: playerToken })
  check('un joueur ne peut pas lister les sessions -> 403', sessionsAsPlayer.status === 403, `recu ${sessionsAsPlayer.status}`)
  const onlineAsPlayer = await req('GET', '/api/sessions/admin/online', { token: playerToken })
  check('un joueur ne peut pas voir les connectes -> 403', onlineAsPlayer.status === 403, `recu ${onlineAsPlayer.status}`)
  const quizzesAnon = await req('GET', '/api/quizzes')
  check('anonyme ne peut pas lister les quiz -> 401', quizzesAnon.status === 401)
}

// ------------------------------------------------------- 4. CRUD quiz (admin)
section('Back-office : CRUD quiz')
let quizId
{
  const noTitle = await req('POST', '/api/quizzes', { token: adminToken, body: { questions: [] } })
  check('creer un quiz sans titre -> 400', noTitle.status === 400, `recu ${noTitle.status}`)

  const noQuestion = await req('POST', '/api/quizzes', { token: adminToken, body: { title: 'Vide' } })
  check('creer un quiz sans question -> 400', noQuestion.status === 400, `recu ${noQuestion.status}`)

  const oneOption = await req('POST', '/api/quizzes', {
    token: adminToken,
    body: { title: 'Mono', questions: [{ text: 'Q', options: [{ text: 'A', isCorrect: true }] }] },
  })
  check('question avec une seule option -> 400', oneOption.status === 400, `recu ${oneOption.status}`)

  const fiveOptions = await req('POST', '/api/quizzes', {
    token: adminToken,
    body: {
      title: 'Cinq',
      questions: [{ text: 'Q', options: [1, 2, 3, 4, 5].map((i) => ({ text: `O${i}`, isCorrect: i === 1 })) }],
    },
  })
  check('question avec 5 options (max 4) -> 400', fiveOptions.status === 400, `recu ${fiveOptions.status}`)

  const noCorrect = await req('POST', '/api/quizzes', {
    token: adminToken,
    body: {
      title: 'Sans bonne reponse',
      questions: [
        {
          text: 'Q',
          options: [
            { text: 'A', isCorrect: false },
            { text: 'B', isCorrect: false },
          ],
        },
      ],
    },
  })
  check('question sans bonne reponse -> 400', noCorrect.status === 400, `recu ${noCorrect.status}`)

  const negativeTime = await req('POST', '/api/quizzes', {
    token: adminToken,
    body: {
      title: 'Chrono negatif',
      questions: [
        {
          text: 'Q',
          timeLimit: -10,
          options: [
            { text: 'A', isCorrect: true },
            { text: 'B', isCorrect: false },
          ],
        },
      ],
    },
  })
  check('timeLimit negatif refuse -> 400', negativeTime.status === 400, `recu ${negativeTime.status}`)

  const created = await req('POST', '/api/quizzes', {
    token: adminToken,
    body: {
      title: '  Quiz de test  ',
      description: 'Parcours complet',
      scoring: { base: 100, speedBonus: 100 },
      questions: [
        {
          text: "Qui a marche sur l'eau ?",
          timeLimit: 5,
          points: 100,
          bibleReference: 'Matthieu 14:29',
          options: [
            { text: 'Pierre', isCorrect: true },
            { text: 'Paul', isCorrect: false },
            { text: 'Jean', isCorrect: false },
          ],
        },
        {
          text: 'Quelles sont les deux premieres lettres ?',
          timeLimit: 5,
          points: 50,
          options: [
            { text: 'A', isCorrect: true },
            { text: 'B', isCorrect: true },
            { text: 'C', isCorrect: false },
          ],
        },
      ],
    },
  })
  check('creer un quiz valide -> 201', created.status === 201, JSON.stringify(created.data)?.slice(0, 300))
  check('le titre est nettoye (trim)', created.data?.title === 'Quiz de test', `titre = "${created.data?.title}"`)
  check(
    'createdBy renseigne sur le quiz cree',
    Boolean(created.data?.createdBy),
    'createdBy absent -> impossible de filtrer "mes quiz" / de verifier le proprietaire'
  )
  quizId = created.data?._id

  const badId = await req('GET', '/api/quizzes/pas-un-objectid', { token: adminToken })
  check('GET quiz avec id invalide -> 400', badId.status === 400, `recu ${badId.status}`)
  const missing = await req('GET', `/api/quizzes/${'a'.repeat(24)}`, { token: adminToken })
  check('GET quiz inexistant -> 404', missing.status === 404, `recu ${missing.status}`)

  const bank = await req('GET', '/api/quizzes/bank/questions', { token: adminToken })
  check(
    'banque de questions renvoie les 2 questions',
    Array.isArray(bank.data) && bank.data.length === 2,
    `${bank.data?.length} elements`
  )
  const bankSearch = await req('GET', `/api/quizzes/bank/questions?q=${encodeURIComponent('lettres')}`, {
    token: adminToken,
  })
  check('recherche dans la banque filtre correctement', bankSearch.data?.length === 1, `${bankSearch.data?.length} elements`)

  const updated = await req('PUT', `/api/quizzes/${quizId}`, { token: adminToken, body: { status: 'published' } })
  check('publier un quiz (PUT status) -> 200', updated.status === 200 && updated.data?.status === 'published')
  const emptyQuestions = await req('PUT', `/api/quizzes/${quizId}`, { token: adminToken, body: { questions: [] } })
  check('PUT avec questions vides -> 400', emptyQuestions.status === 400, `recu ${emptyQuestions.status}`)
  const badStatus = await req('PUT', `/api/quizzes/${quizId}`, { token: adminToken, body: { status: 'nimporte-quoi' } })
  check(
    'PUT avec status inconnu ne degrade pas silencieusement le quiz',
    badStatus.status === 400,
    `recu ${badStatus.status}, status devenu "${badStatus.data?.status}" -> un quiz publie repasse en brouillon sans avertir`
  )
  await req('PUT', `/api/quizzes/${quizId}`, { token: adminToken, body: { status: 'published' } })
}

// ---------------------------------------------- 5. isolement entre admins
section('Isolement entre deux admins')
{
  await User.create({
    name: 'Autre Admin',
    email: 'autre@test.app',
    passwordHash: await bcrypt.hash('autre-mot-de-passe', 10),
    role: 'admin',
  })
  const other = await req('POST', '/api/auth/login', {
    body: { email: 'autre@test.app', password: 'autre-mot-de-passe' },
  })
  const otherToken = other.data?.token

  const edit = await req('PUT', `/api/quizzes/${quizId}`, { token: otherToken, body: { title: 'Detourne' } })
  check(
    "un autre admin ne peut pas modifier le quiz d'un collegue",
    edit.status === 403 || edit.status === 404,
    `recu ${edit.status} -> titre devenu "${edit.data?.title}"`
  )
  if (edit.data?.title === 'Detourne') {
    await req('PUT', `/api/quizzes/${quizId}`, { token: adminToken, body: { title: 'Quiz de test' } })
  }
}

// ---------------------------------------------------- 6. creation de session
section('Creation de session')
let sessionId
let accessCode
{
  const noQuiz = await req('POST', '/api/sessions', { token: adminToken, body: {} })
  check('creer une session sans quizId -> 400', noQuiz.status === 400, `recu ${noQuiz.status}`)
  const unknownQuiz = await req('POST', '/api/sessions', { token: adminToken, body: { quizId: 'b'.repeat(24) } })
  check('creer une session sur un quiz inexistant -> 404', unknownQuiz.status === 404, `recu ${unknownQuiz.status}`)
  const asPlayer = await req('POST', '/api/sessions', { token: playerToken, body: { quizId } })
  check('un joueur ne peut pas creer de session -> 403', asPlayer.status === 403, `recu ${asPlayer.status}`)

  const s = await req('POST', '/api/sessions', { token: adminToken, body: { quizId } })
  check('creer une session -> 201', s.status === 201, JSON.stringify(s.data)?.slice(0, 200))
  sessionId = s.data?._id
  accessCode = s.data?.accessCode
  check("code d'acces a 6 caracteres non ambigus", /^[A-HJ-NP-Z2-9]{6}$/.test(accessCode || ''), `code = ${accessCode}`)
  check('session creee en lobby', s.data?.status === 'lobby')

  const byCode = await req('GET', `/api/sessions/${accessCode}`)
  check('GET /api/sessions/:code public -> 200', byCode.status === 200, `recu ${byCode.status}`)
  check("le code public n'expose pas les questions", !JSON.stringify(byCode.data).includes('isCorrect'))
  const lower = await req('GET', `/api/sessions/${accessCode.toLowerCase()}`)
  check('code en minuscules accepte', lower.status === 200, `recu ${lower.status}`)
  const badCode = await req('GET', '/api/sessions/ZZZZZZ')
  check('code inexistant -> 404', badCode.status === 404, `recu ${badCode.status}`)
  const shortCode = await req('GET', '/api/sessions/ABC')
  check('code mal forme -> 400', shortCode.status === 400, `recu ${shortCode.status}`)

  const detail = await req('GET', `/api/sessions/admin/${sessionId}`, { token: adminToken })
  check('detail de session (admin) -> 200', detail.status === 200, `recu ${detail.status}`)
  const detailAnon = await req('GET', `/api/sessions/admin/${sessionId}`)
  check('detail de session sans token -> 401', detailAnon.status === 401)
  const detailAsPlayer = await req('GET', `/api/sessions/admin/${sessionId}`, { token: playerToken })
  check('detail de session pour un joueur -> 403', detailAsPlayer.status === 403, `recu ${detailAsPlayer.status}`)
}

// ------------------------------------------------------- 7. parcours joueur
section('Parcours joueur temps reel')
let hostSocket
let p1
let p2
{
  hostSocket = await socketFor(adminToken)
  p1 = await socketFor(null)
  p2 = await socketFor(null)

  const hostJoin = await emitAck(hostSocket, 'session:join', { accessCode, displayName: 'Animateur' })
  check("l'animateur rejoint sa session et est reconnu hote", hostJoin?.isHost === true, JSON.stringify(hostJoin)?.slice(0, 200))

  const noBerger = await emitAck(p1, 'session:join', { accessCode, displayName: 'Alice' })
  check('rejoindre sans berger -> refuse', Boolean(noBerger?.error), JSON.stringify(noBerger)?.slice(0, 150))

  const noName = await emitAck(p1, 'session:join', { accessCode, bergerName: 'Edwige' })
  check('rejoindre sans prenom -> refuse', Boolean(noName?.error))

  const wrongCode = await emitAck(p1, 'session:join', {
    accessCode: 'ZZZZZZ',
    displayName: 'Alice',
    bergerName: 'Edwige',
  })
  check('rejoindre avec un mauvais code -> refuse', Boolean(wrongCode?.error))

  const a = await emitAck(p1, 'session:join', { accessCode, displayName: 'Alice', bergerName: 'Edwige', clientId: 'alice-device' })
  check('Alice rejoint la session', a?.session?.id === sessionId && a?.isHost === false, JSON.stringify(a)?.slice(0, 200))
  check("le payload de join n'expose aucune bonne reponse", !JSON.stringify(a).includes('isCorrect'))

  const b = await emitAck(p2, 'session:join', { accessCode, displayName: 'Bob', bergerName: 'Delali', clientId: 'bob-device' })
  check('Bob rejoint la session', b?.session?.id === sessionId)

  // double join du meme joueur (StrictMode / reconnexion) : pas de doublon
  await emitAck(p1, 'session:join', { accessCode, displayName: 'Alice', bergerName: 'Edwige', clientId: 'alice-device' })
  const sess = await Session.findById(sessionId)
  check('un double join ne cree pas de participant en doublon', sess.participants.length === 2, `${sess.participants.length} participants`)

  // deux joueurs differents qui choisissent le meme prenom
  const twin = await socketFor(null)
  await emitAck(twin, 'session:join', { accessCode, displayName: 'Alice', bergerName: 'Prunelle', clientId: 'autre-alice-device' })
  const sessTwin = await Session.findById(sessionId)
  check(
    'deux joueurs distincts portant le meme prenom sont comptes separement',
    sessTwin.participants.filter((p) => p.displayName === 'Alice').length === 2,
    `${sessTwin.participants.filter((p) => p.displayName === 'Alice').length} entree(s) "Alice" -> le 2e joueur ecrase le 1er`
  )
  twin.disconnect()
  await sleep(200)
  // on remet le socketId d'Alice a jour pour la suite du scenario
  await emitAck(p1, 'session:join', { accessCode, displayName: 'Alice', bergerName: 'Edwige', clientId: 'alice-device' })

  // un joueur ne peut pas piloter le quiz
  const hijack = await emitAck(p1, 'host:nextQuestion', { sessionId })
  check('un joueur ne peut pas lancer la question suivante', Boolean(hijack?.error), JSON.stringify(hijack))
  const hijackEnd = await emitAck(p1, 'host:endSession', { sessionId })
  check('un joueur ne peut pas terminer la session', Boolean(hijackEnd?.error))
}

// ------------------------------------------- 8. question 1 : score & chrono
section('Question 1 : reponses, score et chrono')
{
  const q1p1 = waitEvent(p1, 'quiz:questionStarted')
  const q1p2 = waitEvent(p2, 'quiz:questionStarted')
  const adv = await emitAck(hostSocket, 'host:nextQuestion', { sessionId })
  check("l'animateur ouvre la question 1", adv?.phase === 'open', JSON.stringify(adv))

  const q1 = await q1p1
  await q1p2
  check('la question diffusee ne contient pas isCorrect', !JSON.stringify(q1).includes('isCorrect'))
  check('la question diffusee porte startedAt/endsAt serveur', Number.isFinite(q1.startedAt) && Number.isFinite(q1.endsAt))
  check('totalQuestions transmis au client', q1.totalQuestions === 2, `recu ${q1.totalQuestions}`)

  const correctId = String(q1.options[0].id)
  const wrongId = String(q1.options[1].id)

  const r1 = await emitAck(p1, 'player:submitAnswer', { sessionId, selectedOptionIds: [correctId] })
  check('Alice repond juste -> points > 100', r1?.isCorrect === true && r1?.pointsEarned > 100, JSON.stringify(r1))

  const dup = await emitAck(p1, 'player:submitAnswer', { sessionId, selectedOptionIds: [wrongId] })
  check("deuxieme reponse d'Alice refusee (anti double-reponse)", Boolean(dup?.error), JSON.stringify(dup))

  const r2 = await emitAck(p2, 'player:submitAnswer', { sessionId, selectedOptionIds: [wrongId] })
  check('Bob repond faux -> 0 point', r2?.isCorrect === false && r2?.pointsEarned === 0, JSON.stringify(r2))

  const fake = await emitAck(p2, 'player:submitAnswer', { sessionId: 'c'.repeat(24), selectedOptionIds: [correctId] })
  check('repondre sur une session inexistante -> refuse', Boolean(fake?.error))

  const ended = await waitEvent(p1, 'quiz:questionEnded', 9000)
  check("la question se clot automatiquement a l'echeance", Array.isArray(ended?.correctOptionIds))
  check('les bonnes reponses sont revelees a la cloture', ended.correctOptionIds.map(String).includes(correctId))
  check('la reference biblique est transmise a la cloture', ended?.bibleReference === 'Matthieu 14:29', `recu "${ended?.bibleReference}"`)
  check('answeredCount = 2 a la cloture', ended?.answeredCount === 2, `recu ${ended?.answeredCount}`)
  check('le classement est transmis a la cloture', Array.isArray(ended?.leaderboard) && ended.leaderboard.length >= 2)
  check('Alice est en tete du classement', ended?.leaderboard?.[0]?.displayName === 'Alice', JSON.stringify(ended?.leaderboard))
  check('les deux homonymes figurent au classement', ended?.leaderboard?.length === 3, `${ended?.leaderboard?.length} entrees`)

  const late = await emitAck(p2, 'player:submitAnswer', { sessionId, selectedOptionIds: [correctId] })
  check('repondre apres la cloture -> refuse', Boolean(late?.error), JSON.stringify(late))
}

// ------------------------- 9. question 2 : reponses multiples
section('Question 2 : reponses multiples')
{
  const q2p = waitEvent(p1, 'quiz:questionStarted')
  await emitAck(hostSocket, 'host:nextQuestion', { sessionId })
  const q2 = await q2p
  check("la question 2 s'ouvre", q2.questionIndex === 1, `index ${q2.questionIndex}`)

  const ids = q2.options.map((o) => String(o.id))
  const [A, B] = ids

  const partial = await emitAck(p2, 'player:submitAnswer', { sessionId, selectedOptionIds: [A] })
  check('reponse partielle (1 bonne sur 2) comptee comme fausse', partial?.isCorrect === false, JSON.stringify(partial))

  const full = await emitAck(p1, 'player:submitAnswer', { sessionId, selectedOptionIds: [A, B] })
  check('reponse multiple complete comptee comme juste', full?.isCorrect === true, JSON.stringify(full))
  check('points bases sur question.points (50) + bonus', full?.pointsEarned >= 50 && full?.pointsEarned <= 150, `${full?.pointsEarned} pts`)

  const scores = await Score.find({ session: sessionId, questionIndex: 1 })
  check('une ligne de Score par joueur et par question', scores.length === 2, `${scores.length} lignes`)

  const sess = await Session.findById(sessionId)
  const alice = sess.participants.find((p) => p.displayName === 'Alice')
  const bob = sess.participants.find((p) => p.displayName === 'Bob')
  const aliceScores = await Score.find({ session: sessionId, displayName: 'Alice' })
  const expectedAlice = aliceScores.reduce((t, s) => t + s.pointsEarned, 0)
  check(
    "totalScore d'Alice = somme de ses lignes de Score",
    alice.totalScore === expectedAlice,
    `totalScore=${alice.totalScore} vs somme=${expectedAlice}`
  )
  check('Bob reste a 0 point', bob.totalScore === 0, `${bob.totalScore} pts`)

  await waitEvent(p1, 'quiz:questionEnded', 9000)
}

// ------------------------------------------------- 10. reponses simultanees
section('Ecritures concurrentes (perte de score)')
{
  const s2 = await req('POST', '/api/sessions', { token: adminToken, body: { quizId } })
  const code2 = s2.data?.accessCode
  const sid2 = s2.data?._id
  const host2 = await socketFor(adminToken)
  await emitAck(host2, 'session:join', { accessCode: code2, displayName: 'Animateur' })

  const players = []
  for (let i = 0; i < 6; i += 1) {
    const s = await socketFor(null)
    await emitAck(s, 'session:join', { accessCode: code2, displayName: `J${i}`, bergerName: 'Edwige', clientId: `device-${i}` })
    players.push(s)
  }

  const started = waitEvent(players[0], 'quiz:questionStarted')
  await emitAck(host2, 'host:nextQuestion', { sessionId: sid2 })
  const q = await started
  const good = String(q.options[0].id)

  // Tous repondent juste exactement en meme temps
  const acks = await Promise.all(
    players.map((s) => emitAck(s, 'player:submitAnswer', { sessionId: sid2, selectedOptionIds: [good] }))
  )
  check(
    'les 6 reponses simultanees sont toutes acceptees',
    acks.every((a) => a?.ok === true),
    JSON.stringify(acks.map((a) => a?.error).filter(Boolean))
  )

  const sess = await Session.findById(sid2)
  const credited = sess.participants.filter((p) => p.totalScore > 0).length
  const scoreRows = await Score.countDocuments({ session: sid2, questionIndex: 0, isCorrect: true })
  check(
    'aucun score perdu lors de 6 reponses simultanees',
    credited === scoreRows,
    `${scoreRows} bonnes reponses enregistrees mais seulement ${credited} participant(s) credite(s) au classement`
  )

  await emitAck(host2, 'host:endSession', { sessionId: sid2 })
}

// ---------------------------------------- 11. reconnexion d'un joueur invite
section("Reconnexion d'un invite")
{
  const s3 = await req('POST', '/api/sessions', { token: adminToken, body: { quizId } })
  const code3 = s3.data?.accessCode
  const sid3 = s3.data?._id
  const host3 = await socketFor(adminToken)
  await emitAck(host3, 'session:join', { accessCode: code3, displayName: 'Animateur' })

  const guest = await socketFor(null)
  await emitAck(guest, 'session:join', { accessCode: code3, displayName: 'Carl', bergerName: 'Pascaline', clientId: 'carl-device' })

  const started = waitEvent(guest, 'quiz:questionStarted')
  await emitAck(host3, 'host:nextQuestion', { sessionId: sid3 })
  const q = await started
  const good = String(q.options[0].id)

  const first = await emitAck(guest, 'player:submitAnswer', { sessionId: sid3, selectedOptionIds: [good] })
  check('Carl repond une premiere fois', first?.ok === true, JSON.stringify(first))

  // Carl perd le reseau et revient (nouveau socket, meme pseudo)
  guest.disconnect()
  await sleep(400)
  const guest2 = await socketFor(null)
  const rejoin = await emitAck(guest2, 'session:join', {
    accessCode: code3,
    displayName: 'Carl',
    bergerName: 'Pascaline',
    clientId: 'carl-device',
  })
  check(
    'la reconnexion signale que Carl a deja repondu a la question en cours',
    rejoin?.alreadyAnswered === true,
    `alreadyAnswered = ${rejoin?.alreadyAnswered} -> le client raffiche le bouton "Valider" sur une question deja jouee`
  )
  const again = await emitAck(guest2, 'player:submitAnswer', { sessionId: sid3, selectedOptionIds: [good] })
  check(
    'apres reconnexion, Carl ne peut pas re-repondre a la meme question',
    Boolean(again?.error),
    `reponse acceptee une 2e fois (+${again?.pointsEarned} pts) -> score cumulable en rechargeant la page`
  )

  const sess = await Session.findById(sid3)
  check('un seul participant "Carl" apres reconnexion', sess.participants.filter((p) => p.displayName === 'Carl').length === 1)

  // presence : apres deconnexion, le joueur ne doit plus etre "en ligne"
  const online = await req('GET', '/api/sessions/admin/online', { token: adminToken })
  const carls = (online.data || []).filter((u) => u.displayName === 'Carl')
  check(
    "un socket deconnecte n'apparait plus dans les connectes",
    carls.length === 1,
    `${carls.length} entree(s) "Carl" en ligne alors qu'un seul socket est ouvert`
  )

  await emitAck(host3, 'host:endSession', { sessionId: sid3 })
}

// -------------------------------------- 12. presence apres deconnexion
section('Presence : liste des connectes')
{
  const s5 = await req('POST', '/api/sessions', { token: adminToken, body: { quizId } })
  const code5 = s5.data?.accessCode
  const sid5 = s5.data?._id
  const g = await socketFor(null)
  await emitAck(g, 'session:join', { accessCode: code5, displayName: 'Ephemere', bergerName: 'Edwige', clientId: 'ephemere-device' })
  g.disconnect()
  await sleep(600)
  const online = await req('GET', '/api/sessions/admin/online', { token: adminToken })
  const ghosts = (online.data || []).filter((u) => String(u.sessionId) === String(sid5))
  check(
    'un joueur parti ne reste pas marque "en ligne"',
    ghosts.length === 0,
    `${ghosts.length} fantome(s) dans /api/sessions/admin/online -> socketId jamais nettoye a la deconnexion`
  )
}

// -------------------------------------------------- 13. fin de session & robustesse
section('Fin de session et robustesse')
{
  const endEvt = waitEvent(p1, 'quiz:sessionEnded')
  const adv = await emitAck(hostSocket, 'host:nextQuestion', { sessionId })
  check('avancer apres la derniere question termine la session', adv?.phase === 'ended', JSON.stringify(adv))
  const payload = await endEvt
  check('le classement final est diffuse', Array.isArray(payload?.leaderboard) && payload.leaderboard.length >= 2)

  const again = await emitAck(hostSocket, 'host:nextQuestion', { sessionId })
  check('avancer une session terminee -> refuse', Boolean(again?.error), JSON.stringify(again))

  const afterEnd = await emitAck(p1, 'player:submitAnswer', { sessionId, selectedOptionIds: [] })
  check('repondre sur une session terminee -> refuse', Boolean(afterEnd?.error))

  const winners = await req('GET', '/api/sessions/admin/winners', { token: adminToken })
  check(
    'la session terminee apparait dans les winners',
    (winners.data || []).some((w) => String(w.sessionId) === String(sessionId)),
    JSON.stringify(winners.data)?.slice(0, 200)
  )
  const winner = (winners.data || []).find((w) => String(w.sessionId) === String(sessionId))
  check('le gagnant est Alice', winner?.winner?.displayName === 'Alice', JSON.stringify(winner?.winner))

  // reactions
  const reactEvt = waitEvent(p2, 'reaction:received')
  const okReact = await emitAck(p1, 'reaction:send', { reaction: 'clap' })
  check('envoyer une reaction valide -> ok', okReact?.ok === true, JSON.stringify(okReact))
  const received = await reactEvt
  check('la reaction est diffusee aux autres joueurs', received?.reaction === 'clap' && received?.displayName === 'Alice')
  const badReact = await emitAck(p1, 'reaction:send', { reaction: '<script>alert(1)</script>' })
  check('reaction hors liste blanche refusee', Boolean(badReact?.error) || badReact?.ok === false, JSON.stringify(badReact))
}

// ------------------------------------- 14. quiz supprime, sessions orphelines
section('Quiz supprime alors que des sessions y pointent')
{
  const s4 = await req('POST', '/api/sessions', { token: adminToken, body: { quizId } })
  const del = await req('DELETE', `/api/quizzes/${quizId}`, { token: adminToken })
  check('supprimer un quiz -> 204', del.status === 204, `recu ${del.status}`)

  const orphan = await req('GET', `/api/sessions/${s4.data?.accessCode}`)
  check(
    'rejoindre une session dont le quiz a ete supprime -> erreur propre, pas un 500',
    orphan.status !== 500,
    `recu ${orphan.status} : ${JSON.stringify(orphan.data)?.slice(0, 150)}`
  )
  const orphanList = await req('GET', '/api/sessions', { token: adminToken })
  check('la liste des sessions survit a un quiz supprime', orphanList.status === 200, `recu ${orphanList.status}`)
  const orphanDetail = await req('GET', `/api/sessions/admin/${s4.data?._id}`, { token: adminToken })
  check(
    "le detail d'une session orpheline -> erreur propre, pas un 500",
    orphanDetail.status !== 500,
    `recu ${orphanDetail.status}`
  )
}

// ------------------------------------------- 15. token expire sur le socket
section('Token expire cote temps reel')
{
  const expired = jwt.sign({ role: 'admin' }, 'test-secret', { subject: 'a'.repeat(24), expiresIn: '-1h' })
  let connectedOk = false
  let message = ''
  try {
    const s = await connectSocket(expired)
    connectedOk = true
    s.disconnect()
  } catch (e) {
    message = e.message
  }
  check(
    'un token expire ne bloque pas la connexion temps reel',
    connectedOk,
    `connexion refusee (${message}) -> un visiteur avec un vieux token en localStorage reste bloque sur "Connexion a la session..."`
  )
}

// -------------------------------------------------- 16. changement de mot de passe
section('Changement de mot de passe')
{
  const wrongCurrent = await req('POST', '/api/auth/change-password', {
    token: adminToken,
    body: { currentPassword: 'faux', newPassword: 'nouveau-mot-de-passe' },
  })
  check('mauvais mot de passe actuel -> 401', wrongCurrent.status === 401, `recu ${wrongCurrent.status}`)
  const tooShort = await req('POST', '/api/auth/change-password', {
    token: adminToken,
    body: { currentPassword: 'admin-bootstrap-pass', newPassword: 'court' },
  })
  check('nouveau mot de passe trop court -> 400', tooShort.status === 400, `recu ${tooShort.status}`)
  const changed = await req('POST', '/api/auth/change-password', {
    token: adminToken,
    body: { currentPassword: 'admin-bootstrap-pass', newPassword: 'nouveau-mot-de-passe' },
  })
  check('changement de mot de passe -> 200', changed.status === 200, JSON.stringify(changed.data)?.slice(0, 150))
  check('mustChangePassword repasse a false', changed.data?.user?.mustChangePassword === false)

  const envReuse = await req('POST', '/api/auth/login', {
    body: { email: 'admin@test.app', password: 'admin-bootstrap-pass' },
  })
  check("le mot de passe d'amorcage ne fonctionne plus apres changement", envReuse.status === 401, `recu ${envReuse.status}`)
  const newLogin = await req('POST', '/api/auth/login', {
    body: { email: 'admin@test.app', password: 'nouveau-mot-de-passe' },
  })
  check('connexion avec le nouveau mot de passe -> 200', newLogin.status === 200)

  const oldToken = await req('GET', '/api/auth/me', { token: adminToken })
  check(
    'les anciens tokens sont invalides apres changement de mot de passe',
    oldToken.status === 401,
    `recu ${oldToken.status} -> un token vole reste valable 30 jours malgre le changement de mot de passe`
  )
}

// ----------------------------------------------------------------- bilan
console.log(`\n${'='.repeat(72)}`)
console.log(`${passed} tests reussis, ${failures.length} echec(s)`)
if (failures.length) {
  console.log('\nEchecs :')
  failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`))
}
console.log('='.repeat(72))

openSockets.forEach((s) => s.disconnect())
// Garde-fou : on ne supprime que la base de test, jamais autre chose.
if (mongoose.connection.name === TEST_DB_NAME) {
  await mongoose.connection.dropDatabase()
}
await mongoose.disconnect()
httpServer.close()
if (mongod) await mongod.stop()
process.exit(failures.length ? 1 : 0)
