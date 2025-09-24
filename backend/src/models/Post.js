import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    images: [{ type: String }],
    category: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['available', 'reserved', 'exchanged'], default: 'available' }
  },
  { timestamps: true }
);

postSchema.index({ location: '2dsphere' });

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);
export default Post;