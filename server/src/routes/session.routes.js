import { Router } from 'express'
import { createSession, getSessionByCode } from '../controllers/sessionController.js'
import { authenticate, authorize } from '../middlewares/auth.js'

const router = Router()

router.post('/', authenticate, authorize('admin', 'host'), createSession)
// Public : un joueur doit pouvoir vérifier un code avant même de se connecter
router.get('/:accessCode', getSessionByCode)

export default router
