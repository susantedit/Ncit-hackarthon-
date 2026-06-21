import { Router } from 'express'
import { sendChatMessage } from '../services/chatService.js'
import ChatSession from '../models/ChatSession.js'
import MarketPrice from '../models/MarketPrice.js'

const router = Router()

/**
 * POST /api/chat/send
 * Unified Sathi AI chat endpoint.
 * Body: { message, module, chatId, language, userId }
 */
router.post('/send', async (req, res) => {
  try {
    const {
      message = '',
      module = 'chat',
      chatId = null,
      language = 'en',
      userId = 'anonymous',
    } = req.body

    if (!message.trim()) {
      return res.status(400).json({ error: 'message is required' })
    }

    const validModules = ['chat', 'scan', 'market', 'government']
    if (!validModules.includes(module)) {
      return res.status(400).json({ error: `module must be one of: ${validModules.join(', ')}` })
    }

    const result = await sendChatMessage({ message, module, chatId, language, userId })
    res.json(result)
  } catch (err) {
    console.error('[Chat] Error:', err.message)
    res.status(500).json({ error: err.message || 'Chat request failed' })
  }
})

/**
 * GET /api/chat/history/:userId
 * Returns last 20 chat sessions for a user.
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.params.userId })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select('chatId module language updatedAt messages')
      .lean()

    res.json(sessions)
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch history' })
  }
})

/**
 * DELETE /api/chat/session/:chatId
 * Deletes a chat session.
 */
router.delete('/session/:chatId', async (req, res) => {
  try {
    await ChatSession.deleteOne({ chatId: req.params.chatId })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
