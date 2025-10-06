import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, trim: true, required: true, maxlength: 1000 }
  },
  { timestamps: true }
)

export default mongoose.model('Message', messageSchema)