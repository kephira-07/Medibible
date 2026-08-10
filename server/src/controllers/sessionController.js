import Quiz from '../models/Quiz.js'
import Session from '../models/Session.js'
import { httpError } from '../utils/httpError.js'
import { generateAccessCode } from '../utils/accessCode.js'

// POST /api/sessions — l'hôte crée une session live à partir d'un quiz existant
export async function createSession(req, res, next) {
  try {
    const { quizId } = req.body
    if (!quizId) return next(httpError(400, 'quizId est requis.'))

    const quiz = await Quiz.findById(quizId)
    if (!quiz) return next(httpError(404, 'Quiz introuvable.'))

    let accessCode
    let attempts = 0
    do {
      accessCode = generateAccessCode()
      attempts += 1
    } while (attempts < 10 && (await Session.exists({ accessCode })))

    const session = await Session.create({
      quiz: quiz.id,
      host: req.user.id,
      accessCode,
    })

    res.status(201).json(session)
  } catch (err) {
    next(err)
  }
}

// GET /api/sessions/:accessCode — écran "rejoindre" : vérifie le code sans
// exposer les questions/réponses du quiz.
export async function getSessionByCode(req, res, next) {
  try {
    const session = await Session.findOne({
      accessCode: req.params.accessCode.toUpperCase(),
    }).populate('quiz', 'title')

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
