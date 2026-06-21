import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building2, Search, ChevronRight, FileText, Clock, DollarSign, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'

export default function GovServices() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [chatMode, setChatMode] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatReply, setChatReply] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  const load = async (q = '') => {
    setLoading(true)
    try {
      const params = q ? { search: q } : {}
      const data = await api.getGovServices(params)
      if (!data.length && !q) {
        await api.seedGovData()
        const seeded = await api.getGovServices({})
        setServices(seeded)
      } else {
        setServices(data)
      }
    } catch { toast.error('Failed to load services') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { const t = setTimeout(() => load(search), 400); return () => clearTimeout(t) }, [search])

  const askAI = async () => {
    if (!chatInput.trim()) return
    setChatLoading(true)
    setChatReply('')
    try {
      const res = await api.chatSend({ message: chatInput, module: 'government', language: 'en' })
      setChatReply(res.response)
    } catch { toast.error('AI request failed') }
    finally { setChatLoading(false) }
  }

  return (
    <div className="page-wrapper">
      <div className="page-content-wide">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg,#ef4444,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text1)', marginBottom: 2, fontFamily: "'Space Grotesk',system-ui,sans-serif" }}>Government Services</h1>
            <p style={{ fontSize: 13, color: 'var(--text3)' }}>Step-by-step guidance for Nepal government procedures</p>
          </div>
        </div>

        {/* AI Chat */}
        <div className="card" style={{ padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', marginBottom: 10 }}>🤖 Ask AI about any government service</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && askAI()}
              placeholder="e.g. How do I get a passport? / पासपोर्ट कसरी बनाउने?" className="inp" style={{ flex: 1, fontSize: 13 }} />
            <button onClick={askAI} disabled={chatLoading} className="btn" style={{ width: 'auto', paddingInline: 18, flexShrink: 0 }}>
              {chatLoading ? <div className="spin" /> : 'Ask'}
            </button>
          </div>
          {chatReply && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 12, padding: 14, borderRadius: 12, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', fontSize: 13, color: 'var(--text1)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {chatReply}
            </motion.div>
          )}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search services (e.g. citizenship, passport, PAN)..."
            className="inp" style={{ paddingLeft: 34, fontSize: 13 }} />
        </div>

        {selected ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={() => setSelected(null)} style={{ marginBottom: 16, fontSize: 13, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              ← Back to list
            </button>
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text1)', marginBottom: 16 }}>{selected.serviceName}</h2>
              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 20 }}>{selected.description}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
                {[
                  { icon: <DollarSign size={14} />, label: 'Fees', value: selected.fees },
                  { icon: <Clock size={14} />, label: 'Processing Time', value: selected.processingTime },
                  { icon: <MapPin size={14} />, label: 'Office', value: selected.office },
                  { icon: <FileText size={14} />, label: 'Eligibility', value: selected.eligibility },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ padding: 14, borderRadius: 12, background: 'var(--glass)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{icon}{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>{value}</div>
                  </div>
                ))}
              </div>
              {selected.requiredDocuments?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', marginBottom: 10 }}>Required Documents</div>
                  <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selected.requiredDocuments.map((d, i) => <li key={i} style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{d}</li>)}
                  </ul>
                </div>
              )}
              {selected.steps?.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', marginBottom: 10 }}>Step-by-Step Process</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selected.steps.map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.65, paddingTop: 3 }}>{step}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selected.officialNotes && (
                <div style={{ marginTop: 20, padding: 14, borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Important Notes</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>{selected.officialNotes}</div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {loading ? Array(6).fill(0).map((_, i) => (
              <div key={i} className="card" style={{ padding: 20, height: 120, background: 'var(--glass)', animation: 'pulse 1.5s infinite' }} />
            )) : services.map((s, i) => (
              <motion.div key={s._id || i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => setSelected(s)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)', marginBottom: 6 }}>{s.serviceName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5, marginBottom: 10 }}>{(s.description || '').slice(0, 80)}{(s.description || '').length > 80 ? '...' : ''}</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, color: '#10b981' }}>Fees: {s.fees}</span>
                      <span style={{ fontSize: 10, color: 'var(--text3)' }}>⏱ {s.processingTime}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--text3)" style={{ flexShrink: 0, marginTop: 2 }} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
