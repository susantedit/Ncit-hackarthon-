import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  role:    { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  ts:      { type: Date, default: Date.now },
}, { _id: false })

const chatSessionSchema = new mongoose.Schema({
  chatId:   { type: String, required: true, unique: true, index: true },
  userId:   { type: String, index: true, default: 'anonymous' },
  module:   { type: String, default: 'chat' },
  language: { type: String, default: 'en' },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

chatSessionSchema.index({ userId: 1, updatedAt: -1 })

export default mongoose.model('ChatSession', chatSessionSchema)
