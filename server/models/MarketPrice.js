import mongoose from 'mongoose'

const marketPriceSchema = new mongoose.Schema({
  commodity: { type: String, required: true, index: true },
  category:  { type: String, default: 'vegetable', enum: ['vegetable', 'fruit', 'grain', 'spice', 'dairy', 'meat', 'other'] },
  district:  { type: String, required: true, index: true },
  price:     { type: Number, required: true },
  minPrice:  { type: Number, default: null },
  maxPrice:  { type: Number, default: null },
  unit:      { type: String, default: 'kg' },
  source:    { type: String, default: 'manual' },
  updatedAt: { type: Date, default: Date.now, index: true },
})

// Compound index for district + commodity lookups
marketPriceSchema.index({ district: 1, commodity: 1 })
marketPriceSchema.index({ commodity: 1, updatedAt: -1 })

export default mongoose.model('MarketPrice', marketPriceSchema)
