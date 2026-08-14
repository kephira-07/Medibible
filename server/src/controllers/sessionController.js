import Quiz from '../models/Quiz.js'
import Session from '../models/Session.js'
import { httpError } from '../utils/httpError.js'
import { generateAccessCode } from '../utils/accessCode.js'
import { isValidObjectId } from '../utils/validators.js'

function formatSessionSummary(session) {
  const participants = Array.isArray(session.participants) ? session.participants : []
  const winner = participants.reduce(
    (best, participant) => {
      if (!best || participant.totalScore > best.totalScore) return participant
      return best
    },
    null
  )

  return {
    _id: session._id,
    accessCode: session.accessCode,
    status: session.status,
    quiz: session.quiz,
    host: session.host,
    updatedAt: session.updatedAt,
    createdAt: session.createdAt,
    participants,
    winner,
    playerCount: participants.length,
  }
}

export async function listSessions(req, res, next) {
  try {
    const sessions = await Session.find()
      .sort({ updatedAt: -1 })
      .populate('quiz', 'title')
      .populate('host', 'name email role')

    res.json(sessions.map((session) => ({
      ...formatSessionSummary(session),
      quizTitle: session.quiz?.title || 'Quiz inconnu',
      hostName: session.host?.name || 'Inconnu',
    })))
  } catch (err) {
    next(err)
  }
}

// POST /api/sessions — l'hôte crée une session live à partir d'un quiz existant
export async function createSession(req, res, next) {
  try {
    const { quizId } = req.body || {}
    if (!quizId || !isValidObjectId(quizId)) {
      return next(httpError(400, 'quizId est requis et doit être un identifiant MongoDB valide.'))
    }

    const quiz = await Quiz.findById(quizId)
    if (!quiz) return next(httpError(404, 'Quiz introuvable.'))

    let accessCode
    let attempts = 0
    let session

    while (attempts < 20) {
      accessCode = generateAccessCode()
      attempts += 1

      try {
        session = await Session.create({
          quiz: quiz.id,
          host: req.user.id,
          accessCode,
        })
        break
      } catch (err) {
        if (err.code !== 11000) throw err
      }
    }

    if (!session) {
      return next(httpError(500, 'Impossible de générer un code de session unique.'))
    }

    res.status(201).json(session)
  } catch (err) {
    next(err)
  }
}

// GET /api/sessions/:accessCode — écran "rejoindre" : vérifie le code sans
// exposer les questions/réponses du quiz.
export async function getSessionByCode(req, res, next) {
  try {
    const accessCode = String(req.params.accessCode || '').trim().toUpperCase()
    if (!/^[A-Z0-9]{6}$/.test(accessCode)) {
      return next(httpError(400, 'Code de session invalide.'))
    }

    const session = await Session.findOne({ accessCode }).populate('quiz', 'title')

    if (!session) return next(httpError(404, 'Session introuvable.'))

    res.json({
      accessCode: session.accessCode,
      status: session.status,
      quizTitle: session.quiz.title,
    })
  } catch (err) {
    next(err)
  }
}

// Admin: détails complets d'une session (participants, état, snapshot)
export async function getSessionDetail(req, res, next) {
  try {
    const sessionId = req.params.sessionId || req.query.sessionId
    if (!sessionId || !isValidObjectId(sessionId)) {
      return next(httpError(400, 'sessionId est requis et doit être un identifiant MongoDB valide.'))
    }

    const session = await Session.findById(sessionId)
      .populate('quiz', 'title questions')
      .populate('host', 'name email')

    if (!session) return next(httpError(404, 'Session introuvable.'))

    // Do not expose correct answers here unless the requester is the host/admin
    const safeQuiz = {
      _id: session.quiz._id,
      title: session.quiz.title,
      questionsCount: Array.isArray(session.quiz.questions) ? session.quiz.questions.length : 0,
    }

    res.json({
      ...formatSessionSummary(session),
      quiz: safeQuiz,
      currentQuestionIndex: session.currentQuestionIndex,
      questionPhase: session.questionPhase,
      currentQuestionStartedAt: session.currentQuestionStartedAt,
      currentQuestionEndsAt: session.currentQuestionEndsAt,
    })
  } catch (err) {
    next(err)
  }
}

// Admin: lister les derniers winners (sessions terminées)
export async function getRecentWinners(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100)

    const sessions = await Session.find({ status: 'ended' })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate('quiz', 'title')
      .populate('host', 'name')

    const winners = sessions.map((s) => {
      const participants = Array.isArray(s.participants) ? s.participants : []
      const winner = participants.reduce((best, p) => {
        if (!best || p.totalScore > best.totalScore) return p
        return best
      }, null)

      return {
        sessionId: s._id,
        accessCode: s.accessCode,
        quizTitle: s.quiz?.title || 'Quiz inconnu',
        hostName: s.host?.name || 'Inconnu',
        winner: winner ? { displayName: winner.displayName, totalScore: winner.totalScore } : null,
        endedAt: s.updatedAt,
      }
    })

    res.json(winners)
  } catch (err) {
    next(err)
  }
}

// Admin: utilisateurs actuellement connectés (socketId présent)
export async function getOnlineUsers(req, res, next) {
  try {
    // Sessions may be many; only retrieve recent active ones to keep payload small
    const sessions = await Session.find({ status: { $in: ['lobby', 'live'] } })
      .select('accessCode participants')
      .limit(200)

    const online = []
    sessions.forEach((s) => {
      const participants = Array.isArray(s.participants) ? s.participants : []
      participants.forEach((p) => {
        if (p.socketId) {
          online.push({
            sessionId: s._id,
            accessCode: s.accessCode,
            displayName: p.displayName,
            socketId: p.socketId,
            totalScore: p.totalScore,
            joinedAt: p.joinedAt,
          })
        }
      })
    })

    res.json(online)
  } catch (err) {
    next(err)
  }
}
