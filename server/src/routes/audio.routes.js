import { Router } from 'express'
import { getAudioToken } from '../controllers/audioController.js'

const router = Router()

router.post('/token', getAudioToken)

export default router
