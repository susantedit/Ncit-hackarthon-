import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { BRAND } from '../utils/brand'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Mic, Brain, BookOpen, History, Sun, Moon, Timer, CalendarDays, Menu, X, Shield, Languages, LogIn, UserCircle, Radio, MoreHorizontal, BookHeart, Gamepad2, ShieldCheck, TrendingUp, Building2, ScanLine, MessageCircle } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import toast from 'react-hot-toast'

// All links — NO Verify
const links = [
  { to: '/',           label: 'Home',       Icon: Home },
  { to: '/chat',       label: 'AI Chat',    Icon: MessageCircle },
  { to: '/mandi',      label: 'Mandi',      Icon: TrendingUp },
  { to: '/government', label: 'Gov',        Icon: Building2 },
  { to: '/fairscan',   label: 'FairScan',   Icon: ScanLine },
  { to: '/interviews', label: 'Interviews', Icon: Mic },
  { to: '/creator',    label: 'Creator',    Icon: Mic },
  { to: '/assistant',  label: 'Assistant',  Icon: Brain },
  { to: '/study',      label: 'Study',      Icon: BookOpen },
  { to: '/focus',      label: 'Focus',      Icon: Timer },
  { to: '/planner',    label: 'Planner',    Icon: CalendarDays },
  { to: '/safety',     label: 'Safety',     Icon: Shield },
  { to: '/translator', label: 'Translator', Icon: Languages },
  { to: '/podcast',    label: 'Podcast',    Icon: Radio },
  { to: '/journal',    label: 'Journal',    Icon: BookHeart },
  { to: '/games',      label: 'Games',      Icon: Gamepad2 },
  { to: '/profile',    label: 'Profile',    Icon: UserCircle },
  { to: '/history',    label: 'History',    Icon: History },
]

// Mobile bottom nav primary tabs
const primaryLinks = [
  { to: '/',           label: 'Home',    Icon: Home },
  { to: '/chat',       label: 'AI Chat', Icon: MessageCircle },
  { to: '/mandi',      label: 'Mandi',   Icon: TrendingUp },
  { to: '/government', label: 'Gov',     Icon: Building2 },
  { to: '/fairscan',   label: 'FairScan',Icon: ScanLine },
]

// Mobile "More" drawer
const moreLinks = [
  { to: '/interviews', label: 'Interviews', Icon: Mic },
  { to: '/creator',    label: 'Creator',    Icon: Mic },
  { to: '/assistant',  label: 'Assistant',  Icon: Brain },
  { to: '/study',      label: 'Study',      Icon: BookOpen },
  { to: '/focus',      label: 'Focus',      Icon: Timer },
  { to: '/planner',    label: 'Planner',    Icon: CalendarDays },
  { to: '/safety',     label: 'Safety',     Icon: Shield },
  { to: '/translator', label: 'Translator', Icon: Languages },
  { to: '/podcast',    label: 'Podcast',    Icon: Radio },
  { to: '/journal',    label: 'Journal',    Icon: BookHeart },
  { to: '/games',      label: 'Games',      Icon: Gamepad2 },
  { to: '/profile',    label: 'Profile',    Icon: UserCircle },
  { to: '/history',    label: 'History',    Icon: History },
]

export default function Navbar() {
  const { dark, toggle } = useTheme()
  const { user, displayName, avatarUrl, signIn, userId } = useAuth()
  const [open, setOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)

  useEffect(() => {
    if (!userId) return
    api.getHistory(userId).then(data => setSessionCount(data.length)).catch(() => {})
  }, [userId])

  const handleSignIn = async () => {
    try {
      await signIn()
      toast.success('Welcome!')
    } catch {
      toast.error('Sign-in cancelled')
    }
  }

  const initials = displayName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <>
      {/* ── Desktop navbar ── */}
      <nav className="navbar">
        <NavLink to="/" className="nav-logo">
          <div className="nav-logo-icon" style={{ background: BRAND.logoGradient }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', fontFamily: 'Syne,system-ui,sans-serif', letterSpacing: -1 }}>
              {BRAND.logoLetter}
            </span>
          </div>
        </NavLink>

        {/* Scrollable links strip — all links, no overflow */}
        <div className="nav-links">
          {links.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
              <Icon size={12} />
              {label}
              {to === '/history' && sessionCount > 0 && (
                <span style={{ marginLeft: 3, fontSize: 9, fontWeight: 800, padding: '1px 4px', borderRadius: 8, background: '#8b5cf6', color: '#fff', lineHeight: 1.4 }}>
                  {sessionCount > 99 ? '99+' : sessionCount}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Theme toggle */}
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          className="icon-btn" onClick={toggle}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </motion.button>

        {/* Auth */}
        {user ? (
          <NavLink to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--glass)', textDecoration: 'none', fontSize: 12, fontWeight: 600, color: 'var(--text1)', flexShrink: 0 }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>{initials}</div>
            }
            <span style={{ maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName?.split(' ')[0]}</span>
          </NavLink>
        ) : (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSignIn}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text1)', flexShrink: 0 }}>
            <LogIn size={13} /><span>Sign in</span>
          </motion.button>
        )}
      </nav>

      {/* ── Mobile top bar ── */}
      <div className="mob-top">
        <NavLink to="/" className="nav-logo">
          <div className="nav-logo-icon" style={{ width: 30, height: 30, background: BRAND.logoGradient }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', fontFamily: 'Syne,system-ui,sans-serif' }}>{BRAND.logoLetter}</span>
          </div>
        </NavLink>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={toggle}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          {user
            ? <NavLink to="/profile" style={{ display: 'flex' }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
                  : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff' }}>{initials}</div>
                }
              </NavLink>
            : <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={handleSignIn}><LogIn size={14} /></button>
          }
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => setOpen(o => !o)}>
            {open ? <X size={14} /> : <Menu size={14} />}
          </button>
        </div>
      </div>

      {/* ── Mobile full dropdown ── */}
      <AnimatePresence>
        {open && (
          <motion.div className="mob-menu"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {links.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) => 'mob-link' + (isActive ? ' active' : '')}
                onClick={() => setOpen(false)}>
                <Icon size={15} />{label}
              </NavLink>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile bottom nav ── */}
      <nav className="bot-nav">
        {primaryLinks.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => 'bot-link' + (isActive ? ' active' : '')}>
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
        <button className="bot-link" onClick={() => setMoreOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: moreOpen ? '#8b5cf6' : 'var(--text3)' }}>
          <MoreHorizontal size={20} />
          <span>More</span>
        </button>
      </nav>

      {/* ── Mobile More drawer ── */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1001 }} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{ position: 'fixed', bottom: 60, left: 0, right: 0, background: 'var(--nav)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid var(--nav-b)', borderRadius: '20px 20px 0 0', padding: '12px 12px 4px', zIndex: 1002 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 10px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                {moreLinks.map(({ to, label, Icon }) => (
                  <NavLink key={to} to={to}
                    onClick={() => setMoreOpen(false)}
                    style={({ isActive }) => ({
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      padding: '10px 4px', borderRadius: 10, textDecoration: 'none',
                      fontSize: 10, fontWeight: 600,
                      color: isActive ? '#8b5cf6' : 'var(--text2)',
                      background: isActive ? 'rgba(139,92,246,0.12)' : 'transparent',
                      position: 'relative',
                    })}>
                    {({ isActive }) => (
                      <>
                        <Icon size={20} color={isActive ? '#8b5cf6' : 'var(--text2)'} />
                        {label}
                        {to === '/history' && sessionCount > 0 && (
                          <span style={{ position: 'absolute', top: 6, right: 10, fontSize: 8, fontWeight: 800, padding: '1px 4px', borderRadius: 8, background: '#8b5cf6', color: '#fff', lineHeight: 1.4 }}>
                            {sessionCount > 99 ? '99+' : sessionCount}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
              <div style={{ height: 8 }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
