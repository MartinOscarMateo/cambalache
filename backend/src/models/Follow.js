import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    followingId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

schema.index({ followerId: 1, followingId: 1 }, { unique: true });

export default mongoose.model('Follow', schema);