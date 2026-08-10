import { Router } from 'express'
import {
  listQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
} from '../controllers/quizController.js'
import { authenticate, authorize } from '../middlewares/auth.js'

const router = Router()

// Back-office : réservé aux animateurs et administrateurs (les questions
// exposent les bonnes réponses, elles ne doivent pas être visibles des joueurs)
router.use(authenticate, authorize('admin', 'host'))

router.get('/', listQuizzes)
router.get('/:id', getQuiz)
router.post('/', createQuiz)
router.put('/:id', updateQuiz)
router.delete('/:id', deleteQuiz)

export default router
