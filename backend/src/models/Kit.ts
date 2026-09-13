import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const kitSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true },
  dedupeHash: { type: String, required: false, index: true },
  source: { type: Schema.Types.Mixed, required: true },
  company_brief: { type: Schema.Types.Mixed, required: true },
  role: { type: Schema.Types.Mixed, required: true },
  questions: { type: [Schema.Types.Mixed], required: true },
  flashcards: { type: [Schema.Types.Mixed], required: true },
  schedule: { type: Schema.Types.Mixed, required: true },
  coverage: { type: Schema.Types.Mixed, required: true },
  generationStatus: { type: Schema.Types.Mixed, required: true },
  practice: { type: [Schema.Types.Mixed], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { minimize: false })

kitSchema.index({ userId: 1, dedupeHash: 1 })
kitSchema.pre('save', function() { this.updatedAt = new Date() })
export type Kit = InferSchemaType<typeof kitSchema>
export const KitModel = mongoose.model('Kit', kitSchema)
