import express from 'express'
import mongoose from 'mongoose'
import Post from '../models/Post.js'
import auth from '../middlewares/auth.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { q, category, ownerId, status, sort, page = '1', limit = '12' } = req.query

    const filter = {}
    if (q) filter.$text = { $search: q }
    if (category) filter.category = String(category).trim()
    if (ownerId && mongoose.isValidObjectId(ownerId)) filter.ownerId = ownerId
    if (status) filter.status = status
    if (!status) filter.status = 'active'

    const pageNum = Math.max(parseInt(page, 10) || 1, 1)
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100)
    const skip = (pageNum - 1) * limitNum

    const projection = q ? { score: { $meta: 'textScore' } } : {}
    let sortSpec = { createdAt: -1 }
    if (q) sortSpec = { score: { $meta: 'textScore' }, createdAt: -1 }
    if (sort === 'recent') sortSpec = { createdAt: -1 }

    const [items, total] = await Promise.all([
      Post.find(filter, projection).sort(sortSpec).skip(skip).limit(limitNum).lean(),
      Post.countDocuments(filter)
    ])

    res.json({ items, page: pageNum, limit: limitNum, total, hasNext: skip + items.length < total })
  } catch {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'INVALID_ID' })
    const post = await Post.findById(id).lean()
    if (!post || post.status === 'traded') return res.status(404).json({ error: 'NOT_FOUND' })
    res.json(post)
  } catch {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const ownerId = req.user && req.user.id
    if (!ownerId || !mongoose.isValidObjectId(ownerId)) return res.status(401).json({ error: 'UNAUTHORIZED' })

    const { title, description, category, images } = req.body
    const doc = new Post({
      title: String(title || '').trim(),
      description: String(description || '').trim(),
      category: String(category || '').trim(),
      images: Array.isArray(images) ? images.map(String) : [],
      ownerId
    })

    const saved = await doc.save()
    res.status(201).json(saved.toObject())
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ error: 'VALIDATION_ERROR' })
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

router.patch('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'INVALID_ID' })

    const post = await Post.findById(id)
    if (!post) return res.status(404).json({ error: 'NOT_FOUND' })
    if (String(post.ownerId) !== req.user.id) return res.status(403).json({ error: 'FORBIDDEN' })

    const next = {}
    if (req.body.title !== undefined) next.title = String(req.body.title).trim()
    if (req.body.description !== undefined) next.description = String(req.body.description).trim()
    if (req.body.category !== undefined) next.category = String(req.body.category).trim()
    if (req.body.status !== undefined) next.status = req.body.status
    if (req.body.images !== undefined) next.images = Array.isArray(req.body.images) ? req.body.images.map(String) : []

    Object.assign(post, next)
    const updated = await post.save()
    res.json(updated.toObject())
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ error: 'VALIDATION_ERROR' })
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'INVALID_ID' })

    const post = await Post.findById(id)
    if (!post) return res.status(404).json({ error: 'NOT_FOUND' })
    if (String(post.ownerId) !== req.user.id) return res.status(403).json({ error: 'FORBIDDEN' })
    if (post.status === 'traded') return res.status(409).json({ error: 'ALREADY_TRADED' })

    post.status = 'paused'
    const updated = await post.save()
    res.json(updated.toObject())
  } catch {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

export default router