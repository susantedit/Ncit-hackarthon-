import React, { useState, useRef } from 'react'
import { api } from '../services/api'

export default function VerificationTTS() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const audioRef = useRef(null)

  async function handleSpeak() {
    setError(null)
    setLoading(true)
    try {
      const res = await api.verifyClaimsWithTTS({ inputText: text })
      if (res.tts && res.tts.audio) {
        if (audioRef.current) {
          audioRef.current.src = res.tts.audio
          await audioRef.current.play()
        }
      } else if (res.tts && res.tts.error) {
        setError(res.tts.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '12px auto' }}>
      <h3>Verification + Murf TTS</h3>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={6} style={{ width: '100%' }} placeholder="Enter text or claim to verify" />
      <div style={{ marginTop: 8 }}>
        <button onClick={handleSpeak} disabled={loading || !text.trim()}>Analyze & Speak</button>
        {loading && <span style={{ marginLeft: 8 }}>Analyzing…</span>}
      </div>
      {error && <div style={{ color: 'red', marginTop: 8 }}>Error: {error}</div>}
      <audio ref={audioRef} controls style={{ marginTop: 12, width: '100%' }} />
    </div>
  )
}
