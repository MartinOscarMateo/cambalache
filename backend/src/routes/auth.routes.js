import { Router } from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { registerSchema, loginSchema } from '../schemas/auth.js'
import validate from '../middlewares/validate.js'
import jwt from 'jsonwebtoken'
import authRequired from '../middlewares/auth.js'

const router = Router()

// Registro
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password } = req.body
    const exists = await User.findOne({ email })
    if (exists) return res.status(409).json({ message: 'Email already registered' })

    const user = await User.create({ name, email, password, role: 'user' })

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Login
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' })

    if (user.active === false) return res.status(403).json({ message: 'Cuenta deshabilitada' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ message: 'Credenciales inválidas' })

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        active: user.active
      }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Perfil del usuario autenticado
router.get('/me', authRequired, async (req, res) => {
  const user = await User.findById(req.user.id).select('name email avatar role active createdAt')
  if (!user) return res.status(404).json({ message: 'No encontrado' })
  res.json(user)
})

export default router