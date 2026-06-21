import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Send, Languages, RefreshCw, Trash2, Mic, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'

const LANGUAGES = [
  { code: 'ne',  label: 'नेपाली',   name: 'Nepali' },
  { code: 'en',  label: 'English',  name: 'English' },
  { code: 'hi',  label: 'हिंदी',    name: 'Hindi' },
  { code: 'mai', label: 'मैथिली',   name: 'Maithili' },
  { code: 'bho', label: 'भोजपुरी',  name: 'Bhojpuri' },
]

const MODULE_CHIPS = [
  { label: '💬 General Chat', module: 'chat' },
  { label: '📊 Market Prices', module: 'market' },
  { label: '🏛️ Gov Services',  module: 'government' },
  { label: '💰 Price Check',   module: 'scan' },
]

const EXAMPLE_PROMPTS = {
  chat:       ['Hello, how are you?', 'What is the capital of Nepal?', 'Tell me a joke', 'What should I eat today?'],
  market:     ['What is the price of tomatoes today?', 'Rice price in Kathmandu', 'Onion price in Pokhara', 'Show me vegetable prices'],
  government: ['How do I get a citizenship certificate?', 'What documents do I need for a passport?', 'How to get PAN card?', 'Driving license process'],
  scan:       ['Nike shoes for NPR 4500, is it fair?', 'Tomatoes 1kg for NPR 120', 'Apple NPR 250 per kg', 'Rice 5kg for NPR 500'],
}

export default function Chat() {
  const { userId } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState('ne')
  const [module, setModule] = useState('chat')
  const [chatId, setChatId] = useState(null)
  const [showLangPicker, setShowLangPicker] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const activeLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0]

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await api.chatSend({ message: text, module, chatId, language, userId })
      if (!chatId) setChatId(res.chatId)
      setMessages(prev => [...prev, { role: 'assistant', content: res.response, ts: Date.now(), module: res.module }])
    } catch (err) {
      toast.error(err.message || 'Request failed')
      setMessages(prev => prev.filter(m => m !== userMsg))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const clearChat = () => {
    setMessages([])
    setChatId(null)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', maxHeight: '100dvh', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--nav)', backdropFilter: 'blur(20px)', flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg,#3b82f6,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Brain size={18} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text1)' }}>Sathi AI Chat</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Multilingual assistant for Nepal</div>
        </div>
        {/* Language selector */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowLangPicker(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text1)' }}>
            <Languages size={13} /> {activeLang.label} <ChevronDown size={11} />
          </button>
          <AnimatePresence>
            {showLangPicker && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                style={{ position: 'absolute', right: 0, top: '110%', background: 'var(--nav)', border: '1px solid var(--border)', borderRadius: 14, padding: 6, zIndex: 100, minWidth: 140, backdropFilter: 'blur(20px)' }}>
                {LANGUAGES.map(l => (
                  <button key={l.code} onClick={() => { setLanguage(l.code); setShowLangPicker(false) }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: language === l.code ? 700 : 400, color: language === l.code ? '#3b82f6' : 'var(--text1)', background: language === l.code ? 'rgba(59,130,246,0.1)' : 'transparent' }}>
                    {l.label} · {l.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button onClick={clearChat} style={{ padding: 8, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', color: 'var(--text3)' }} title="Clear chat">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Module tabs */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, overflowX: 'auto', flexShrink: 0, background: 'var(--bg)' }}>
        {MODULE_CHIPS.map(({ label, module: m }) => (
          <button key={m} onClick={() => setModule(m)}
            style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${module === m ? '#3b82f6' : 'var(--border)'}`, background: module === m ? 'rgba(59,130,246,0.15)' : 'var(--glass)', color: module === m ? '#3b82f6' : 'var(--text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '40px 16px' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg,#3b82f6,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={32} color="#fff" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text1)', marginBottom: 6 }}>सुरु गर्नुहोस् — Start chatting</div>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>Ask in Nepali, Hindi, English, Maithili, or Bhojpuri</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 480 }}>
              {(EXAMPLE_PROMPTS[module] || []).map(p => (
                <button key={p} onClick={() => setInput(p)}
                  style={{ padding: '8px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg,#3b82f6,#10b981)'
                : 'var(--glass)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
              color: msg.role === 'user' ? '#fff' : 'var(--text1)',
              fontSize: 14,
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {msg.content}
            </div>
          </motion.div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 16px', borderRadius: '18px 18px 18px 4px', background: 'var(--glass)', border: '1px solid var(--border)', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0,1,2].map(i => (
                <motion.div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--nav)', backdropFilter: 'blur(20px)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', maxWidth: 800, margin: '0 auto' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={`Ask in ${activeLang.name}...`}
            rows={1}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 14, border: '1px solid var(--border)',
              background: 'var(--glass)', color: 'var(--text1)', fontSize: 14, resize: 'none',
              lineHeight: 1.5, maxHeight: 120, overflow: 'auto', outline: 'none',
              fontFamily: 'inherit',
            }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
          />
          <button onClick={send} disabled={!input.trim() || loading}
            style={{
              width: 42, height: 42, borderRadius: 14, border: 'none',
              background: input.trim() && !loading ? 'linear-gradient(135deg,#3b82f6,#10b981)' : 'var(--glass)',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
            {loading
              ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#3b82f6' }} />
              : <Send size={16} color={input.trim() ? '#fff' : 'var(--text3)'} />
            }
          </button>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center', marginTop: 6 }}>
          Enter to send · Shift+Enter for new line · Powered by Sathi AI
        </div>
      </div>
    </div>
  )
}
