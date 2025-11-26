import mongoose from 'mongoose';
const { Schema, Types } = mongoose;

export const TRADE_STATUS = ['pending','countered','accepted','rejected','cancelled','finished'];
export const TRADE_ACTION = ['created','countered','accepted','rejected','cancelled','finished'];

const HistorySchema = new Schema({
  at: { type: Date, default: Date.now },
  by: { type: Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: TRADE_ACTION, required: true },
  note: { type: String, trim: true, maxlength: 500 },
  from: { type: String, enum: TRADE_STATUS },
  to: { type: String, enum: TRADE_STATUS }
}, { _id: false });

const RatingScchema = new Schema({
  by: { type: Types.ObjectId, ref: 'User', required: true },
  to: { type: Types.ObjectId, ref: 'User', required: true },
  value: { type: Number, min: 1, max: 5, required: true },
  at: { type: Date, default: Date.now }
}, { _id: false });

const TradeSchema = new Schema({
  proposerId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  receiverId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  postRequestedId: { type: Types.ObjectId, ref: 'Post', required: true, index: true },
  postOfferedId: { type: Types.ObjectId, ref: 'Post' },
  itemsText: { type: String, trim: true, maxlength: 1000 },
  status: { type: String, enum: TRADE_STATUS, default: 'pending', index: true },
  history: { type: [HistorySchema], default: [] },
  ratings: { type: [RatingScchema], default: [] },
  chatId: { type: Types.ObjectId, ref: 'Chat', index: true },
  meetingArea: { type: String, trim: true, maxlength: 200 }
}, { timestamps: true });

TradeSchema.index({ proposerId: 1, receiverId: 1, createdAt: -1 });
TradeSchema.index({ status: 1, createdAt: -1 });

TradeSchema.pre('validate', function(next) {
  if (this.proposerId?.equals?.(this.receiverId)) {
    return next(new Error('No podés proponer un trueque a tu propio usuario'));
  }
  if (!this.itemsText && !this.postOfferedId) {
    return next(new Error('Debés ofrecer al menos itemsText o postOfferedId'));
  }
  next();
});

TradeSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  }
});

const Trade = mongoose.model('Trade', TradeSchema);
export default Trade;