import Session from '../models/Session.js'
import Quiz from '../models/Quiz.js'
import Score from '../models/Score.js'
import { computeAnswerResult } from './scoreEngine.js'
import { scheduleQuestionClose, cancelQuestionClose } from './timerEngine.js'
import { isValidReaction } from '../utils/reactions.js'

const roomName = (sessionId) => `session:${sessionId}`

function publicLeaderboard(session) {
  return [...session.participants]
    .map((p) => ({
      // Identifiant stable du participant. Le prénom servait de clé React
      // côté client, or deux joueurs peuvent porter le même : les homonymes
      // partageaient alors la même clé et se chevauchaient à l'affichage.
      id: p._id.toString(),
      displayName: p.displayName,
      totalScore: p.totalScore,
      // `socketId` est remis à null à la déconnexion : c'est la seule source
      // de vérité sur la présence réelle. Sans ce champ, la liste intitulée
      // « Joueurs connectés » mélangeait indistinctement les joueurs présents
      // et ceux qui avaient quitté la salle, et n'indiquait nulle part qui
      // était réellement en ligne.
      connected: Boolean(p.socketId),
    }))
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

// Cle d'anti-double-reponse, stable d'une connexion a l'autre : le compte pour
// un utilisateur connecte, sinon l'identifiant de navigateur. Le repli sur le
// socketId ne concerne que les clients anciens sans clientId — il repart a
// zero a chaque reconnexion, donc il ne protege rien : c'est tout l'interet de
// `clientId`.
function participantKeyFor(socket, participant) {
  // Un socket arrivé par le formulaire joueur compte comme un invité, même si
  // son navigateur transporte un jeton de compte parfaitement valide. Sans
  // ce garde-fou, deux personnes jouant depuis des appareils qui partagent ce
  // jeton (celui de l'animateur, restauré depuis `localStorage`) recevaient
  // la MÊME clé : elles étaient fusionnées en un seul participant, et l'index
  // unique (session, question, clé) faisait rejeter la réponse de la seconde.
  const user = socket.data.isGuest ? null : socket.data.user
  if (user) return `user:${user.id}`
  const clientId = socket.data.clientId || participant?.clientId
  if (clientId) return `guest:${clientId}`
  return `guest:${participant?.socketId || socket.id}`
}

// Vérifie que le socket appelant est bien l'administrateur de la session, et renvoie
// session + quiz déjà chargés pour éviter de les requêter deux fois.
async function requireHostSession(socket, sessionId) {
  // Ce socket a rejoint par le formulaire joueur : il vient jouer, pas
  // animer. Le jeton d'animateur que son navigateur transporte peut être
  // parfaitement valide (AuthContext le restaure depuis `localStorage`,
  // partagé entre onglets), mais l'intention déclarée prime — sinon un
  // onglet « joueur » pourrait piloter la partie.
  if (socket.data.isGuest) {
    throw new Error('Action réservée à l’animateur de la session.')
  }

  const user = socket.data.user
  if (!user || user.role !== 'admin') {
    throw new Error('Action réservée à l’administrateur.')
  }

  const session = await Session.findById(sessionId)
  if (!session) throw new Error('Session introuvable.')
  if (session.host.toString() !== user.id) {
    throw new Error("Vous n'êtes pas l'administrateur de cette session.")
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
  socket.on('session:join', async ({ accessCode, displayName, bergerName, email, clientId, asGuest }, callback) => {
    try {
      if (!accessCode || !displayName) {
        return callback?.({ error: 'accessCode et displayName sont requis.' })
      }

      let session = await Session.findOne({ accessCode: accessCode.toUpperCase() })
      if (!session) return callback?.({ error: 'Session introuvable.' })

      const quiz = await Quiz.findById(session.quiz)
      if (!quiz) return callback?.({ error: 'Quiz associé introuvable.' })

      const user = socket.data.user
      // `asGuest` : le client a rejoint par le formulaire joueur et déclare
      // qu'il vient jouer. Sans cette déclaration, le rôle était déduit du
      // seul jeton présent dans le navigateur — or AuthContext le restaure
      // depuis `localStorage`, partagé par tous les onglets et persistant.
      // Il suffisait donc qu'un animateur se soit connecté une fois sur
      // l'appareil pour que tout joueur suivant soit promu hôte à son insu :
      // il récupérait les commandes de l'animateur et n'était jamais ajouté
      // aux participants, d'où une salle qui affichait « 0 joueur » alors
      // que quelqu'un venait d'entrer. Le jeton reste vérifié : déclarer
      // l'inverse ne donne aucun droit.
      const isHost =
        !asGuest && Boolean(user) && session.host.toString() === user.id && user.role === 'admin'

      // Mémorisé sur la connexion : toutes les actions d'animateur passées
      // ensuite par ce socket seront refusées (voir requireHostSession).
      socket.data.isGuest = Boolean(asGuest)

      if (!isHost && !bergerName?.trim()) {
        // Un animateur arrive sans berger (il ne joue pas). S'il n'est pas
        // reconnu comme hôte alors que son jeton vient d'être rejeté, le vrai
        // problème est sa session expirée — le dire, plutôt que de réclamer un
        // berger qu'il n'a pas à choisir.
        if (socket.data.authExpired) {
          return callback?.({ error: 'Ta session a expiré — reconnecte-toi pour animer cette partie.' })
        }
        return callback?.({ error: 'bergerName est requis pour rejoindre en tant que participant.' })
      }

      // Identifiant stable du navigateur, genere cote client et conserve en
      // localStorage : c'est lui qui identifie un invite d'un bout a l'autre
      // de la partie, y compris apres un rechargement de page.
      const normalizedClientId = typeof clientId === 'string' ? clientId.trim().slice(0, 64) : ''

      socket.join(roomName(session.id))
      socket.data.sessionId = session.id.toString()
      socket.data.displayName = displayName
      socket.data.clientId = normalizedClientId

      if (!isHost) {
        // Écritures Mongo atomiques (updateOne, pas de lire-modifier-écrire
        // via .save()) : deux "session:join" quasi simultanés pour le même
        // participant (ex: double montage React StrictMode, reconnexion
        // réseau) ne doivent jamais créer deux entrées. Identité : le compte
        // pour un utilisateur connecté, sinon le pseudo au sein de la
        // session (comme pour Score.displayName).
        // Ordre de preference : le compte si l'utilisateur est connecte, sinon
        // l'identifiant de navigateur. Le repli sur le prenom ne sert qu'aux
        // clients anciens qui n'envoient pas encore de clientId : il confond
        // deux homonymes, d'ou sa place en dernier recours.
        // Même règle que participantKeyFor : qui vient jouer est identifié
        // par son navigateur, pas par le compte dont le jeton traîne dans ce
        // navigateur. Deux joueurs partageant le jeton de l'animateur
        // tombaient sinon sur la même entrée `participants.user`, et le
        // second écrasait le premier — la salle n'affichait plus qu'une seule
        // personne alors qu'ils étaient deux.
        const identityUser = asGuest ? null : user

        let identityField = 'participants.displayName'
        let identityValue = displayName
        if (identityUser) {
          identityField = 'participants.user'
          identityValue = identityUser.id
        } else if (normalizedClientId) {
          identityField = 'participants.clientId'
          identityValue = normalizedClientId
        }

        const updateExisting = await Session.updateOne(
          { _id: session._id, [identityField]: identityValue },
          {
            $set: {
              'participants.$.socketId': socket.id,
              'participants.$.displayName': displayName,
              'participants.$.bergerName': bergerName,
              ...(normalizedClientId ? { 'participants.$.clientId': normalizedClientId } : {}),
              ...(email ? { 'participants.$.email': email } : {}),
            },
          }
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
                  user: identityUser ? identityUser.id : null,
                  displayName,
                  bergerName,
                  email: email || '',
                  clientId: normalizedClientId,
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
        // Reconnexion / rechargement pendant l'affichage des résultats : sans
        // ça le joueur retomberait sur la salle d'attente.
        closedQuestion:
          session.questionPhase === 'closed' && session.currentQuestionIndex >= 0
            ? (() => {
                const q = quiz.questions[session.currentQuestionIndex]
                return {
                  ...publicQuestion(q, session),
                  totalQuestions: quiz.questions.length,
                  correctOptionIds: q.options.filter((o) => o.isCorrect).map((o) => o._id),
                  bibleReference: q.bibleReference,
                }
              })()
            : null,
        leaderboard: publicLeaderboard(session),
        // Une reconnexion en pleine question doit retrouver l'ecran "reponse
        // envoyee", pas le bouton "Valider" : sinon le joueur reclique, le
        // serveur refuse (il a deja repondu) et l'erreur le sortait de la
        // salle.
        alreadyAnswered:
          session.currentQuestionIndex >= 0 &&
          (await Score.exists({
            session: session._id,
            questionIndex: session.currentQuestionIndex,
            participantKey: participantKeyFor(
              socket,
              session.participants.find((p) => p.socketId === socket.id)
            ),
          })) !== null,
      })
    } catch (err) {
      console.error('[socket] session:join', err)
      callback?.({ error: 'Impossible de rejoindre la session.' })
    }
  })

  // Réaction emoji (comme dans une visio) : diffusée à tout le salon. Seuls
  // les identifiants de la liste blanche passent, et un léger délai par
  // connexion évite de noyer l'écran des autres.
  socket.on('reaction:send', ({ reaction } = {}, callback) => {
    const sessionId = socket.data.sessionId
    if (!sessionId) return callback?.({ error: "Vous n'avez pas rejoint de session." })
    if (!isValidReaction(reaction)) return callback?.({ error: 'Réaction inconnue.' })

    const now = Date.now()
    if (now - (socket.data.lastReactionAt || 0) < 500) return callback?.({ ok: false })
    socket.data.lastReactionAt = now

    io.to(roomName(sessionId)).emit('reaction:received', {
      id: `${socket.id}-${now}`,
      reaction,
      displayName: socket.data.displayName,
    })
    callback?.({ ok: true })
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

  // Un joueur qui part (onglet ferme, reseau coupe) doit cesser d'etre compte
  // comme "en ligne" : sans ce nettoyage, son socketId restait en base pour
  // toujours et le tableau de bord admin accumulait des connectes fantomes
  // dont le nombre ne pouvait que croitre.
  socket.on('disconnect', async () => {
    const sessionId = socket.data.sessionId
    if (!sessionId) return

    try {
      const result = await Session.updateOne(
        { _id: sessionId, 'participants.socketId': socket.id },
        { $set: { 'participants.$.socketId': null } }
      )
      if (result.modifiedCount > 0) {
        const session = await Session.findById(sessionId)
        if (session) {
          io.to(roomName(session.id)).emit('session:participantsUpdate', publicLeaderboard(session))
        }
      }
    } catch (err) {
      console.error('[socket] nettoyage a la deconnexion', err)
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

      // Même règle que participantKeyFor et que session:join : un joueur
      // arrivé par le formulaire est retrouvé par son navigateur, jamais par
      // le compte dont le jeton traîne dans ce navigateur. Sinon deux joueurs
      // partageant ce jeton pointaient sur le même participant et leurs
      // réponses se mélangeaient.
      const user = socket.data.isGuest ? null : socket.data.user
      const clientId = socket.data.clientId
      let participant = null
      if (user) {
        participant = session.participants.find((p) => p.user && p.user.toString() === user.id)
      } else if (clientId) {
        participant = session.participants.find((p) => p.clientId === clientId)
      }
      // Repli pour un client ancien sans clientId.
      if (!participant) {
        participant = session.participants.find((p) => p.socketId === socket.id)
      }

      if (!participant) return callback?.({ error: "Vous n'avez pas rejoint cette session." })

      const participantKey = participantKeyFor(socket, participant)

      const { isCorrect, pointsEarned } = computeAnswerResult({
        question,
        selectedOptionIds,
        scoring: quiz.scoring,
      })

      await Score.create({
        session: session.id,
        questionIndex: session.currentQuestionIndex,
        user: user ? user.id : null,
        participantKey,
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
      io.to(roomName(session.id)).emit('quiz:answerReceived', {
        answeredCount,
        leaderboard: publicLeaderboard(session),
      })

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
