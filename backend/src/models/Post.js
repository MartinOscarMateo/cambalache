import mongoose from 'mongoose'

const { Schema, model } = mongoose

const PostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 3000 },
    images: { type: [String], default: [] },
    category: { type: String, required: true, trim: true, maxlength: 50, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['active', 'paused', 'traded'], default: 'active', index: true },
    condition: { type: String, enum: ['nuevo', 'usado', 'no-funciona'], required: true },
    hasDetails: { type: Boolean, default: false },
    detailsText: { type: String, trim: true, maxlength: 1000 },
    barrio: { type: String, required: true, trim: true, maxlength: 80, index: true },
    location: { type: String, trim: true, maxlength: 100 },
    openToOffers: { type: Boolean, default: true },
    interestsText: { type: String, trim: true, maxlength: 1000 }
  },
  { timestamps: true }
)

PostSchema.index({ createdAt: -1 })
PostSchema.index({ title: 'text', description: 'text' }, { name: 'PostText' })

export default model('Post', PostSchema)