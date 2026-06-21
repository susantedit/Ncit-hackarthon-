import axios from 'axios'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Maps internal verdict codes to user-facing strings
const VERDICT_MAP = {
  VERIFIED:      'True',
  LIKELY_TRUE:   'Mostly True',
  PARTLY_TRUE:   'Partially True',
  CONFLICTING:   'Misleading',
  LIKELY_FALSE:  'Misleading',
  FALSE:         'False',
  UNVERIFIABLE:  'Unable to Verify',
}

function getKeys() {
  return [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
  ].filter(Boolean)
}

async function callGroq(prompt, temperature = 0.2, maxTokens = 1600) {
  const keys = getKeys()
  if (!keys.length) throw new Error('No GROQ_API_KEY configured')

  let lastError
  for (const key of keys) {
    try {
      const response = await axios.post(
        GROQ_URL,
        {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
        },
        {
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      )

      const content = response.data?.choices?.[0]?.message?.content
      if (!content) throw new Error('Invalid response from Groq')
      return content
    } catch (error) {
      const status = error.response?.status
      if (status === 401 || status === 429) {
        lastError = error
        continue
      }
      throw new Error(`Groq API error: ${error.message}`)
    }
  }

  throw lastError || new Error('All Groq API keys exhausted.')
}

function normalizeText(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/[""]/g, '"')
    .replace(/[']/g, "'")
    .trim()
}

function normalizeUrl(url) {
  const clean = normalizeText(url)
  if (!clean) return ''
  if (/^https?:\/\//i.test(clean)) return clean
  return `https://${clean}`
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function uniq(list) {
  return [...new Set((list || []).map(item => normalizeText(item)).filter(Boolean))]
}

function isQuestionText(text) {
  const clean = normalizeText(text)
  return /\?$/.test(clean) || /^(who|what|when|where|why|how|which|whose|whom)\b/i.test(clean)
}

function extractLeadingSubject(text) {
  const clean = normalizeText(text)
  const match = clean.match(/^((?:[A-Z][\w'.-]*)(?:\s+[A-Z][\w'.-]*){0,2})\s+(?:is|was|were|became|becomes|serves|served|holds|held|heads|runs|leads|won|announced|said|claimed)\b/i)
  return normalizeText(match?.[1] || '')
}

function extractCapitalizedPhrases(text) {
  const clean = normalizeText(text)
  return uniq(clean.match(/\b(?:[A-Z]{2,}|[A-Z][a-z]+)(?:\s+(?:[A-Z]{2,}|[A-Z][a-z]+)){1,3}\b/g) || [])
}

function scoreOfficeMismatch(claim, evidenceText) {
  const claimText = normalizeText(claim).toLowerCase()
  const evidence = normalizeText(evidenceText).toLowerCase()

  const officeTitles = [
    'prime minister', 'pm', 'president', 'mayor', 'minister',
    'governor', 'ceo', 'director', 'speaker', 'chancellor', 'king', 'queen',
  ]

  const hasOfficeClaim = officeTitles.some(title => claimText.includes(title))
  const hasOfficeEvidence = officeTitles.some(title => evidence.includes(title))
  if (!hasOfficeClaim || !hasOfficeEvidence) return 0

  const claimSubject = extractLeadingSubject(claim)
  const claimNames = [claimSubject, ...extractCapitalizedPhrases(claim)].filter(Boolean)
  const evidenceNames = extractCapitalizedPhrases(evidenceText)

  if (!evidenceNames.length) return 0

  const evidenceMentionsClaimSubject = claimNames.some(name =>
    evidenceNames.some(candidate => candidate.toLowerCase() === name.toLowerCase())
  )

  if (evidenceMentionsClaimSubject) return 0

  if (evidence.includes('current') || evidence.includes('serving') || evidence.includes('sworn in') || evidence.includes('incumbent')) {
    return 24
  }

  return 18
}

function decodeDuckDuckGoUrl(href) {
  try {
    if (!href) return ''
    if (href.startsWith('/l/?')) {
      const query = new URL(`https://duckduckgo.com${href}`).searchParams.get('uddg')
      return query ? decodeURIComponent(query) : href
    }
    return href
  } catch {
    return href
  }
}

function isTrustedSource(url) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
    return (
      host.endsWith('.gov') ||
      host.endsWith('.edu') ||
      host.endsWith('.org') ||
      host.includes('who.int') ||
      host.includes('nih.gov') ||
      host.includes('cdc.gov') ||
      host.includes('sec.gov') ||
      host.includes('europa.eu') ||
      host.includes('reuters.com') ||
      host.includes('apnews.com') ||
      host.includes('bloomberg.com')
    )
  } catch {
    return false
  }
}

function sourceReliabilityScore(url, title = '') {
  const trusted = isTrustedSource(url)
  if (trusted) return 92
  const lower = `${url} ${title}`.toLowerCase()
  if (lower.includes('official') || lower.includes('press release') || lower.includes('newsroom')) return 82
  if (lower.includes('fact check') || lower.includes('report')) return 74
  if (lower.includes('blog') || lower.includes('medium') || lower.includes('reddit') || lower.includes('facebook') || lower.includes('x.com')) return 28
  return 55
}

function extractPageText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function extractClaimCandidates(text) {
  const clean = normalizeText(text)
  if (!clean) return []

  if (isQuestionText(clean)) {
    return [{
      claim: clean,
      category: 'question',
      query: buildSearchQuery(clean),
    }]
  }

  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(Boolean)

  const claimSentences = sentences.filter(sentence => {
    const lengthSignal = sentence.length >= 50
    const factSignal = /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?%?\b/.test(sentence) || /\b(?:19|20)\d{2}\b/.test(sentence) || /\b(?:million|billion|thousand|percent|km|miles|usd|rupees|euro|hours?|days?)\b/i.test(sentence)
    const entitySignal = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4}\b/.test(sentence) || /https?:\/\//i.test(sentence)
    const directQuoteSignal = /['"]/g.test(sentence)
    return lengthSignal || factSignal || entitySignal || directQuoteSignal
  })

  const highlighted = uniq(claimSentences)
    .slice(0, 12)
    .map(sentence => {
      const claim = sentence.length > 240 ? `${sentence.slice(0, 237)}...` : sentence
      return {
        claim,
        category: detectClaimCategory(claim),
        query: buildSearchQuery(claim),
      }
    })

  if (highlighted.length) return highlighted

  const chunks = clean.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 8)
  return chunks.map(chunk => ({
    claim: chunk.length > 240 ? `${chunk.slice(0, 237)}...` : chunk,
    category: detectClaimCategory(chunk),
    query: buildSearchQuery(chunk),
  }))
}

function detectClaimCategory(text) {
  const lower = normalizeText(text).toLowerCase()
  if (/\b(when|date|year|timeline|before|after|ago|today|yesterday|next week)\b/.test(lower)) return 'timeline'
  if (/\b(percentage|percent|increase|decrease|more than|less than|double|triple|million|billion|thousand|budget|revenue|price)\b/.test(lower)) return 'statistic'
  if (/\b(said|quote|quoted|statement|announced|claimed|reported)\b/.test(lower)) return 'quote'
  if (/\b(company|organization|agency|ministry|university|hospital|court|government)\b/.test(lower)) return 'organization'
  if (/\b(where|located|city|country|state|capital|province|region)\b/.test(lower)) return 'location'
  if (/\b(who|what|when|where|why|how|which|whose|whom)\b/.test(lower) || /\?$/.test(lower)) return 'question'
  return 'general fact'
}

function buildSearchQuery(text) {
  const clean = normalizeText(text)
  const filtered = clean
    .replace(/["'()\[\]{}]/g, ' ')
    .replace(/\b(?:who|what|when|where|why|how|which|whose|whom|is|are|was|were|am|be|been|being|do|does|did|can|could|would|should|will|may|might|the|a|an|and|or|but|with|from|that|this|these|those|has|have|had|for|to|of|in|on|at|by|as|it|its|their|his|her|they|them|current|latest|now)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const parts = filtered.split(' ').slice(0, 12)
  return parts.join(' ') || clean.slice(0, 80)
}

async function searchDuckDuckGo(query) {
  try {
    const response = await axios.get('https://html.duckduckgo.com/html/', {
      params: { q: query },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 20000,
    })

    const html = String(response.data || '')
    const matches = [...html.matchAll(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]

    return matches.slice(0, 5).map(match => ({
      title: extractPageText(match[2]).slice(0, 180),
      url: decodeDuckDuckGoUrl(match[1]),
    }))
  } catch {
    return []
  }
}

async function fetchPageSummary(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 20000,
      maxRedirects: 5,
      responseType: 'text',
    })

    const contentType = String(response.headers['content-type'] || '').toLowerCase()
    if (contentType.includes('text/html')) {
      return extractPageText(String(response.data || '')).slice(0, 5000)
    }

    return normalizeText(String(response.data || '')).slice(0, 5000)
  } catch {
    return ''
  }
}

function scoreSupport(claim, evidenceText) {
  const claimText = normalizeText(claim).toLowerCase()
  const evidence = normalizeText(evidenceText).toLowerCase()
  if (!claimText || !evidence) return 0

  const claimTokens = claimText
    .split(/\s+/)
    .filter(token => token.length > 4 && !/^(the|this|that|with|from|have|were|been|there|their|about|would|could|should|after|before|which|because)$/.test(token))
    .slice(0, 12)

  let score = 0
  for (const token of claimTokens) {
    if (evidence.includes(token)) score += 8
  }

  const claimNumbers = claimText.match(/\b\d{1,4}(?:,\d{3})*(?:\.\d+)?%?\b/g) || []
  for (const number of claimNumbers) {
    if (evidence.includes(number)) score += 14
  }

  if (/\b(official|according to|report|announced|confirmed|published)\b/.test(evidence)) score += 10
  if (/\b(false|denied|not true|incorrect|misleading|debunked)\b/.test(evidence)) score -= 12

  return clamp(score, 0, 100)
}

function scoreContradiction(claim, evidenceText) {
  const claimText = normalizeText(claim).toLowerCase()
  const evidence = normalizeText(evidenceText).toLowerCase()
  let score = 0

  if (/\b(never|impossible|fake|hoax|misleading|false)\b/.test(evidence)) score += 12
  if (/\b(denied|refuted|not true|no evidence|does not|did not|cannot)\b/.test(evidence)) score += 10

  const claimNumbers = claimText.match(/\b\d{1,4}(?:,\d{3})*(?:\.\d+)?%?\b/g) || []
  for (const number of claimNumbers) {
    if (evidence.includes(number)) continue
    if (/\b(total|count|price|rate|year|date|percent|million|billion)\b/.test(claimText) && /\b\d{1,4}(?:,\d{3})*(?:\.\d+)?%?\b/.test(evidence)) {
      score += 8
    }
  }

  score += scoreOfficeMismatch(claim, evidenceText)

  return clamp(score, 0, 100)
}

function scoreFreshness(evidenceText, url = '') {
  const text = normalizeText(evidenceText)
  const urlText = String(url || '')
  const yearMatches = [...text.matchAll(/\b(20\d{2})\b/g)].map(match => Number(match[1]))
  const recentYear = yearMatches.length ? Math.max(...yearMatches) : null
  const currentYear = new Date().getFullYear()

  if (recentYear && recentYear >= currentYear - 1) return 90
  if (recentYear && recentYear >= currentYear - 3) return 75
  if (/\b(updated|published|posted|breaking|latest|today|this week|this month)\b/i.test(text)) return 68
  if (/\barchive|historic|old|retrospective\b/i.test(text)) return 35
  if (/\b(202\d)\b/.test(urlText)) return 60
  return 55
}

function scoreManipulationRisk(claim) {
  const lower = normalizeText(claim).toLowerCase()
  let score = 20
  if (/\b(shocking|exposed|secret|they don't want you to know|breaking|viral|click here)\b/.test(lower)) score += 30
  if (/\b(screenshot|edited|cropped|anonymous|forwarded|leak|leaked)\b/.test(lower)) score += 20
  if (/\b(ai|chatgpt|hallucination|fake citation|fabricated|misleading)\b/.test(lower)) score += 10
  return clamp(score, 0, 100)
}

function detectVerdict(supportScore, contradictionScore, claim, evidenceCount) {
  if (evidenceCount === 0) return 'UNVERIFIABLE'
  if (contradictionScore >= supportScore + 18) return supportScore > 20 ? 'LIKELY_FALSE' : 'FALSE'
  if (supportScore >= 70 && contradictionScore < 20) return 'VERIFIED'
  if (supportScore >= 45) return 'LIKELY_TRUE'
  if (supportScore >= 25 && contradictionScore >= 10) return 'PARTLY_TRUE'
  return 'UNVERIFIABLE'
}

// LLM-based verdict override — asks Groq to judge the claim vs evidence directly.
// Returns one of: VERIFIED | LIKELY_TRUE | PARTLY_TRUE | LIKELY_FALSE | FALSE | UNVERIFIABLE
async function llmVerdictOverride(claim, evidenceSummary) {
  if (!getKeys().length) return null
  const prompt = `You are a strict fact-checking engine. Evaluate the claim against the evidence and output ONE verdict word only.

CLAIM: "${claim}"

EVIDENCE:
${evidenceSummary || 'No evidence available.'}

VERDICT OPTIONS (pick exactly one):
- VERIFIED   → claim is clearly supported by evidence
- LIKELY_TRUE → claim is probably true but not fully confirmed
- PARTLY_TRUE → claim has some truth but is incomplete or misleading
- LIKELY_FALSE → claim contradicts what the evidence suggests
- FALSE       → claim is clearly wrong based on evidence
- UNVERIFIABLE → evidence is insufficient to judge

Important rules:
- If the claim says someone holds a title/position (PM, president, CEO) but evidence shows they hold a DIFFERENT title, verdict must be FALSE or LIKELY_FALSE.
- Use your own world knowledge to supplement the evidence.
- Reply with ONLY the verdict word, nothing else.`

  try {
    const raw = normalizeText(await callGroq(prompt, 0.0, 20))
    const verdictMatch = raw.match(/\b(VERIFIED|LIKELY_TRUE|PARTLY_TRUE|LIKELY_FALSE|FALSE|UNVERIFIABLE)\b/i)
    return verdictMatch ? verdictMatch[1].toUpperCase() : null
  } catch {
    return null
  }
}

// Weighted confidence formula per design doc
function computeConfidence(sources, supportScore, contradictionScore) {
  const corroborationScore = Math.min(sources.length / 3, 1) * 100
  const reliabilityAvg = sources.reduce((s, src) => s + src.reliabilityScore, 0) / Math.max(sources.length, 1)
  const freshnessAvg = sources.reduce((s, src) => s + src.freshnessScore, 0) / Math.max(sources.length, 1)
  const raw = (corroborationScore * 0.40) + (reliabilityAvg * 0.35) + (freshnessAvg * 0.25)
  const adjusted = raw - (contradictionScore * 0.45)
  return clamp(Math.round(adjusted), 0, 98)
}

// Evidence-grounded prompt per design doc
async function generateInvestigativeReasoning(claim, verdict, confidence, evidence) {
  const evidenceSummary = evidence
    .slice(0, 4)
    .map((e, i) => `Source ${i + 1}: ${e.title || e.url}\nSnippet: ${(e.snippet || '').slice(0, 300)}`)
    .join('\n\n')

  const prompt = `You are a fact-checking analyst for Sathi AI.

CLAIM: "${claim}"
VERDICT: ${verdict}  
CONFIDENCE: ${confidence}/100

EVIDENCE RETRIEVED:
${evidenceSummary || 'No evidence was retrieved.'}

Rules:
- Do NOT guess. Only use the evidence provided above.
- If evidence is insufficient, say so explicitly.
- Write 2–4 sentences explaining why this verdict was reached.
- Reference specific sources by name.
- End with: "What the evidence shows: [one plain-language sentence]"
- Never start with "I" or chatbot phrases.

Return only the explanation text.`

  try {
    if (getKeys().length) {
      const result = await callGroq(prompt, 0.3, 400)
      return normalizeText(result).slice(0, 700)
    }
  } catch {
    // fall through to template
  }

  return summarizeClaimQualityTemplate(claim, verdict, evidence.length)
}

function summarizeClaimQualityTemplate(claim, verdict, evidenceCount) {
  const base = claim.length > 180 ? `${claim.slice(0, 177)}...` : claim
  if (verdict === 'VERIFIED' || verdict === 'True') return `${base} is strongly supported by multiple current sources. What the evidence shows: The claim aligns with available evidence.`
  if (verdict === 'LIKELY_TRUE' || verdict === 'Mostly True') return `${base} is supported, but the available evidence is not fully exhaustive. What the evidence shows: The claim is likely accurate based on partial evidence.`
  if (verdict === 'LIKELY_FALSE' || verdict === 'FALSE' || verdict === 'False' || verdict === 'Misleading') return `${base} appears to conflict with stronger evidence or source context. What the evidence shows: The claim may be inaccurate or misleading.`
  if (!evidenceCount) return `${base} could not be confirmed against trusted sources. What the evidence shows: Insufficient evidence was found to reach a verdict.`
  return `${base} has partial signals, but the claim remains incomplete or ambiguous. What the evidence shows: The evidence is mixed and a definitive verdict cannot be reached.`
}

async function analyzeClaim(claim, sourceUrl = '') {
  try {
    const searchQuery = buildSearchQuery(claim.query || claim.claim)
    const searchResults = await searchDuckDuckGo(searchQuery)

  const candidateSources = []
  if (sourceUrl) {
    candidateSources.push({ title: 'Provided source', url: sourceUrl, sourceText: await fetchPageSummary(sourceUrl) })
  }

  for (const result of searchResults.slice(0, 4)) {
    const sourceText = await fetchPageSummary(result.url)
    candidateSources.push({ ...result, sourceText })
  }

  const analyzedSources = candidateSources
    .filter(source => source.url)
    .map(source => {
      const supportScore = scoreSupport(claim.claim, source.sourceText || '')
      const contradictionScore = scoreContradiction(claim.claim, source.sourceText || '')
      return {
        title: source.title || source.url,
        url: source.url,
        snippet: (source.sourceText || '').slice(0, 260),
        reliabilityScore: sourceReliabilityScore(source.url, source.title),
        supportScore,
        contradictionScore,
        trusted: isTrustedSource(source.url),
        freshnessScore: scoreFreshness(source.sourceText || '', source.url),
      }
    })

  const evidenceCount = analyzedSources.length

  // Count sources with usable text (> 50 chars)
  const usableSources = analyzedSources.filter(src => (src.snippet || '').length > 50)

  // If fewer than 2 usable sources, try LLM-only verdict before giving up
  if (usableSources.length < 2) {
    // Still attempt LLM verdict with whatever evidence exists
    const evidenceSummary = analyzedSources
      .map((e, i) => `Source ${i + 1}: ${e.title}\nSnippet: ${e.snippet || ''}`)
      .join('\n\n')
    const llmVerdict = await llmVerdictOverride(claim.claim, evidenceSummary)
    const internalVerdict = llmVerdict || 'UNVERIFIABLE'
    const confidence = internalVerdict === 'UNVERIFIABLE' ? Math.min(computeConfidence(analyzedSources, 0, 0), 19) : clamp(computeConfidence(analyzedSources, 30, 10), 25, 65)
    const userVerdict = VERDICT_MAP[internalVerdict] || 'Unable to Verify'
    const reasoning = internalVerdict !== 'UNVERIFIABLE'
      ? await generateInvestigativeReasoning(claim.claim, userVerdict, confidence, analyzedSources)
      : summarizeClaimQualityTemplate(claim.claim, userVerdict, 0)
    return {
      claim: claim.claim,
      category: claim.category,
      query: searchQuery,
      verdict: internalVerdict,
      verdictDisplay: userVerdict,
      confidence,
      confidenceScore: confidence,
      sourceReliability: 0,
      freshnessScore: 50,
      manipulationRisk: scoreManipulationRisk(claim.claim),
      reasoning,
      aiReasoning: reasoning,
      explanation: reasoning,
      supportScore: 0,
      contradictionScore: 0,
      evidence: analyzedSources,
      supportingEvidence: analyzedSources,
      evidenceCount,
    }
  }

  const supportScore = analyzedSources.reduce((total, source) => total + source.supportScore, 0) / Math.max(evidenceCount, 1)
  const contradictionScore = analyzedSources.reduce((total, source) => total + source.contradictionScore, 0) / Math.max(evidenceCount, 1)
  const freshnessScore = analyzedSources.length
    ? Math.round(analyzedSources.reduce((total, source) => total + source.freshnessScore, 0) / analyzedSources.length)
    : 50
  const sourceReliability = analyzedSources.length
    ? Math.round(analyzedSources.reduce((total, source) => total + source.reliabilityScore, 0) / analyzedSources.length)
    : 40

  // Keyword-based verdict first
  let internalVerdict = detectVerdict(supportScore, contradictionScore, claim.claim, evidenceCount)

  // LLM override — let Groq re-judge using evidence + world knowledge
  // This catches cases like "Balen Shah is PM" where keyword scorer can't detect the contradiction
  const evidenceSummary = analyzedSources
    .slice(0, 4)
    .map((e, i) => `Source ${i + 1}: ${e.title}\nSnippet: ${e.snippet || ''}`)
    .join('\n\n')
  const llmVerdict = await llmVerdictOverride(claim.claim, evidenceSummary)
  // Use LLM verdict if it contradicts the keyword verdict OR keyword said UNVERIFIABLE
  if (llmVerdict && (internalVerdict === 'UNVERIFIABLE' || llmVerdict === 'FALSE' || llmVerdict === 'LIKELY_FALSE')) {
    internalVerdict = llmVerdict
  }

  const userVerdict = VERDICT_MAP[internalVerdict] || 'Unable to Verify'
  const confidence = computeConfidence(analyzedSources, supportScore, contradictionScore)
  const manipulationRisk = scoreManipulationRisk(claim.claim)

  const sortedEvidence = [...analyzedSources]
    .sort((a, b) => b.reliabilityScore + b.supportScore - (a.reliabilityScore + a.supportScore))

  const reasoning = await generateInvestigativeReasoning(
    claim.claim,
    userVerdict,
    confidence,
    sortedEvidence
  )

  return {
    claim: claim.claim,
    category: claim.category,
    query: searchQuery,
    verdict: internalVerdict,
    verdictDisplay: userVerdict,
    confidence,
    confidenceScore: confidence,
    sourceReliability,
    freshnessScore,
    manipulationRisk,
    reasoning,
    aiReasoning: reasoning,
    explanation: reasoning,
    supportScore: Math.round(supportScore),
    contradictionScore: Math.round(contradictionScore),
    evidence: sortedEvidence,
    supportingEvidence: sortedEvidence,
    evidenceCount,
  }
  } catch (err) {
    // Never let a single claim crash the whole analysis
    const fallbackReasoning = summarizeClaimQualityTemplate(claim.claim, 'Unable to Verify', 0)
    return {
      claim: claim.claim,
      category: claim.category || 'general fact',
      query: '',
      verdict: 'UNVERIFIABLE',
      verdictDisplay: 'Unable to Verify',
      confidence: 0,
      confidenceScore: 0,
      sourceReliability: 0,
      freshnessScore: 50,
      manipulationRisk: scoreManipulationRisk(claim.claim),
      reasoning: fallbackReasoning,
      aiReasoning: fallbackReasoning,
      explanation: fallbackReasoning,
      supportScore: 0,
      contradictionScore: 0,
      evidence: [],
      supportingEvidence: [],
      evidenceCount: 0,
    }
  }
}

function parseGroqClaims(raw) {
  const match = raw.match(/\[[\s\S]*\]/) || raw.match(/\{[\s\S]*\}/)
  if (!match) return []

  const parsed = JSON.parse(match[0])
  const claims = Array.isArray(parsed) ? parsed : parsed.claims || []
  return claims
    .map(claim => ({
      claim: normalizeText(claim.claim || claim.text || claim.statement || ''),
      category: normalizeText(claim.category || claim.type || 'general fact') || 'general fact',
      query: normalizeText(claim.query || claim.claim || claim.text || ''),
    }))
    .filter(entry => entry.claim)
}

function fallbackClaims(text) {
  return extractClaimCandidates(text)
}

async function extractClaims(text) {
  const sourceText = normalizeText(text)
  if (!sourceText) return []

  try {
    if (getKeys().length) {
      const raw = await callGroq(
        `You are an autonomous fact-extraction engine. Your job is to extract every verifiable factual claim from the input below.

RULES:
- NEVER say "I need more information" or ask for clarification
- Even if the input is short, vague, or unclear — infer probable claims and extract them
- Treat names, dates, statistics, quotes, locations, and policy statements as claims
      - If the input is a question, rewrite it into the underlying factual claim or answer target before extracting claims
- If the input is a single word or phrase, treat it as a claim about that topic
- Return ONLY valid JSON: {"claims":[{"claim":"...","category":"...","query":"..."}]}
- Limit to 10 claims maximum
- Each claim must be independently verifiable

INPUT:
${sourceText}`,
        0.1,
        1200
      )
      const claims = parseGroqClaims(raw)
      if (claims.length) return claims.slice(0, 10)
    }
  } catch {
    // fall through to heuristic extraction
  }

  return fallbackClaims(sourceText).slice(0, 10)
}

async function buildAnalysisBundle({ inputText = '', sourceUrl = '', imageText = '', inputType = 'text' }) {
  const normalizedInput = normalizeText(inputText)
  const normalizedUrl = normalizeUrl(sourceUrl)
  const normalizedImage = normalizeText(imageText)

  const fetchedUrlText = normalizedUrl ? await fetchPageSummary(normalizedUrl) : ''
  const combinedText = [normalizedInput, normalizedImage, fetchedUrlText].filter(Boolean).join('\n\n')
  const claims = await extractClaims(combinedText || normalizedInput || fetchedUrlText)
  const analyzedClaims = []

  for (const claim of claims) {
    analyzedClaims.push(await analyzeClaim(claim, normalizedUrl))
  }

  const total = analyzedClaims.length
  const verifiedCount = analyzedClaims.filter(item => item.verdict === 'VERIFIED').length
  const likelyTrueCount = analyzedClaims.filter(item => item.verdict === 'LIKELY_TRUE').length
  const likelyFalseCount = analyzedClaims.filter(item => item.verdict === 'LIKELY_FALSE' || item.verdict === 'FALSE').length
  const unverifiableCount = analyzedClaims.filter(item => item.verdict === 'UNVERIFIABLE').length
  const averageConfidence = total
    ? Math.round(analyzedClaims.reduce((sum, item) => sum + item.confidence, 0) / total)
    : 0
  const averageReliability = total
    ? Math.round(analyzedClaims.reduce((sum, item) => sum + item.sourceReliability, 0) / total)
    : 0
  const averageFreshness = total
    ? Math.round(analyzedClaims.reduce((sum, item) => sum + item.freshnessScore, 0) / total)
    : 0
  const averageRisk = total
    ? Math.round(analyzedClaims.reduce((sum, item) => sum + item.manipulationRisk, 0) / total)
    : 0

  const supportedCount = verifiedCount + likelyTrueCount
  const hasFalseClaims = likelyFalseCount > 0

  const overallStatus = verifiedCount > 0 && unverifiableCount === 0 && likelyFalseCount === 0
    ? 'VERIFIED'
    : supportedCount > 0 && hasFalseClaims && supportedCount >= likelyFalseCount
      ? 'PARTLY_TRUE'
      : supportedCount > 0 && hasFalseClaims && likelyFalseCount > supportedCount
        ? 'CONFLICTING'
        : supportedCount > 0
          ? 'PARTLY_TRUE'
          : hasFalseClaims
            ? 'FALSE'
            : 'UNVERIFIABLE'

  // Map internal overallStatus to user-facing verdict string
  const topLevelVerdict = VERDICT_MAP[overallStatus] || 'Unable to Verify'

  // confidenceScore capped to < 20 when no evidence / unverifiable
  const confidenceScore = overallStatus === 'UNVERIFIABLE' && averageConfidence >= 20
    ? Math.min(averageConfidence, 19)
    : clamp(averageConfidence, 0, 98)

  const liveNotes = [
    `${total} claims extracted`,
    `${supportedCount} claims supported`,
    `${likelyFalseCount} claims challenged`,
    `${averageReliability}% average source reliability`,
  ]

  // Build top-level explanation from liveNotes
  const explanation = liveNotes.join('. ') + '.'

  // Collect all evidence items, deduplicated by URL (max 5)
  const seenUrls = new Set()
  const allEvidence = []
  for (const analyzedClaim of analyzedClaims) {
    for (const src of (analyzedClaim.evidence || [])) {
      if (src.url && !seenUrls.has(src.url)) {
        seenUrls.add(src.url)
        allEvidence.push(src)
        if (allEvidence.length >= 5) break
      }
    }
    if (allEvidence.length >= 5) break
  }

  // Collect unique references (URLs) from all evidence
  const references = uniq(allEvidence.map(src => src.url).filter(Boolean))

  // AI reasoning from the first claim, or a summary if multiple
  const aiReasoning = analyzedClaims.length === 1
    ? (analyzedClaims[0].reasoning || analyzedClaims[0].aiReasoning || '')
    : analyzedClaims.length > 1
      ? analyzedClaims.map((c, i) => `Claim ${i + 1}: ${c.reasoning || c.aiReasoning || ''}`).join('\n\n')
      : ''

  return {
    // New top-level fields (API contract)
    verdict: topLevelVerdict,
    confidenceScore,
    explanation,
    supportingEvidence: allEvidence,
    references,
    aiReasoning,

    // Legacy fields (backward compat with existing Verification.jsx UI)
    inputType,
    sourceUrl: normalizedUrl,
    lastChecked: new Date().toISOString(),
    claims: analyzedClaims,
    summary: {
      totalClaims: total,
      verifiedCount,
      likelyTrueCount,
      likelyFalseCount,
      unverifiableCount,
      overallStatus,
      confidence: averageConfidence,
      sourceReliability: averageReliability,
      freshness: averageFreshness,
      manipulationRisk: averageRisk,
    },
    liveNotes,
    evidenceSeed: fetchedUrlText ? fetchedUrlText.slice(0, 600) : '',
  }
}

export async function verifyFactClaims(payload) {
  try {
    return await buildAnalysisBundle(payload)
  } catch (err) {
    console.error('[verifyFactClaims] fatal:', err.message)
    // Return a graceful degraded result instead of throwing 500
    return {
      verdict: 'Unable to Verify',
      confidenceScore: 0,
      explanation: 'Verification encountered an error. Please try again.',
      supportingEvidence: [],
      references: [],
      aiReasoning: '',
      inputType: payload.inputType || 'text',
      sourceUrl: payload.sourceUrl || '',
      lastChecked: new Date().toISOString(),
      claims: [],
      summary: { totalClaims: 0, verifiedCount: 0, likelyTrueCount: 0, likelyFalseCount: 0, unverifiableCount: 0, overallStatus: 'UNVERIFIABLE', confidence: 0, sourceReliability: 0, freshness: 50, manipulationRisk: 20 },
      liveNotes: ['0 claims extracted', 'Verification error — please retry'],
      evidenceSeed: '',
    }
  }
}

export async function refreshVerification(payload) {
  return verifyFactClaims(payload)
}
