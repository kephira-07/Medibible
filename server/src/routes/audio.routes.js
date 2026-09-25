import { Router } from 'express'
import { getAudioToken, setMicPermission } from '../controllers/audioController.js'
import { authenticate, authorize } from '../middlewares/auth.js'

const router = Router()

router.post('/token', getAudioToken)
router.post('/mic-permission', authenticate, authorize('admin'), setMicPermission)

export default router
