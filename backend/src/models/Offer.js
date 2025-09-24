import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    proposer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, trim: true },
    proposedItems: [{ type: String, trim: true }],
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'cancelled'], default: 'pending' }
  },
  { timestamps: true }
);

const Offer = mongoose.models.Offer || mongoose.model('Offer', offerSchema);
export default Offer;
