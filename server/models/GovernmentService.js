import mongoose from 'mongoose'

const govServiceSchema = new mongoose.Schema({
  serviceName:       { type: String, required: true, index: true },
  category:          { type: String, default: 'general' },
  keywords:          [{ type: String }],       // for keyword matching/search
  requiredDocuments: [{ type: String }],
  fees:              { type: String, default: 'Free' },
  processingTime:    { type: String, default: 'Varies' },
  office:            { type: String, default: '' },
  location:          { type: String, default: 'Nepal' },
  eligibility:       { type: String, default: 'All citizens' },
  description:       { type: String, default: '' },
  officialNotes:     { type: String, default: '' },
  steps:             [{ type: String }],
  updatedAt:         { type: Date, default: Date.now },
})

govServiceSchema.index({ keywords: 1 })
govServiceSchema.index({ serviceName: 'text', description: 'text', keywords: 'text' })

export default mongoose.model('GovernmentService', govServiceSchema)
