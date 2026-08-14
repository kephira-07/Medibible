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

// Admin: détails d'une session (utiliser sessionId)
router.get('/admin/:sessionId', authenticate, authorize('admin'), getSessionDetail)
// Admin: derniers winners
router.get('/admin/winners', authenticate, authorize('admin'), getRecentWinners)
// Admin: utilisateurs en ligne
router.get('/admin/online', authenticate, authorize('admin'), getOnlineUsers)

// Public : un joueur doit pouvoir vérifier un code avant même de se connecter
// Placer cette route en dernier pour éviter les collisions avec /admin/*
router.get('/:accessCode', getSessionByCode)

export default router
