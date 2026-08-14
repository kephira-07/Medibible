import Quiz from '../models/Quiz.js'
import { httpError } from '../utils/httpError.js'
import { normalizeText, isValidObjectId } from '../utils/validators.js'
import { DEFAULT_BASE_SCORE, DEFAULT_SPEED_BONUS } from '../utils/constants.js'

function normalizeScoring(scoring) {
  const baseValue = Number(scoring?.base ?? DEFAULT_BASE_SCORE)
  const speedBonusValue = Number(scoring?.speedBonus ?? DEFAULT_SPEED_BONUS)

  if (!Number.isFinite(baseValue) || !Number.isFinite(speedBonusValue)) {
    throw httpError(400, 'La configuration de score est invalide.')
  }

  return {
    base: baseValue,
    speedBonus: speedBonusValue,
  }
}

function validateQuizPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw httpError(400, 'Payload de quiz invalide.')
  }

  const title = normalizeText(payload.title, 120)
  if (!title) {
    throw httpError(400, 'Le titre du quiz est requis.')
  }

  const questions = Array.isArray(payload.questions) ? payload.questions : []
  if (questions.length === 0) {
    throw httpError(400, 'Le quiz doit contenir au moins une question.')
  }

  if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
    throw httpError(400, 'Le quiz doit contenir au moins une question.')
  }

  return {
    title,
    description: normalizeText(payload.description || '', 500),
    questions,
    scoring: normalizeScoring(payload.scoring),
    status: ['draft', 'published', 'archived'].includes(payload.status) ? payload.status : 'draft',
  }
}

// GET /api/quizzes — liste pour le back-office (aperçu, sans détail complet)
export async function listQuizzes(req, res, next) {
  try {
    const quizzes = await Quiz.find().sort({ updatedAt: -1 })
    res.json(quizzes)
  } catch (err) {
    next(err)
  }
}

// GET /api/quizzes/:id — quiz complet, pour édition ou lancement d'une session
export async function getQuiz(req, res, next) {
  try {
    const quizId = req.params.id
    if (!isValidObjectId(quizId)) {
      return next(httpError(400, 'Identifiant de quiz invalide.'))
    }

    const quiz = await Quiz.findById(quizId)
    if (!quiz) return next(httpError(404, `Quiz introuvable : ${quizId}`))
    res.json(quiz)
  } catch (err) {
    next(err)
  }
}

// POST /api/quizzes — création (déclenche les validateurs du schéma : 2-3 options, etc.)
export async function createQuiz(req, res, next) {
  try {
    const validated = validateQuizPayload(req.body)
    const quiz = await Quiz.create(validated)
    res.status(201).json(quiz)
  } catch (err) {
    next(err)
  }
}

// PUT /api/quizzes/:id — remplacement des champs fournis, re-validation complète à l'enregistrement
export async function updateQuiz(req, res, next) {
  try {
    const quizId = req.params.id
    if (!isValidObjectId(quizId)) {
      return next(httpError(400, 'Identifiant de quiz invalide.'))
    }

    const quiz = await Quiz.findById(quizId)
    if (!quiz) return next(httpError(404, `Quiz introuvable : ${quizId}`))

    const { title, description, questions, scoring, status } = req.body || {}
    if (title !== undefined) quiz.title = normalizeText(title, 120)
    if (description !== undefined) quiz.description = normalizeText(description || '', 500)
    if (questions !== undefined) {
      if (!Array.isArray(questions) || questions.length === 0) {
        return next(httpError(400, 'Le quiz doit contenir au moins une question.'))
      }
      quiz.questions = questions
    }
    if (scoring !== undefined) {
      try {
        quiz.scoring = normalizeScoring(scoring)
      } catch (err) {
        return next(err)
      }
    }
    if (status !== undefined) {
      quiz.status = ['draft', 'published', 'archived'].includes(status) ? status : 'draft'
    }

    await quiz.save()
    res.json(quiz)
  } catch (err) {
    next(err)
  }
}

// DELETE /api/quizzes/:id
export async function deleteQuiz(req, res, next) {
  try {
    const quizId = req.params.id
    if (!isValidObjectId(quizId)) {
      return next(httpError(400, 'Identifiant de quiz invalide.'))
    }

    const quiz = await Quiz.findByIdAndDelete(quizId)
    if (!quiz) return next(httpError(404, `Quiz introuvable : ${quizId}`))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
