import { verifyFactClaims, refreshVerification } from '../services/verificationService.js'
import { synthesizeMurfText } from '../services/murfService.js'

export async function handleAnalyzeVerification(req, res) {
  try {
    const {
      inputText = '',
      sourceUrl = '',
      imageText = '',
      inputType = 'text',
    } = req.body

    if (!inputText && !sourceUrl && !imageText) {
      return res.status(400).json({ error: 'inputText, sourceUrl, or imageText is required' })
    }

    const result = await verifyFactClaims({ inputText, sourceUrl, imageText, inputType })
    res.json(result)
  } catch (error) {
    console.error('[Verification] Analyze Error:', error)
    res.status(500).json({ error: error.message || 'Failed to analyze claims' })
  }
}

export async function handleRefreshVerification(req, res) {
  try {
    const {
      inputText = '',
      sourceUrl = '',
      imageText = '',
      inputType = 'text',
    } = req.body

    if (!inputText && !sourceUrl && !imageText) {
      return res.status(400).json({ error: 'inputText, sourceUrl, or imageText is required' })
    }

    const result = await refreshVerification({ inputText, sourceUrl, imageText, inputType })
    res.json(result)
  } catch (error) {
    console.error('[Verification] Refresh Error:', error)
    res.status(500).json({ error: error.message || 'Failed to refresh verification' })
  }
}

export async function handleAnalyzeVerificationTTS(req, res) {
  try {
    const {
      inputText = '',
      sourceUrl = '',
      imageText = '',
      inputType = 'text',
      ttsVoice = 'alloy',
      consent = false,
    } = req.body

    if (!inputText && !sourceUrl && !imageText) {
      return res.status(400).json({ error: 'inputText, sourceUrl, or imageText is required' })
    }

    // Require explicit user consent before sending content to external services
    if (!consent) {
      return res.status(403).json({ error: 'User consent required to use external verification and TTS services' })
    }

    const result = await verifyFactClaims({ inputText, sourceUrl, imageText, inputType })

    // Build a concise spoken summary
    const summary = result.summary || {}
    const topNotes = result.liveNotes ? result.liveNotes.slice(0, 3).join('. ') : ''
    const speakText = `${summary.overallStatus || 'UNVERIFIABLE'}: ${summary.totalClaims || 0} claims. ${topNotes}. Confidence ${summary.confidence || 0} percent.`

    try {
      // Log the TTS request for auditing (append-only)
      try {
        const fs = await import('fs')
        const logDir = new URL('../logs/', import.meta.url).pathname
        await fs.promises.mkdir(logDir, { recursive: true })
        const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'
        const entry = { time: new Date().toISOString(), ip, ttsVoice, inputType, sourceUrl: sourceUrl || '', textPreview: (inputText || imageText || '').slice(0, 240) }
        await fs.promises.appendFile(`${logDir}/tts_requests.log`, JSON.stringify(entry) + '\n')
      } catch (logErr) {
        console.warn('Failed to write TTS log:', logErr?.message || logErr)
      }

      const audioDataUri = await synthesizeMurfText(speakText, ttsVoice)
      return res.json({ verification: result, tts: { audio: audioDataUri, mime: audioDataUri.split(';')[0].split(':')[1] } })
    } catch (ttsError) {
      console.warn('[Verification] Murf TTS failed:', ttsError.message)
      return res.json({ verification: result, tts: { error: ttsError.message } })
    }
  } catch (error) {
    console.error('[Verification] Analyze TTS Error:', error)
    res.status(500).json({ error: error.message || 'Failed to analyze claims with TTS' })
  }
}
