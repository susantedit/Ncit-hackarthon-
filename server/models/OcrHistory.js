import mongoose from 'mongoose'

const ocrHistorySchema = new mongoose.Schema({
  userId:           { type: String, index: true, default: 'anonymous' },
  productName:      { type: String, default: '' },
  rawText:          { type: String, default: '' },          // OCR extracted text
  detectedPrice:    { type: Number, default: null },
  estimatedPrice:   { type: Number, default: null },
  expectedMin:      { type: Number, default: null },
  expectedMax:      { type: Number, default: null },
  verdict:          { type: String, default: 'Unable to Determine' },
  confidenceScore:  { type: Number, default: 0 },
  explanation:      { type: String, default: '' },
  inputType:        { type: String, default: 'text', enum: ['text', 'image'] },
  imageUrl:         { type: String, default: '' },
  createdAt:        { type: Date, default: Date.now },
})

ocrHistorySchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model('OcrHistory', ocrHistorySchema)
