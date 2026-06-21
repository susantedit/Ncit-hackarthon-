import axios from 'axios'
import { getGroqKeys } from './groqService.js'

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

// Language name mapping
const LANGUAGE_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
  pt: 'Portuguese', ru: 'Russian', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
  'zh-CN': 'Chinese (Simplified)', 'zh-TW': 'Chinese (Traditional)',
  hi: 'Hindi', bn: 'Bengali', ur: 'Urdu', ta: 'Tamil', te: 'Telugu',
  mr: 'Marathi', gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi',
  si: 'Sinhala', ne: 'Nepali', th: 'Thai', vi: 'Vietnamese', id: 'Indonesian',
  ms: 'Malay', fil: 'Filipino', my: 'Burmese', km: 'Khmer', lo: 'Lao',
  ar: 'Arabic', tr: 'Turkish', fa: 'Persian', he: 'Hebrew', nl: 'Dutch',
  pl: 'Polish', sv: 'Swedish', no: 'Norwegian', da: 'Danish', fi: 'Finnish',
  el: 'Greek', cs: 'Czech', hu: 'Hungarian', ro: 'Romanian', uk: 'Ukrainian',
  bg: 'Bulgarian', hr: 'Croatian', sk: 'Slovak', sl: 'Slovenian', et: 'Estonian',
  lv: 'Latvian', lt: 'Lithuanian', sw: 'Swahili', af: 'Afrikaans', zu: 'Zulu',
  am: 'Amharic', ha: 'Hausa', yo: 'Yoruba', ig: 'Igbo',
  sr: 'Serbian', sq: 'Albanian', mk: 'Macedonian', bs: 'Bosnian',
  az: 'Azerbaijani', ka: 'Georgian', hy: 'Armenian', kk: 'Kazakh',
  uz: 'Uzbek', mn: 'Mongolian', cy: 'Welsh', ga: 'Irish', is: 'Icelandic',
  mt: 'Maltese', 'es-MX': 'Spanish (Mexico)', 'es-AR': 'Spanish (Argentina)',
  // Nepal local languages — Groq handles these via LLM knowledge
  mai: 'Maithili', bho: 'Bhojpuri', new: 'Newari (Nepal Bhasa)',
  tharu: 'Tharu', tam: 'Tamang',
}

async function callGroq(messages) {
  const keys = getGroqKeys()
  if (!keys.length) throw new Error('No GROQ_API_KEY configured')

  let lastErr
  for (const key of keys) {
    try {
      const res = await axios.post(
        GROQ_URL,
        { model: GROQ_MODEL, messages, temperature: 0.1, max_tokens: 1024 },
        {
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      )
      const content = res.data?.choices?.[0]?.message?.content
      if (content) return content.trim()
    } catch (err) {
      const status = err.response?.status
      if (status === 401 || status === 429) { lastErr = err; continue }
      throw err
    }
  }
  throw lastErr || new Error('All Groq API keys exhausted')
}

export async function translateText(text, targetLang) {
  const cleanedText = String(text || '').trim().replace(/\s+/g, ' ')
  if (!cleanedText) throw new Error('Text cannot be empty')

  const targetLangName = LANGUAGE_NAMES[targetLang] || targetLang

  const systemPrompt = `You are a professional translator. Translate the given text accurately into ${targetLangName}.

Rules:
- Output ONLY the translated text — no explanations, no quotes, no labels
- Preserve formatting (line breaks, punctuation) from the original
- For local Nepali languages (Maithili, Bhojpuri, Newari, Tharu, Tamang), use the most natural everyday form
- Never add "Translation:" or any prefix to your output`

  const userPrompt = `Translate this into ${targetLangName}:\n\n${cleanedText}`

  const translatedText = await callGroq([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ])

  // Detect source language with a second quick call
  let detectedLang = 'unknown'
  let detectedLangName = 'Unknown'
  try {
    const detectResult = await callGroq([
      { role: 'system', content: 'Detect the language of the given text. Reply with ONLY the ISO 639-1 language code (e.g. en, ne, hi, fr). Nothing else.' },
      { role: 'user', content: cleanedText.slice(0, 200) },
    ])
    const code = detectResult.trim().toLowerCase().replace(/[^a-z-]/g, '').slice(0, 10)
    if (code) {
      detectedLang = code
      detectedLangName = LANGUAGE_NAMES[code] || code.toUpperCase()
    }
  } catch {
    // non-fatal — detection failure is ok
  }

  return {
    translatedText,
    detectedLang,
    detectedLangName,
    targetLang,
    originalText: cleanedText,
  }
}

export function isSupportedLanguage(langCode) {
  // Groq can handle almost any language — just check it's a known code
  return Object.keys(LANGUAGE_NAMES).includes(langCode) || langCode.length >= 2
}

export function getLanguageName(langCode) {
  return LANGUAGE_NAMES[langCode] || langCode.toUpperCase()
}
