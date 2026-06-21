/**
 * chatService.js
 * Unified AI chat service for Sathi AI.
 * Supports modules: chat | scan | market | government
 * Primary: Groq API  |  Fallback: OpenRouter free tier
 */

import axios from 'axios'
import { getGroqKeys } from './groqService.js'
import MarketPrice from '../models/MarketPrice.js'
import GovernmentService from '../models/GovernmentService.js'
import OcrHistory from '../models/OcrHistory.js'
import ChatSession from '../models/ChatSession.js'

const GROQ_URL    = 'https://api.groq.com/openai/v1/chat/completions'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const GROQ_MODEL  = 'llama-3.3-70b-versatile'
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct:free'

// ── Language display names ────────────────────────────────────────────────────
const LANG_NAMES = {
  ne: 'Nepali',
  en: 'English',
  hi: 'Hindi',
  mai: 'Maithili',
  bho: 'Bhojpuri',
}

// ── System prompts per module ─────────────────────────────────────────────────
function buildSystemPrompt(module, language, context = '') {
  const lang = LANG_NAMES[language] || 'English'

  const base = `You are Sathi AI, a helpful AI assistant designed for Nepal.
Always respond in ${lang}. Be concise, accurate, friendly, locally relevant, and maintain conversational context.
If the user writes in Nepali, Hindi, Maithili, or Bhojpuri, respond naturally in that same language.`

  if (module === 'market') {
    return `${base}

You are a market price expert for Nepal with comprehensive knowledge of ALL commodity prices including vegetables, fruits, grains, dairy, spices, AND meat/poultry/fish.

Built-in price knowledge for Nepal (approximate NPR rates):
- Chicken (Broiler): NPR 260-300/kg | Chicken (Country/Deshi): NPR 550-650/kg
- Mutton/Goat: NPR 1000-1200/kg | Buff (Buffalo): NPR 480-560/kg | Pork: NPR 440-520/kg
- Fish (Rohu): NPR 280-320/kg | Fish (Catfish): NPR 320-380/kg | Eggs: NPR 220-260/dozen
- Tomato: NPR 50-80/kg | Potato: NPR 35-55/kg | Onion: NPR 50-70/kg
- Rice (Fine): NPR 75-95/kg | Wheat Flour: NPR 50-60/kg | Mustard Oil: NPR 300-340/litre
- Apple: NPR 160-200/kg | Banana: NPR 70-90/dozen | Orange: NPR 100-140/kg

${context ? `Latest live prices from our database:\n\n${context}\n\nPrioritize this data over built-in estimates when answering.` : 'Use the built-in price knowledge above to answer accurately.'}

RULES:
- ALWAYS give a price estimate even if exact data is unavailable — use built-in knowledge
- NEVER say "I don't have data" or ask for location — just give Nepal-wide typical rates
- If user asks about a specific city, note prices may vary ±10-15% from the figures given
- Be direct: state the price, the range, and a one-line context`
  }

  if (module === 'government') {
    return `${base}

You are also a Nepali government services expert.
${context ? `Here is the relevant government service information retrieved from the database:\n\n${context}\n\nUse ONLY this data to answer. Do not invent procedures.` : 'No matching government service found. Provide general guidance and tell the user to verify at the relevant office.'}
Provide step-by-step instructions, required documents, fees, processing time, and office location from the retrieved data.
Never hallucinate government procedures. When uncertain, clearly say you are unsure.`
  }

  if (module === 'scan') {
    return `${base}

You are a price fairness expert for Nepal. Your job is to evaluate whether a given price is fair, overpriced, underpriced, or suspicious.
${context ? `Reference price data from database:\n${context}\n` : ''}

The user will describe a product and its price. Analyze it carefully.

VERDICT RULES (pick exactly one):
- "Excellent Deal" → price is significantly BELOW typical market rate (genuine deal)
- "Fair Price" → price matches typical Nepal market rate
- "Slightly Expensive" → price is 15-40% above market rate
- "Overpriced" → price is more than 40% above market rate
- "Suspiciously Cheap" → price is unrealistically LOW — likely counterfeit, fake, or scam
- "Unable to Determine" → cannot assess without more info

IMPORTANT: If the price seems unrealistically LOW for a branded/genuine product (e.g. Nike shoes for NPR 200, iPhone for NPR 500), the verdict must be "Suspiciously Cheap" — NOT "Overpriced". The buyer is at risk of being scammed with a fake.

Return a structured analysis with:
- Product Name
- Detected Price (NPR)
- Estimated Market Price (NPR)
- Expected Price Range (min–max NPR)
- Verdict: one of [Excellent Deal | Fair Price | Slightly Expensive | Overpriced | Suspiciously Cheap | Unable to Determine]
- Confidence: 0–100
- Explanation (2–3 sentences)
- Risk Warning (only if Suspiciously Cheap or Overpriced)
- Better Alternatives if applicable

Be specific about Nepali market conditions.`
  }

  // default: chat
  return base
}

// ── AI call with Groq → OpenRouter failover ───────────────────────────────────
async function callAI(messages, { temperature = 0.7, maxTokens = 1024 } = {}) {
  const groqKeys = getGroqKeys()

  // Try all Groq keys first
  for (const key of groqKeys) {
    try {
      const res = await axios.post(
        GROQ_URL,
        { model: GROQ_MODEL, messages, temperature, max_tokens: maxTokens },
        {
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      )
      const content = res.data?.choices?.[0]?.message?.content
      if (content) return { content, provider: 'groq' }
    } catch (err) {
      const status = err.response?.status
      if ([401, 403, 429, 500, 502, 503, 504].includes(status)) continue
      throw err
    }
  }

  // Fallback: OpenRouter
  const openrouterKey = process.env.OPENROUTER_API_KEY
  if (openrouterKey) {
    try {
      const res = await axios.post(
        OPENROUTER_URL,
        { model: OPENROUTER_MODEL, messages, temperature, max_tokens: maxTokens },
        {
          headers: {
            Authorization: `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://sathi-ai.com',
            'X-Title': 'Sathi AI',
          },
          timeout: 40000,
        }
      )
      const content = res.data?.choices?.[0]?.message?.content
      if (content) return { content, provider: 'openrouter' }
    } catch (err) {
      console.warn('[ChatService] OpenRouter fallback failed:', err.message)
    }
  }

  throw new Error('All AI providers failed. Please try again later.')
}

// ── Context retrieval for market module ───────────────────────────────────────
async function getMarketContext(message) {
  try {
    const lower = message.toLowerCase()

    // Common Nepal districts
    const districts = [
      'kathmandu', 'pokhara', 'lalitpur', 'bhaktapur', 'chitwan', 'butwal',
      'birgunj', 'dharan', 'biratnagar', 'nepalgunj', 'dhangadhi', 'hetauda',
    ]
    const foundDistrict = districts.find(d => lower.includes(d))

    // Commodity keyword matching (including meat terms in Nepali/English)
    const meatKeywords = ['chicken', 'kukur', 'mutton', 'goat', 'khasi', 'buff', 'buffalo', 'pork', 'bandel', 'fish', 'macha', 'egg', 'anda', 'meat', 'maasu', 'माँस', 'मासु', 'मांस', 'कुखुरा', 'खसी', 'बाख्रा', 'भैंसी', 'सुँगुर', 'माछा', 'अण्डा']
    const hasMeatQuery = meatKeywords.some(k => lower.includes(k))

    const query = {}
    if (foundDistrict) query.district = new RegExp(foundDistrict, 'i')
    if (hasMeatQuery)  query.category = 'meat'

    const prices = await MarketPrice.find(query)
      .sort({ updatedAt: -1 })
      .limit(hasMeatQuery ? 30 : 20)
      .lean()

    if (!prices.length) return ''

    return prices
      .map(p => `${p.commodity} in ${p.district}: NPR ${p.price}/${p.unit} (updated ${new Date(p.updatedAt).toLocaleDateString()})`)
      .join('\n')
  } catch {
    return ''
  }
}

// ── Context retrieval for government module (RAG) ─────────────────────────────
async function getGovernmentContext(message) {
  try {
    // Keyword matching — try full-text search first, then keyword array
    const words = message.toLowerCase().split(/\s+/).filter(w => w.length > 3)

    let services = await GovernmentService.find(
      { $text: { $search: message } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(3)
      .lean()

    // Fallback: keyword array match
    if (!services.length) {
      services = await GovernmentService.find({
        keywords: { $in: words },
      })
        .limit(3)
        .lean()
    }

    // Fallback: fuzzy service name match
    if (!services.length && words.length) {
      const regex = new RegExp(words.join('|'), 'i')
      services = await GovernmentService.find({
        $or: [
          { serviceName: regex },
          { description: regex },
        ],
      })
        .limit(3)
        .lean()
    }

    if (!services.length) return ''

    return services
      .map(s => `SERVICE: ${s.serviceName}
Description: ${s.description || ''}
Documents Required: ${(s.requiredDocuments || []).join(', ') || 'Not specified'}
Fees: ${s.fees || 'Free'}
Processing Time: ${s.processingTime || 'Varies'}
Office: ${s.office || 'Local government office'}
Eligibility: ${s.eligibility || 'All citizens'}
Steps: ${(s.steps || []).join(' | ') || 'See description'}
Notes: ${s.officialNotes || ''}`)
      .join('\n\n---\n\n')
  } catch {
    return ''
  }
}

// ── Scan context: market price lookup for fairness check ─────────────────────
async function getScanContext(message) {
  try {
    const lower = message.toLowerCase()
    // Extract commodity keywords and look up prices
    const prices = await MarketPrice.find({
      commodity: new RegExp(lower.split(/\s+/).slice(0, 3).join('|'), 'i'),
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean()

    if (!prices.length) return ''
    return prices
      .map(p => `${p.commodity} (${p.district}): NPR ${p.price}/${p.unit}`)
      .join('\n')
  } catch {
    return ''
  }
}

// ── Parse scan response into structured fields ────────────────────────────────
function parseScanResponse(text, dbContext) {
  const verdicts = ['Excellent Deal', 'Fair Price', 'Slightly Expensive', 'Overpriced', 'Suspiciously Cheap', 'Unable to Determine']
  const foundVerdict = verdicts.find(v => text.includes(v)) || 'Unable to Determine'

  const confidenceMatch = text.match(/Confidence[:\s]*(\d+)/i)
  const confidence = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 50

  const detectedPriceMatch = text.match(/Detected Price[^:]*:\s*NPR?\s*([\d,]+)/i)
  const estimatedPriceMatch = text.match(/Estimated Market Price[^:]*:\s*NPR?\s*([\d,]+)/i)

  return {
    verdict: foundVerdict,
    confidenceScore: confidence,
    detectedPrice: detectedPriceMatch ? parseInt(detectedPriceMatch[1].replace(',', ''), 10) : null,
    estimatedPrice: estimatedPriceMatch ? parseInt(estimatedPriceMatch[1].replace(',', ''), 10) : null,
    explanation: text,
    dbPricesUsed: !!dbContext,
  }
}

// ── Main chat send function ───────────────────────────────────────────────────
export async function sendChatMessage({ message, module = 'chat', chatId, language = 'en', userId = 'anonymous' }) {
  if (!message?.trim()) throw new Error('message is required')

  // Retrieve or create chat session
  let session = chatId ? await ChatSession.findOne({ chatId }) : null
  if (!session) {
    const newChatId = chatId || `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    session = new ChatSession({ chatId: newChatId, userId, module, language, messages: [] })
  }

  // Retrieve module-specific context
  let context = ''
  if (module === 'market')     context = await getMarketContext(message)
  if (module === 'government') context = await getGovernmentContext(message)
  if (module === 'scan')       context = await getScanContext(message)

  const systemPrompt = buildSystemPrompt(module, language, context)

  // Build messages array with history (last 10 turns)
  const historyMessages = session.messages.slice(-10).map(m => ({
    role: m.role,
    content: m.content,
  }))

  const messages = [
    { role: 'system', content: systemPrompt },
    ...historyMessages,
    { role: 'user', content: message },
  ]

  // Call AI
  const { content: responseText, provider } = await callAI(messages, {
    temperature: module === 'government' ? 0.3 : 0.7,
    maxTokens: module === 'scan' ? 800 : 1024,
  })

  // Persist conversation
  session.messages.push({ role: 'user', content: message })
  session.messages.push({ role: 'assistant', content: responseText })
  session.updatedAt = new Date()
  await session.save()

  // For scan module, also save to OcrHistory
  let scanMeta = null
  if (module === 'scan') {
    scanMeta = parseScanResponse(responseText, context)
    try {
      await OcrHistory.create({
        userId,
        rawText: message,
        verdict: scanMeta.verdict,
        confidenceScore: scanMeta.confidenceScore,
        detectedPrice: scanMeta.detectedPrice,
        estimatedPrice: scanMeta.estimatedPrice,
        explanation: responseText,
        inputType: 'text',
      })
    } catch { /* non-fatal */ }
  }

  return {
    chatId: session.chatId,
    response: responseText,
    module,
    language,
    provider,
    ...(scanMeta && { scanResult: scanMeta }),
    context: context ? 'retrieved' : 'none',
  }
}
