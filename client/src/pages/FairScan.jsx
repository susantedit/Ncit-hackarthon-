import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScanLine, Upload, Send, History, CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'

const VERDICT_META = {
  'Excellent Deal':       { color: '#10b981', Icon: CheckCircle, bg: 'rgba(16,185,129,0.12)' },
  'Fair Price':           { color: '#22c55e', Icon: CheckCircle, bg: 'rgba(34,197,94,0.12)' },
  'Slightly Expensive':   { color: '#f59e0b', Icon: AlertTriangle, bg: 'rgba(245,158,11,0.12)' },
  'Overpriced':           { color: '#ef4444', Icon: XCircle, bg: 'rgba(239,68,68,0.12)' },
  'Suspiciously Cheap':   { color: '#f97316', Icon: AlertTriangle, bg: 'rgba(249,115,22,0.12)' },
  'Unable to Determine':  { color: '#94a3b8', Icon: HelpCircle, bg: 'rgba(148,163,184,0.12)' },
}

const EXAMPLES = [
  'Nike shoes for NPR 4500',
  'Tomatoes 1kg for NPR 120',
  'Apple 1kg for NPR 250',
  'Samsung phone NPR 45000',
  'Rice 5kg bag for NPR 500',
]

export default function FairScan() {
  const { userId } = useAuth()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [tab, setTab] = useState('scan')

  const analyze = async () => {
    if (!input.trim()) return toast.error('Describe a product and price first')
    setLoading(true)
    setResult(null)
    try {
      const res = await api.chatSend({ message: input, module: 'scan', language: 'en', userId })
      setResult({ text: res.response, ...res.scanResult })
      setHistory(h => [{ input, result: res.response, verdict: res.scanResult?.verdict, ts: Date.now() }, ...h].slice(0, 20))
    } catch (err) {
      toast.error(err.message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const verdictInfo = result?.verdict ? (VERDICT_META[result.verdict] || VERDICT_META['Unable to Determine']) : null

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg,#a855f7,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ScanLine size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text1)', marginBottom: 2, fontFamily: "'Space Grotesk',system-ui,sans-serif" }}>FairScan</h1>
            <p style={{ fontSize: 13, color: 'var(--text3)' }}>AI price fairness checker for Nepal</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'var(--glass)', borderRadius: 12, padding: 4, border: '1px solid var(--border)' }}>
          {[['scan', '🔍 Scan Price'], ['history', '📋 History']].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: 8, borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: tab === t ? 'linear-gradient(135deg,#a855f7,#3b82f6)' : 'transparent', color: tab === t ? '#fff' : 'var(--text2)' }}>{l}</button>
          ))}
        </div>

        {tab === 'scan' && (
          <>
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>Describe the product and price:</div>
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), analyze())}
                placeholder="e.g. Nike shoes for NPR 4500 · Tomatoes 1kg NPR 80"
                rows={3} className="inp" style={{ marginBottom: 12 }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {EXAMPLES.map(e => <button key={e} className="chip" onClick={() => setInput(e)}>{e}</button>)}
              </div>
              <button onClick={analyze} disabled={loading} className="btn">
                {loading ? <div className="spin" /> : <ScanLine size={15} />}
                {loading ? 'Analyzing...' : 'Check Fairness'}
              </button>
            </div>

            <AnimatePresence>
              {result && verdictInfo && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 22, background: verdictInfo.bg, borderColor: verdictInfo.color + '40' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <verdictInfo.Icon size={24} color={verdictInfo.color} />
                    <div style={{ fontSize: 22, fontWeight: 900, color: verdictInfo.color, fontFamily: "'Space Grotesk',system-ui,sans-serif" }}>{result.verdict}</div>
                    {result.confidenceScore != null && (
                      <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>Confidence: {result.confidenceScore}%</div>
                    )}
                  </div>
                  {(result.detectedPrice || result.estimatedPrice) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 14 }}>
                      {result.detectedPrice && <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>DETECTED PRICE</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text1)' }}>NPR {result.detectedPrice}</div>
                      </div>}
                      {result.estimatedPrice && <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>MARKET PRICE</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>NPR {result.estimatedPrice}</div>
                      </div>}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{result.text}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>No scan history yet</div>
            ) : history.map((h, i) => {
              const vm = VERDICT_META[h.verdict] || VERDICT_META['Unable to Determine']
              return (
                <div key={i} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)', flex: 1 }}>{h.input}</div>
                    {h.verdict && <span style={{ fontSize: 11, fontWeight: 700, color: vm.color, padding: '3px 8px', borderRadius: 20, background: vm.bg, flexShrink: 0 }}>{h.verdict}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>{new Date(h.ts).toLocaleString()}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
