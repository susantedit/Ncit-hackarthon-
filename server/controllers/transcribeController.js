import axios from 'axios'
import FormData from 'form-data'

export async function handleTranscribe(req, res) {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'audio file is required (form field: audio)' })

    // Determine provider
    const provider = (process.env.STT_PROVIDER || '').toUpperCase()

    if (provider === 'GROQ' && process.env.GROQ_API_KEY) {
      // Forward to Groq's OpenAI-compatible transcription endpoint
      const form = new FormData()
      form.append('file', file.buffer, { filename: file.originalname || 'recording.wav', contentType: file.mimetype || 'audio/wav' })
      form.append('model', 'whisper-large-v3')

      const headers = {
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      }

      const resp = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', form, { headers, timeout: 120000 })
      if (resp.data && resp.data.text) {
        return res.json({ text: resp.data.text })
      }
      return res.status(502).json({ error: 'No transcription returned from Groq' })
    }

    // Other providers can be added here (AssemblyAI, Deepgram, etc.)

    return res.status(501).json({ error: 'No STT provider configured. Set STT_PROVIDER=GROQ and GROQ_API_KEY in env.' })
  } catch (err) {
    console.error('Transcribe Error:', err?.response?.data || err.message || err)
    res.status(500).json({ error: err.message || 'Transcription failed' })
  }
}
