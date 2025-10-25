import { Router } from 'express'
import User from '../models/User.js'
import auth from '../middlewares/auth.js'
import isAdmin from '../middlewares/isAdmin.js'
import validate from '../middlewares/validate.js'
import { createUserSchema, updateUserSchema } from '../schemas/adminUsers.js'

const router = Router()

// GET /api/admin/users?q=&page=&limit=&active=
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    const page = Math.max(parseInt(req.query.page || '1', 10), 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100)

    // si no se especifica ?active=, por defecto solo activos
    const activeParam = req.query.active
    const hasActive = activeParam === 'true' || activeParam === 'false'
    const active = hasActive ? activeParam === 'true' : true

    const filter = {}
    if (q) filter.$text = { $search: q }
    filter.active = active

    const [items, total] = await Promise.all([
      User.find(filter)
        .select('name email role active createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter)
    ])

    res.json({ page, limit, total, items })
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' })
  }
})

// GET /api/admin/users/:id
router.get('/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name email role active avatar createdAt')
    if (!user) return res.status(404).json({ error: 'NOT_FOUND' })
    res.json(user)
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' })
  }
})

// POST /api/admin/users
router.post('/', auth, isAdmin, validate(createUserSchema), async (req, res) => {
  try {
    const { name, email, password, role, active } = req.body
    const exists = await User.findOne({ email })
    if (exists) return res.status(409).json({ error: 'EMAIL_IN_USE' })

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      active: typeof active === 'boolean' ? active : true
    })

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt
    })
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' })
  }
})

// PUT /api/admin/users/:id
router.put('/:id', auth, isAdmin, validate(updateUserSchema), async (req, res) => {
  try {
    const allowed = ['name', 'email', 'role', 'active']
    const update = {}
    for (const k of allowed) if (k in req.body) update[k] = req.body[k]

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .select('name email role active createdAt')
    if (!user) return res.status(404).json({ error: 'NOT_FOUND' })
    res.json(user)
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' })
  }
})

// DELETE /api/admin/users/:id
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params
    if (String(req.user.id) === String(id)) return res.status(400).json({ error: 'NO_SELF_DISABLE' })

    const updated = await User.findByIdAndUpdate(id, { $set: { active: false } }, { new: true })
    if (!updated) return res.status(404).json({ error: 'NOT_FOUND' })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' })
  }
})

export default router