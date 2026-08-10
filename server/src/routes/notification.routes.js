import { Router } from 'express'
import {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  broadcast,
} from '../controllers/notificationController.js'
import { authenticate, authorize } from '../middlewares/auth.js'

const router = Router()

router.get('/vapid-public-key', getVapidPublicKey)
router.post('/subscribe', subscribe)
router.post('/unsubscribe', unsubscribe)
router.post('/broadcast', authenticate, authorize('admin', 'host'), broadcast)

export default router
