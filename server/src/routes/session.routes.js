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
router.get('/', authenticate, authorize('admin', 'host'), listSessions)
// Créer une session (hôte)
router.post('/', authenticate, authorize('admin', 'host'), createSession)

// Admin: détails d'une session (utiliser sessionId)
router.get('/admin/:sessionId', authenticate, authorize('admin', 'host'), getSessionDetail)
// Admin: derniers winners
router.get('/admin/winners', authenticate, authorize('admin', 'host'), getRecentWinners)
// Admin: utilisateurs en ligne
router.get('/admin/online', authenticate, authorize('admin', 'host'), getOnlineUsers)

// Public : un joueur doit pouvoir vérifier un code avant même de se connecter
// Placer cette route en dernier pour éviter les collisions avec /admin/*
router.get('/:accessCode', getSessionByCode)

export default router
