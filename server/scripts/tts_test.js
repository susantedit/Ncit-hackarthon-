// Simple Node script to test the local /api/verify/analyze-tts endpoint
// Usage: set env vars (MURF_API_KEY, MURF_API_URL) and run `node scripts/tts_test.js`

import fs from 'fs'
import path from 'path'
import axios from 'axios'

const BASE = process.env.TEST_HOST || 'http://localhost:5000'

async function run() {
  try {
    const payload = {
      inputText: 'The Eiffel Tower is 324 meters tall.',
      consent: true,
      ttsVoice: 'alloy',
    }

    console.log('Posting to', `${BASE}/api/verify/analyze-tts`)
    const res = await axios.post(`${BASE}/api/verify/analyze-tts`, payload, { headers: { 'Content-Type': 'application/json' }, timeout: 120000 })
    const data = res.data
    if (!data) {
      console.error('No response body')
      process.exit(2)
    }

    if (data.tts && data.tts.audio) {
      const uri = data.tts.audio
      const match = uri.match(/^data:(.+);base64,(.+)$/)
      if (!match) {
        console.error('Returned audio is not a base64 data URI')
        process.exit(3)
      }
      const mime = match[1]
      const b64 = match[2]
      const ext = mime.includes('mpeg') || mime.includes('mp3') ? 'mp3' : mime.includes('wav') ? 'wav' : 'bin'
      const outPath = path.resolve(process.cwd(), `./tts_test_output.${ext}`)
      fs.writeFileSync(outPath, Buffer.from(b64, 'base64'))
      console.log('Saved audio to', outPath)
    } else if (data.tts && data.tts.error) {
      console.error('TTS error:', data.tts.error)
      process.exit(4)
    } else {
      console.log('Verification response:', JSON.stringify(data.verification || data, null, 2))
    }
  } catch (err) {
    console.error('Request failed:', err.message || err)
    process.exit(1)
  }
}

run()
