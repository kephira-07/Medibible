import Quiz from '../models/Quiz.js'
import { httpError } from '../utils/httpError.js'

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
    const quiz = await Quiz.findById(req.params.id)
    if (!quiz) return next(httpError(404, `Quiz introuvable : ${req.params.id}`))
    res.json(quiz)
  } catch (err) {
    next(err)
  }
}

// POST /api/quizzes — création (déclenche les validateurs du schéma : 2-3 options, etc.)
export async function createQuiz(req, res, next) {
  try {
    const { title, description, questions, scoring, status } = req.body
    const quiz = await Quiz.create({ title, description, questions, scoring, status })
    res.status(201).json(quiz)
  } catch (err) {
    next(err)
  }
}

// PUT /api/quizzes/:id — remplacement des champs fournis, re-validation complète à l'enregistrement
export async function updateQuiz(req, res, next) {
  try {
    const quiz = await Quiz.findById(req.params.id)
    if (!quiz) return next(httpError(404, `Quiz introuvable : ${req.params.id}`))

    const { title, description, questions, scoring, status } = req.body
    if (title !== undefined) quiz.title = title
    if (description !== undefined) quiz.description = description
    if (questions !== undefined) quiz.questions = questions
    if (scoring !== undefined) quiz.scoring = scoring
    if (status !== undefined) quiz.status = status

    await quiz.save()
    res.json(quiz)
  } catch (err) {
    next(err)
  }
}

// DELETE /api/quizzes/:id
export async function deleteQuiz(req, res, next) {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id)
    if (!quiz) return next(httpError(404, `Quiz introuvable : ${req.params.id}`))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
