import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { BRAND } from '../utils/brand'
import SathiFooter from './SathiFooter'

/* Reusable animation props for every section */
const sectionAnim = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, ease: 'easeOut' },
}

/* Shared page background */
const pageBg = {
  background: '#050816',
  color: 'var(--text1)',
  minHeight: '100vh',
  overflowX: 'hidden',
}

/* Glassmorphism card helper */
const glassCard = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 20,
  backdropFilter: 'blur(12px)',
}

export default function LoginGate() {
  const { signIn } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setLoading(true)
    try {
      await signIn()
      toast.success('Welcome to Sathi AI!')
    } catch {
      toast.error('Sign-in cancelled')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={pageBg}>
      {/* ── 1. HERO ────────────────────────────────────────────── */}
      <motion.section
        {...sectionAnim}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '40px 24px',
          position: 'relative',
          background:
            'radial-gradient(circle at 50% 30%, rgba(59,130,246,0.15), transparent 55%), radial-gradient(circle at 80% 70%, rgba(16,185,129,0.10), transparent 45%), #050816',
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            background: BRAND.logoGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            fontWeight: 900,
            color: '#fff',
            marginBottom: 24,
            boxShadow: '0 8px 40px rgba(59,130,246,0.35)',
          }}
        >
          {BRAND.logoLetter}
        </div>

        {/* Brand name */}
        <h1
          style={{
            fontSize: 'clamp(3rem, 10vw, 6rem)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            margin: '0 0 12px',
            background: BRAND.logoGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1,
          }}
        >
          Sathi AI
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: 'clamp(1rem, 3vw, 1.35rem)',
            color: 'var(--text2)',
            marginBottom: 20,
            maxWidth: 480,
          }}
        >
          {BRAND.tagline}
        </p>

        {/* Hackathon badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 18px',
            borderRadius: 999,
            background: 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(59,130,246,0.30)',
            color: '#93c5fd',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 36,
          }}
        >
          🏆 Built for the NCIT Hackathon by Team Bug Bahadur
        </div>

        {/* Primary CTA */}
        <SignInButton loading={loading} onClick={handleSignIn} />

        {/* Scroll-down chevron */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          style={{ marginTop: 52, color: 'var(--text3)', opacity: 0.6 }}
        >
          <ChevronDown size={32} />
        </motion.div>
      </motion.section>

      {/* ── 2. ABOUT SATHI AI ──────────────────────────────────── */}
      <motion.section
        {...sectionAnim}
        style={{ maxWidth: 780, margin: '0 auto', padding: '80px 24px' }}
      >
        <SectionHeading>About Sathi AI</SectionHeading>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.85,
            color: 'var(--text2)',
            marginBottom: 32,
            textAlign: 'center',
          }}
        >
          Sathi AI is an intelligent multilingual AI platform created to make trustworthy
          information more accessible for people in Nepal. The project combines conversational AI,
          government service guidance, market intelligence, AI-powered price verification, and fact
          checking into one seamless experience.
        </p>

        {/* Capability pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
          }}
        >
          {['🤖 AI Chat', '✅ Fact Checker', '📊 Market Prices', '🏛️ Gov Services'].map(
            (pill) => (
              <span
                key={pill}
                style={{
                  padding: '8px 20px',
                  borderRadius: 999,
                  background: 'rgba(59,130,246,0.10)',
                  border: '1px solid rgba(59,130,246,0.25)',
                  color: '#93c5fd',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {pill}
              </span>
            ),
          )}
        </div>
      </motion.section>

      {/* ── 3. WHY WE BUILT SATHI AI ───────────────────────────── */}
      <motion.section
        {...sectionAnim}
        style={{ padding: '80px 24px', background: 'rgba(255,255,255,0.02)' }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <SectionHeading>Why We Built Sathi AI</SectionHeading>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.85,
              color: 'var(--text2)',
            }}
          >
            Access to trustworthy, multilingual information remains a significant challenge across
            Nepal. Misinformation spreads quickly, government services are hard to navigate without
            guidance, and market prices vary widely without transparency. Sathi AI was built to
            address these real-world problems — providing a single, reliable platform where anyone
            can ask questions in Nepali, Hindi, or English, verify claims against real evidence, and
            access actionable information about public services and local markets.
          </p>
        </div>
      </motion.section>

      {/* ── 4. ABOUT THE NCIT HACKATHON ────────────────────────── */}
      <motion.section
        {...sectionAnim}
        style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px' }}
      >
        <SectionHeading>About the NCIT Hackathon</SectionHeading>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.8,
            color: 'var(--text2)',
            textAlign: 'center',
            marginBottom: 40,
            maxWidth: 640,
            margin: '0 auto 40px',
          }}
        >
          {BRAND.institution} hosts the {BRAND.hackathon} to encourage students to build innovative
          AI solutions that address real challenges in Nepal and beyond.
        </p>

        {/* Info grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
          }}
        >
          {[
            { label: 'Project', value: 'Sathi AI' },
            { label: 'Hackathon', value: BRAND.hackathon },
            { label: 'Institution', value: 'NCIT' },
            { label: 'Team', value: BRAND.team },
          ].map((item) => (
            <div key={item.label} style={{ ...glassCard, padding: '20px 24px', textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--text3)',
                  marginBottom: 8,
                }}
              >
                {item.label}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text1)' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── 5. MEET TEAM BUG BAHADUR ───────────────────────────── */}
      <motion.section
        {...sectionAnim}
        style={{ padding: '80px 24px', background: 'rgba(255,255,255,0.02)' }}
      >
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <SectionHeading>Meet Team Bug Bahadur</SectionHeading>

          <div
            style={{
              ...glassCard,
              padding: '36px 32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            {/* Team name badge */}
            <div
              style={{
                fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
                fontWeight: 900,
                background: BRAND.logoGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em',
              }}
            >
              Bug Bahadur
            </div>

            <div
              style={{
                height: 2,
                width: 60,
                background: BRAND.logoGradient,
                borderRadius: 2,
              }}
            />

            <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 420 }}>
              A team of passionate developers from{' '}
              <strong style={{ color: 'var(--text1)' }}>
                Nepal College of Information Technology (NCIT)
              </strong>{' '}
              competing in the NCIT Hackathon with the vision of making AI accessible for every
              Nepali.
            </p>

            <div
              style={{
                fontSize: 13,
                color: 'var(--text3)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              🏫 {BRAND.institution}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── 6. CALL TO ACTION ──────────────────────────────────── */}
      <motion.section
        {...sectionAnim}
        style={{
          padding: '100px 24px',
          textAlign: 'center',
          background:
            'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.10), transparent 60%), #050816',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(1.8rem, 5vw, 3rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: 16,
            color: 'var(--text1)',
          }}
        >
          Ready to experience Sathi AI?
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: 16, marginBottom: 36 }}>
          Sign in with your Google account to get started — it only takes a moment.
        </p>
        <SignInButton loading={loading} onClick={handleSignIn} />
      </motion.section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <SathiFooter />
    </div>
  )
}

/* ── Shared sub-components ─────────────────────────────────── */

function SectionHeading({ children }) {
  return (
    <h2
      style={{
        fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
        fontWeight: 800,
        letterSpacing: '-0.03em',
        textAlign: 'center',
        marginBottom: 24,
        color: 'var(--text1)',
      }}
    >
      {children}
    </h2>
  )
}

function SignInButton({ loading, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '15px 36px',
        borderRadius: 14,
        background: loading ? 'rgba(255,255,255,0.05)' : BRAND.logoGradient,
        border: '1px solid rgba(255,255,255,0.08)',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: 16,
        fontWeight: 700,
        color: '#fff',
        boxShadow: '0 12px 40px rgba(59,130,246,0.30)',
        minWidth: 220,
      }}
    >
      {loading ? (
        <>
          <span
            className="spin"
            style={{ borderColor: 'rgba(255,255,255,0.35)', borderTopColor: 'transparent' }}
          />
          Signing in…
        </>
      ) : (
        <>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Sign in with Google
        </>
      )}
    </motion.button>
  )
}
