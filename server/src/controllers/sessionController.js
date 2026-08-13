import Quiz from '../models/Quiz.js'
import Session from '../models/Session.js'
import { httpError } from '../utils/httpError.js'
import { generateAccessCode } from '../utils/accessCode.js'

// POST /api/sessions — l'hôte crée une session live à partir d'un quiz existant
import { isValidObjectId } from '../utils/validators.js'

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
