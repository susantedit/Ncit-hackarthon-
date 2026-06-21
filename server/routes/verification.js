import express from 'express'
import { handleAnalyzeVerification, handleRefreshVerification, handleAnalyzeVerificationTTS } from '../controllers/verificationController.js'

const router = express.Router()

router.post('/verify/analyze', handleAnalyzeVerification)
router.post('/verify/refresh', handleRefreshVerification)
router.post('/verify/analyze-tts', handleAnalyzeVerificationTTS)

export default router
