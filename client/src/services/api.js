const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function post(endpoint, body) {
  const res = await fetch(`${BASE}/api${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await res.json()
  if (!res.ok) {
    const err = new Error(data.error || `Request failed: ${res.status}`)
    err.hint = data.hint
    throw err
  }
  return data
}

async function get(endpoint) {
  const res = await fetch(`${BASE}/api${endpoint}`)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

// userId injected by each page via useAuth()
export const api = {
  ping:            ()                 => fetch(`${BASE}/api/ping`).catch(() => {}),
  generateScript:  (text, tone, userId)  => post('/generate-script',  { text, tone, userId }),
  generateAdvice:  (text, userId)        => post('/generate-advice',   { text, userId }),
  explainTopic:    (topic, mode, userId) => post('/explain-topic',     { topic, mode, userId }),
  generatePlan:    (goal, userId)        => post('/generate-plan',     { goal, userId }),
  textToSpeech:    (text, voice)         => post('/text-to-speech',    { text, voice }),
  translateText:   (text, targetLang)    => post('/translate',         { text, targetLang }),
  sendAlert:       (data)                => post('/send-alert',        data),
  getHistory:      (userId)              => get(`/history?userId=${encodeURIComponent(userId || 'anonymous')}`),
  deleteHistory:   (id)                  => fetch(`${BASE}/api/history/${id}`, { method: 'DELETE' }).then(r => r.json()),
  // Contacts — tied to Google UID
  getContacts:     (userId)              => get(`/contacts/${userId}`),
  addContact:      (data)                => post('/contacts',          data),
  deleteContact:   (id)                  => fetch(`${BASE}/api/contacts/${id}`, { method: 'DELETE' }).then(r => r.json()),
  // Podcast Studio
  generatePodcast: (data)               => post('/podcast/generate',  data),
  chatWithPodcast: (data)               => post('/podcast/chat',      data),
  // Interview Lab
  createInterview: (data)               => post('/interviews/create', data),
  continueInterview: (data)             => post('/interviews/next',   data),
  summarizeInterview: (data)            => post('/interviews/feedback', data),
  // Contact form
  sendContact:     (data)               => post('/contact',           data),
  // Vision
  describeImage:   (image, mimeType)    => post('/describe-image',    { image, mimeType }),
  // CageBait — scam honeypot
  cageBaitPersonas:  ()                 => get('/cagebait/personas'),
  cageBaitRespond:   (data)             => post('/cagebait/respond',       data),
  cageBaitIntel:     (data)             => post('/cagebait/extract-intel', data),
  cageBaitEndSession:(data)             => post('/cagebait/end-session',   data),
  // Verification — realtime claim analysis
  verifyClaims:      (data)             => post('/verify/analyze',         data),
  refreshVerification:(data)            => post('/verify/refresh',         data),
  verifyClaimsWithTTS:(data)            => post('/verify/analyze-tts',     data),
  // Sathi AI — unified chat (chat | scan | market | government)
  chatSend:          (data)             => post('/chat/send',               data),
  chatHistory:       (userId)           => get(`/chat/history/${userId}`),
  // Market prices
  getMarketPrices:   (params = {})      => {
    const qs = new URLSearchParams(Object.entries(params).filter(([,v]) => v)).toString()
    return get(`/market/prices${qs ? '?' + qs : ''}`)
  },
  getMarketDistricts:()                 => get('/market/districts'),
  getMarketCommodities:()               => get('/market/commodities'),
  seedMarketData:    ()                 => post('/market/seed', {}),
  // Government services
  getGovServices:    (params = {})      => {
    const qs = new URLSearchParams(Object.entries(params).filter(([,v]) => v)).toString()
    return get(`/government/services${qs ? '?' + qs : ''}`)
  },
  seedGovData:       ()                 => post('/government/seed', {}),
  // Scan history
  getScanHistory:    (userId)           => get(`/scan/history/${userId}`),
}
