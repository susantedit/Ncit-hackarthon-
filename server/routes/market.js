import { Router } from 'express'
import MarketPrice from '../models/MarketPrice.js'

const router = Router()

/**
 * GET /api/market/prices
 * Query params: district, category, commodity, limit
 */
router.get('/prices', async (req, res) => {
  try {
    const { district, category, commodity, limit = 50, search } = req.query

    const query = {}
    if (district)   query.district  = new RegExp(district, 'i')
    if (category)   query.category  = category
    if (commodity)  query.commodity = new RegExp(commodity, 'i')
    if (search) {
      query.$or = [
        { commodity: new RegExp(search, 'i') },
        { district:  new RegExp(search, 'i') },
      ]
    }

    const prices = await MarketPrice.find(query)
      .sort({ updatedAt: -1 })
      .limit(Math.min(parseInt(limit, 10) || 50, 200))
      .lean()

    res.json({ prices, total: prices.length })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch prices' })
  }
})

/**
 * GET /api/market/districts
 * Returns list of distinct districts.
 */
router.get('/districts', async (req, res) => {
  try {
    const districts = await MarketPrice.distinct('district')
    res.json(districts.sort())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/market/commodities
 * Returns list of distinct commodities.
 */
router.get('/commodities', async (req, res) => {
  try {
    const commodities = await MarketPrice.distinct('commodity')
    res.json(commodities.sort())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/market/seed
 * Seeds initial market price data (dev/admin use only).
 */
router.post('/seed', async (req, res) => {
  try {
    const count = await MarketPrice.countDocuments()
    // Check if meat data exists specifically
    const meatCount = await MarketPrice.countDocuments({ category: 'meat' })
    if (count > 0 && meatCount > 0) {
      return res.json({ message: `Already have ${count} price records. No seeding needed.` })
    }

    if (count === 0) {
      // Fresh seed
      const seed = generateSeedData()
      await MarketPrice.insertMany(seed)
      return res.json({ message: `Seeded ${seed.length} market price records.` })
    }

    // Existing data but missing meat — add meat only
    const meatRecords = generateMeatData()
    await MarketPrice.insertMany(meatRecords)
    return res.json({ message: `Added ${meatRecords.length} meat price records.` })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Meat data generator (separate so it can be patched into existing DBs) ────
function generateMeatData() {
  const now = new Date()
  const districts = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Chitwan', 'Butwal', 'Birgunj', 'Dharan', 'Biratnagar', 'Nepalgunj']

  const meats = [
    { commodity: 'Chicken (Broiler)',  category: 'meat', unit: 'kg', basePrice: 280 },
    { commodity: 'Chicken (Country)',  category: 'meat', unit: 'kg', basePrice: 600 },
    { commodity: 'Mutton (Goat)',      category: 'meat', unit: 'kg', basePrice: 1100 },
    { commodity: 'Buff (Buffalo)',     category: 'meat', unit: 'kg', basePrice: 520 },
    { commodity: 'Pork',               category: 'meat', unit: 'kg', basePrice: 480 },
    { commodity: 'Fish (Rohu)',        category: 'meat', unit: 'kg', basePrice: 300 },
    { commodity: 'Fish (Catfish)',     category: 'meat', unit: 'kg', basePrice: 350 },
    { commodity: 'Eggs',               category: 'meat', unit: 'dozen', basePrice: 240 },
  ]

  const records = []
  for (const district of districts) {
    for (const item of meats) {
      const variation = 1 + (Math.random() * 0.2 - 0.10)
      const price = Math.round(item.basePrice * variation)
      records.push({
        commodity: item.commodity,
        category: item.category,
        district,
        price,
        minPrice: Math.round(price * 0.90),
        maxPrice: Math.round(price * 1.10),
        unit: item.unit,
        source: 'seed-data',
        updatedAt: new Date(now - Math.random() * 86400000 * 3),
      })
    }
  }
  return records
}

// ── Seed data generator ───────────────────────────────────────────────────────
function generateSeedData() {
  const now = new Date()
  const districts = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Chitwan', 'Butwal', 'Birgunj', 'Dharan', 'Biratnagar', 'Nepalgunj']

  const vegetables = [
    { commodity: 'Tomato',    category: 'vegetable', unit: 'kg',  basePrice: 60 },
    { commodity: 'Potato',    category: 'vegetable', unit: 'kg',  basePrice: 40 },
    { commodity: 'Onion',     category: 'vegetable', unit: 'kg',  basePrice: 55 },
    { commodity: 'Garlic',    category: 'vegetable', unit: 'kg',  basePrice: 220 },
    { commodity: 'Ginger',    category: 'vegetable', unit: 'kg',  basePrice: 180 },
    { commodity: 'Cauliflower',category: 'vegetable',unit: 'kg',  basePrice: 50 },
    { commodity: 'Cabbage',   category: 'vegetable', unit: 'kg',  basePrice: 35 },
    { commodity: 'Carrot',    category: 'vegetable', unit: 'kg',  basePrice: 60 },
    { commodity: 'Spinach',   category: 'vegetable', unit: 'kg',  basePrice: 40 },
    { commodity: 'Green Chilli',category:'vegetable',unit: 'kg',  basePrice: 120 },
    { commodity: 'Bitter Gourd',category:'vegetable',unit: 'kg',  basePrice: 70 },
    { commodity: 'Pumpkin',   category: 'vegetable', unit: 'kg',  basePrice: 30 },
    { commodity: 'Radish',    category: 'vegetable', unit: 'kg',  basePrice: 30 },
    { commodity: 'Cucumber',  category: 'vegetable', unit: 'kg',  basePrice: 45 },
    { commodity: 'Brinjal',   category: 'vegetable', unit: 'kg',  basePrice: 55 },
  ]

  const fruits = [
    { commodity: 'Banana',   category: 'fruit', unit: 'dozen', basePrice: 80 },
    { commodity: 'Apple',    category: 'fruit', unit: 'kg',    basePrice: 180 },
    { commodity: 'Orange',   category: 'fruit', unit: 'kg',    basePrice: 120 },
    { commodity: 'Mango',    category: 'fruit', unit: 'kg',    basePrice: 100 },
    { commodity: 'Papaya',   category: 'fruit', unit: 'kg',    basePrice: 50 },
    { commodity: 'Guava',    category: 'fruit', unit: 'kg',    basePrice: 80 },
    { commodity: 'Lemon',    category: 'fruit', unit: 'dozen', basePrice: 40 },
  ]

  const grains = [
    { commodity: 'Rice (Fine)',   category: 'grain', unit: 'kg',  basePrice: 85 },
    { commodity: 'Rice (Medium)', category: 'grain', unit: 'kg',  basePrice: 65 },
    { commodity: 'Wheat Flour',   category: 'grain', unit: 'kg',  basePrice: 55 },
    { commodity: 'Lentil (Masur)',category: 'grain', unit: 'kg',  basePrice: 180 },
    { commodity: 'Lentil (Moong)',category: 'grain', unit: 'kg',  basePrice: 160 },
    { commodity: 'Chickpea',      category: 'grain', unit: 'kg',  basePrice: 140 },
    { commodity: 'Black Lentil',  category: 'grain', unit: 'kg',  basePrice: 170 },
    { commodity: 'Soybean',       category: 'grain', unit: 'kg',  basePrice: 130 },
    { commodity: 'Mustard Oil',   category: 'other', unit: 'litre',basePrice: 320 },
    { commodity: 'Sunflower Oil', category: 'other', unit: 'litre',basePrice: 280 },
    { commodity: 'Salt',          category: 'other', unit: 'kg',  basePrice: 25 },
    { commodity: 'Sugar',         category: 'other', unit: 'kg',  basePrice: 90 },
  ]

  const meatItems = [
    { commodity: 'Chicken (Broiler)',  category: 'meat', unit: 'kg',    basePrice: 280 },
    { commodity: 'Chicken (Country)',  category: 'meat', unit: 'kg',    basePrice: 600 },
    { commodity: 'Mutton (Goat)',      category: 'meat', unit: 'kg',    basePrice: 1100 },
    { commodity: 'Buff (Buffalo)',     category: 'meat', unit: 'kg',    basePrice: 520 },
    { commodity: 'Pork',               category: 'meat', unit: 'kg',    basePrice: 480 },
    { commodity: 'Fish (Rohu)',        category: 'meat', unit: 'kg',    basePrice: 300 },
    { commodity: 'Fish (Catfish)',     category: 'meat', unit: 'kg',    basePrice: 350 },
    { commodity: 'Eggs',               category: 'meat', unit: 'dozen', basePrice: 240 },
  ]

  const allItems = [...vegetables, ...fruits, ...grains, ...meatItems]
  const records = []

  for (const district of districts) {
    for (const item of allItems) {
      // Add ±15% price variation per district
      const variation = 1 + (Math.random() * 0.3 - 0.15)
      const price = Math.round(item.basePrice * variation)
      const minPrice = Math.round(price * 0.85)
      const maxPrice = Math.round(price * 1.15)

      records.push({
        commodity: item.commodity,
        category: item.category,
        district,
        price,
        minPrice,
        maxPrice,
        unit: item.unit,
        source: 'seed-data',
        updatedAt: new Date(now - Math.random() * 86400000 * 3), // within last 3 days
      })
    }
  }

  return records
}

export default router
