import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    password: { type: String, required: true, minlength: 6 },
    avatar: {
      type: String,
      default: 'https://res.cloudinary.com/dfxpztpoi/image/upload/v1759185376/default-avatar_kohur4.png'
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
    role: {type: String, enum:['user', 'admin'], default: 'user', index: true},
    active: {type: Boolean, default: true, index: true }
  },
  { timestamps: true }
)

userSchema.index({ name: 'text', email: 'text' })

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (err) {
    next(err)
  }
})

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password
    delete ret.__v
    return ret
  }
})

export default mongoose.model('User', userSchema)