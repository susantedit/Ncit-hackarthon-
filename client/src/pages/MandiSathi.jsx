import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Search, RefreshCw, MapPin, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'

const CATEGORY_LABELS = {
  vegetable: '🥬 Vegetables',
  fruit: '🍎 Fruits',
  grain: '🌾 Grains & Pulses',
  meat: '🥩 Meat & Eggs',
  dairy: '🥛 Dairy',
  spice: '🌶️ Spices',
  other: '🧂 Others',
}

const CATEGORY_COLORS = {
  vegetable: '#10b981',
  fruit:     '#f59e0b',
  grain:     '#a855f7',
  meat:      '#ef4444',
  dairy:     '#06b6d4',
  spice:     '#f97316',
  other:     '#3b82f6',
}

export default function MandiSathi() {
  const [prices, setPrices] = useState([])
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [search, setSearch] = useState('')
  const [district, setDistrict] = useState('')
  const [category, setCategory] = useState('')

  const load = async (params = {}) => {
    setLoading(true)
    try {
      const query = {}
      if (params.search ?? search) query.search = params.search ?? search
      if (params.district ?? district) query.district = params.district ?? district
      if (params.category ?? category) query.category = params.category ?? category
      const res = await api.getMarketPrices(query)
      setPrices(res.prices || [])
      if ((res.prices || []).length === 0 && !Object.keys(query).length) {
        await seedData()
      }
    } catch (err) {
      if (prices.length === 0) await seedData()
      else toast.error('Failed to load prices')
    } finally {
      setLoading(false)
    }
  }

  const seedData = async () => {
    setSeeding(true)
    try {
      await api.seedMarketData()
      const res = await api.getMarketPrices({})
      setPrices(res.prices || [])
    } catch { /* ignore */ }
    finally { setSeeding(false) }
  }

  const loadDistricts = async () => {
    try {
      const d = await api.getMarketDistricts()
      setDistricts(d || [])
    } catch { /* ignore */ }
  }

  useEffect(() => {
    load()
    loadDistricts()
    // Patch existing DB with meat data if missing
    api.seedMarketData().catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(() => load({ search, district, category }), 350)
    return () => clearTimeout(t)
  }, [search, district, category])

  // Group prices by category
  const grouped = {}
  for (const p of prices) {
    const cat = p.category || 'other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(p)
  }

  return (
    <div className="page-wrapper">
      <div className="page-content-wide">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text1)', marginBottom: 2, fontFamily: "'Space Grotesk',system-ui,sans-serif" }}>
              मण्डी साथी — Mandi Sathi
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text3)' }}>Live vegetable and commodity prices across Nepal</p>
          </div>
          <button onClick={load} style={{ marginLeft: 'auto', padding: '8px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <div style={{ flex: '1 1 200px', position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search commodity..."
              className="inp"
              style={{ paddingLeft: 34, fontSize: 13 }}
            />
          </div>
          <select value={district} onChange={e => setDistrict(e.target.value)}
            style={{ flex: '1 1 160px', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text1)', fontSize: 13, cursor: 'pointer' }}>
            <option value="">All Districts</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={category} onChange={e => setCategory(e.target.value)}
            style={{ flex: '1 1 160px', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text1)', fontSize: 13, cursor: 'pointer' }}>
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {loading || seeding ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: '#f59e0b', margin: '0 auto 16px' }} />
            <div style={{ color: 'var(--text3)', fontSize: 13 }}>{seeding ? 'Loading market data...' : 'Fetching prices...'}</div>
          </div>
        ) : prices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
            <TrendingUp size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No prices found</div>
            <div style={{ fontSize: 13, marginBottom: 16 }}>Try a different search or filter</div>
            <button onClick={seedData} className="btn" style={{ width: 'auto', paddingInline: 24 }}>Load Sample Data</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>{prices.length} price records{district ? ` in ${district}` : ''}</div>
            {/* Average price summary */}
            {prices.length > 0 && (() => {
              const avg = Math.round(prices.reduce((s, p) => s + p.price, 0) / prices.length)
              const avgMeat = prices.filter(p => p.category === 'meat')
              const avgVeg = prices.filter(p => p.category === 'vegetable')
              const avgGrain = prices.filter(p => p.category === 'grain')
              const avgOf = (arr) => arr.length ? Math.round(arr.reduce((s,p)=>s+p.price,0)/arr.length) : null
              return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                  {[
                    { label: 'Avg All', value: `NPR ${avg}`, color: '#3b82f6' },
                    avgOf(avgVeg) && { label: 'Avg Vegetables', value: `NPR ${avgOf(avgVeg)}`, color: '#10b981' },
                    avgOf(avgMeat) && { label: 'Avg Meat', value: `NPR ${avgOf(avgMeat)}`, color: '#ef4444' },
                    avgOf(avgGrain) && { label: 'Avg Grains', value: `NPR ${avgOf(avgGrain)}`, color: '#a855f7' },
                  ].filter(Boolean).map(({ label, value, color }) => (
                    <div key={label} style={{ padding: '8px 14px', borderRadius: 12, background: 'var(--glass)', border: `1px solid ${color}30`, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                      <span style={{ fontSize: 15, fontWeight: 900, color, fontFamily: "'Space Grotesk',system-ui,sans-serif" }}>{value}</span>
                    </div>
                  ))}
                </div>
              )
            })()}
            {Object.entries(grouped).map(([cat, items]) => (
              <motion.div key={cat} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: CATEGORY_COLORS[cat] || '#3b82f6', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {CATEGORY_LABELS[cat] || cat}
                  <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400 }}>({items.length} items)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {items.map((p, i) => (
                    <motion.div key={`${p._id || i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="card" style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', marginBottom: 4 }}>{p.commodity}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                        <span style={{ fontSize: 18, fontWeight: 900, color: CATEGORY_COLORS[cat] || '#3b82f6', fontFamily: "'Space Grotesk',system-ui,sans-serif" }}>
                          NPR {p.price}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>/{p.unit}</span>
                      </div>
                      {(p.minPrice || p.maxPrice) && (
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>
                          Range: NPR {p.minPrice}–{p.maxPrice}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text3)' }}>
                        <MapPin size={9} /> {p.district}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
