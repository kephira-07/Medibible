import { Router } from 'express'
import {
  createSession,
  getSessionByCode,
  listSessions,
  getSessionDetail,
  getRecentWinners,
  getOnlineUsers,
} from '../controllers/sessionController.js'
import { authenticate, authorize } from '../middlewares/auth.js'

const router = Router()

// Admin: liste des sessions
router.get('/', authenticate, authorize('admin'), listSessions)
// Créer une session
router.post('/', authenticate, authorize('admin'), createSession)

// 1. Routes statiques spécifiques /admin/* (À MENTENIR EN PREMIER)
router.get('/admin/winners', authenticate, authorize('admin'), getRecentWinners)
router.get('/admin/online', authenticate, authorize('admin'), getOnlineUsers)

// 2. Route dynamique avec paramètre /admin/:sessionId (À METTRE APRÈS)
router.get('/admin/:sessionId', authenticate, authorize('admin'), getSessionDetail)

// 3. Public : accès par code
router.get('/:accessCode', getSessionByCode)

export default router