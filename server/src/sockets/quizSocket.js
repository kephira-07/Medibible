import Session from '../models/Session.js'
import Quiz from '../models/Quiz.js'
import Score from '../models/Score.js'
import { computeAnswerResult } from './scoreEngine.js'
import { scheduleQuestionClose, cancelQuestionClose } from './timerEngine.js'

const roomName = (sessionId) => `session:${sessionId}`

function publicLeaderboard(session) {
  return [...session.participants]
    .map((p) => ({ displayName: p.displayName, totalScore: p.totalScore }))
    .sort((a, b) => b.totalScore - a.totalScore)
}

function publicQuestion(question, session) {
  return {
    questionIndex: session.currentQuestionIndex,
    text: question.text,
    // Jamais isCorrect ici : les joueurs ne doivent pas voir les bonnes réponses avant la clôture
    options: question.options.map((o) => ({ id: o._id, text: o.text })),
    timeLimit: question.timeLimit,
    startedAt: session.currentQuestionStartedAt.getTime(),
    endsAt: session.currentQuestionEndsAt.getTime(),
  }
}

// Vérifie que le socket appelant est bien l'hôte de la session, et renvoie
// session + quiz déjà chargés pour éviter de les requêter deux fois.
async function requireHostSession(socket, sessionId) {
  const user = socket.data.user
  if (!user || !['admin', 'host'].includes(user.role)) {
    throw new Error('Action réservée à l’hôte.')
  }

  const session = await Session.findById(sessionId)
  if (!session) throw new Error('Session introuvable.')
  if (session.host.toString() !== user.id) {
    throw new Error("Vous n'êtes pas l'hôte de cette session.")
  }

  const quiz = await Quiz.findById(session.quiz)
  if (!quiz) throw new Error('Quiz introuvable.')

  return { session, quiz }
}

async function openQuestion(io, session, quiz, index) {
  const question = quiz.questions[index]
  const startedAt = new Date()
  const endsAt = new Date(startedAt.getTime() + question.timeLimit * 1000)

  session.status = 'live'
  session.currentQuestionIndex = index
  session.currentQuestionStartedAt = startedAt
  session.currentQuestionEndsAt = endsAt
  session.questionPhase = 'open'
  await session.save()

  io.to(roomName(session.id)).emit('quiz:questionStarted', {
    ...publicQuestion(question, session),
    totalQuestions: quiz.questions.length,
  })

  scheduleQuestionClose(session.id.toString(), endsAt.getTime(), () => {
    closeQuestion(io, session.id.toString()).catch((err) =>
      console.error('[socket] Échec de la clôture automatique de question :', err)
    )
  })
}

async function closeQuestion(io, sessionId) {
  const session = await Session.findById(sessionId)
  if (!session || session.questionPhase !== 'open') return // déjà clôturée (course host/timer)

  cancelQuestionClose(sessionId)

  const quiz = await Quiz.findById(session.quiz)
  const question = quiz.questions[session.currentQuestionIndex]

  session.questionPhase = 'closed'
  await session.save()

  const answeredCount = await Score.countDocuments({
    session: session.id,
    questionIndex: session.currentQuestionIndex,
  })

  io.to(roomName(session.id)).emit('quiz:questionEnded', {
    questionIndex: session.currentQuestionIndex,
    correctOptionIds: question.options.filter((o) => o.isCorrect).map((o) => o._id),
    bibleReference: question.bibleReference,
    answeredCount,
    leaderboard: publicLeaderboard(session),
  })
}

async function endSession(io, session) {
  cancelQuestionClose(session.id.toString())
  session.status = 'ended'
  session.questionPhase = 'idle'
  await session.save()

  io.to(roomName(session.id)).emit('quiz:sessionEnded', {
    leaderboard: publicLeaderboard(session),
  })
}

export function registerQuizHandlers(io, socket) {
  // Un joueur ou l'hôte rejoint le salon d'une session via son code d'accès
  socket.on('session:join', async ({ accessCode, displayName }, callback) => {
    try {
      if (!accessCode || !displayName) {
        return callback?.({ error: 'accessCode et displayName sont requis.' })
      }

      let session = await Session.findOne({ accessCode: accessCode.toUpperCase() })
      if (!session) return callback?.({ error: 'Session introuvable.' })

      const quiz = await Quiz.findById(session.quiz)
      if (!quiz) return callback?.({ error: 'Quiz associé introuvable.' })

      const user = socket.data.user
      const isHost =
        Boolean(user) &&
        session.host.toString() === user.id &&
        ['admin', 'host'].includes(user.role)

      socket.join(roomName(session.id))
      socket.data.sessionId = session.id.toString()

      if (!isHost) {
        // Écritures Mongo atomiques (updateOne, pas de lire-modifier-écrire
        // via .save()) : deux "session:join" quasi simultanés pour le même
        // participant (ex: double montage React StrictMode, reconnexion
        // réseau) ne doivent jamais créer deux entrées. Identité : le compte
        // pour un utilisateur connecté, sinon le pseudo au sein de la
        // session (comme pour Score.displayName).
        const identityField = user ? 'participants.user' : 'participants.displayName'
        const identityValue = user ? user.id : displayName

        const updateExisting = await Session.updateOne(
          { _id: session._id, [identityField]: identityValue },
          { $set: { 'participants.$.socketId': socket.id, 'participants.$.displayName': displayName } }
        )

        if (updateExisting.matchedCount === 0) {
          // La clause { $ne: identityValue } rend ce push atomique vis-à-vis
          // d'un doublon : si un autre join a déjà inséré ce participant entre
          // le check ci-dessus et maintenant, ce filtre ne matchera plus et
          // aucune deuxième entrée ne sera poussée.
          await Session.updateOne(
            { _id: session._id, [identityField]: { $ne: identityValue } },
            {
              $push: {
                participants: {
                  user: user ? user.id : null,
                  displayName,
                  socketId: socket.id,
                  totalScore: 0,
                },
              },
            }
          )
        }

        session = await Session.findById(session._id)
        io.to(roomName(session.id)).emit('session:participantsUpdate', publicLeaderboard(session))
      }

      callback?.({
        session: {
          id: session.id,
          status: session.status,
          quizTitle: quiz.title,
          currentQuestionIndex: session.currentQuestionIndex,
          totalQuestions: quiz.questions.length,
        },
        isHost,
        activeQuestion:
          session.questionPhase === 'open'
            ? {
                ...publicQuestion(quiz.questions[session.currentQuestionIndex], session),
                totalQuestions: quiz.questions.length,
              }
            : null,
        leaderboard: publicLeaderboard(session),
      })
    } catch (err) {
      console.error('[socket] session:join', err)
      callback?.({ error: 'Impossible de rejoindre la session.' })
    }
  })

  // L'hôte avance le quiz d'un cran : démarre la 1ère question, révèle les
  // réponses de la question en cours, ou passe à la suivante / termine.
  socket.on('host:nextQuestion', async ({ sessionId }, callback) => {
    try {
      const { session, quiz } = await requireHostSession(socket, sessionId)

      if (session.status === 'ended') {
        return callback?.({ error: 'La session est déjà terminée.' })
      }

      if (session.questionPhase === 'open') {
        await closeQuestion(io, session.id.toString())
        return callback?.({ ok: true, phase: 'closed' })
      }

      const nextIndex = session.currentQuestionIndex + 1
      if (nextIndex >= quiz.questions.length) {
        await endSession(io, session)
        return callback?.({ ok: true, phase: 'ended' })
      }

      await openQuestion(io, session, quiz, nextIndex)
      callback?.({ ok: true, phase: 'open' })
    } catch (err) {
      callback?.({ error: err.message })
    }
  })

  // L'hôte peut terminer la session avant la fin du quiz
  socket.on('host:endSession', async ({ sessionId }, callback) => {
    try {
      const { session } = await requireHostSession(socket, sessionId)
      await endSession(io, session)
      callback?.({ ok: true })
    } catch (err) {
      callback?.({ error: err.message })
    }
  })

  // Un joueur soumet sa réponse à la question actuellement ouverte
  socket.on('player:submitAnswer', async ({ sessionId, selectedOptionIds }, callback) => {
    try {
      const session = await Session.findById(sessionId)
      if (!session) return callback?.({ error: 'Session introuvable.' })
      if (session.questionPhase !== 'open') {
        return callback?.({ error: "Aucune question n'est ouverte." })
      }

      const now = Date.now()
      if (now > session.currentQuestionEndsAt.getTime()) {
        return callback?.({ error: 'Le temps est écoulé.' })
      }

      const quiz = await Quiz.findById(session.quiz)
      const question = quiz.questions[session.currentQuestionIndex]

      const user = socket.data.user
      const participant = user
        ? session.participants.find((p) => p.user && p.user.toString() === user.id)
        : session.participants.find((p) => p.socketId === socket.id)

      if (!participant) return callback?.({ error: "Vous n'avez pas rejoint cette session." })

      const { isCorrect, pointsEarned } = computeAnswerResult({
        question,
        selectedOptionIds,
        endsAt: session.currentQuestionEndsAt.getTime(),
        answeredAt: now,
        scoring: quiz.scoring,
      })

      await Score.create({
        session: session.id,
        questionIndex: session.currentQuestionIndex,
        user: user ? user.id : null,
        displayName: participant.displayName,
        selectedOptionIds: selectedOptionIds || [],
        isCorrect,
        answeredAt: new Date(now),
        timeTakenMs: now - session.currentQuestionStartedAt.getTime(),
        pointsEarned,
      })

      participant.totalScore += pointsEarned
      await session.save()

      const answeredCount = await Score.countDocuments({
        session: session.id,
        questionIndex: session.currentQuestionIndex,
      })
      io.to(roomName(session.id)).emit('quiz:answerReceived', { answeredCount })

      callback?.({ ok: true, isCorrect, pointsEarned })
    } catch (err) {
      if (err.code === 11000) {
        return callback?.({ error: 'Vous avez déjà répondu à cette question.' })
      }
      console.error('[socket] player:submitAnswer', err)
      callback?.({ error: "Impossible d'enregistrer la réponse." })
    }
  })
}
