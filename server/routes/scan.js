import { Router } from 'express'
import OcrHistory from '../models/OcrHistory.js'
import { sendChatMessage } from '../services/chatService.js'

const router = Router()

// POST /api/scan/analyze  — text-based price fairness check
router.post('/analyze', async (req, res) => {
  try {
    const { message, userId = 'anonymous', language = 'en', chatId } = req.body
    if (!message?.trim()) return res.status(400).json({ error: 'message is required' })

    const result = await sendChatMessage({ message, module: 'scan', chatId, language, userId })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message || 'Scan failed' })
  }
})

// GET /api/scan/history/:userId
router.get('/history/:userId', async (req, res) => {
  try {
    const history = await OcrHistory.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
    res.json(history)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
