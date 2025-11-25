import express from 'express'
import mongoose from 'mongoose'
import Post from '../models/Post.js'
import auth from '../middlewares/auth.js'

const router = express.Router()

// obtiene publicaciones con filtros
router.get('/', async (req, res) => {
  try {
    const { q, category, ownerId, status, sort, page = '1', limit = '12', barrio } = req.query

    const filter = {}
    if (q) filter.$text = { $search: q }
    if (category) filter.category = String(category).trim()
    if (ownerId && mongoose.isValidObjectId(ownerId)) filter.ownerId = ownerId
    if (status) filter.status = status
    if (!status) filter.status = 'active'
    if (barrio) filter.barrio = String(barrio).trim()

    const pageNum = Math.max(parseInt(page, 10) || 1, 1)
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100)
    const skip = (pageNum - 1) * limitNum

    const projection = q ? { score: { $meta: 'textScore' } } : {}
    let sortSpec = { createdAt: -1 }
    if (q) sortSpec = { score: { $meta: 'textScore' }, createdAt: -1 }
    if (sort === 'recent') sortSpec = { createdAt: -1 }

    const [items, total] = await Promise.all([
      Post.find(filter, projection)
        .populate('ownerId', 'name avatar') // trae datos del propietario
        .sort(sortSpec)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Post.countDocuments(filter)
    ])

    res.json({ items, page: pageNum, limit: limitNum, total, hasNext: skip + items.length < total })
  } catch {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

// obtiene una publicacion por id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'INVALID_ID' })

    const post = await Post.findById(id)
      .populate('ownerId', 'name avatar')
      .lean()

    if (!post || post.status === 'traded') return res.status(404).json({ error: 'NOT_FOUND' })
    res.json(post)
  } catch {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

// obtiene mas publicaciones de un usuario
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ error: 'INVALID_ID' })

    const posts = await Post.find({
      ownerId: userId,
      status: 'active'
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('ownerId', 'name avatar')
      .lean()

    res.json(posts)
  } catch {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

// crea una publicacion
router.post('/', auth, async (req, res) => {
  try {
    const ownerId = req.user && req.user.id
    if (!ownerId || !mongoose.isValidObjectId(ownerId)) return res.status(401).json({ error: 'UNAUTHORIZED' })

    const {
      title,
      description,
      category,
      images,
      condition,
      hasDetails,
      detailsText,
      location,
      openToOffers,
      interestsText,
      barrio
    } = req.body

    const doc = new Post({
      title: String(title || '').trim(),
      description: String(description || '').trim(),
      category: String(category || '').trim(),
      images: Array.isArray(images) ? images.map(String) : [],
      condition: condition || 'usado',
      hasDetails: Boolean(hasDetails),
      detailsText: String(detailsText || '').trim(),
      barrio: String(barrio || '').trim(),
      location: String(location || '').trim(),
      openToOffers: openToOffers !== false,
      interestsText: String(interestsText || '').trim(),
      ownerId
    })

    const saved = await doc.save()
    res.status(201).json(saved.toObject())
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ error: 'VALIDATION_ERROR' })
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

// actualiza una publicacion
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
    if (req.body.condition !== undefined) next.condition = req.body.condition
    if (req.body.hasDetails !== undefined) next.hasDetails = Boolean(req.body.hasDetails)
    if (req.body.detailsText !== undefined) next.detailsText = String(req.body.detailsText).trim()
    if (req.body.barrio !== undefined) next.barrio = String(req.body.barrio).trim()
    if (req.body.location !== undefined) next.location = String(req.body.location).trim()
    if (req.body.openToOffers !== undefined) next.openToOffers = Boolean(req.body.openToOffers)
    if (req.body.interestsText !== undefined) next.interestsText = String(req.body.interestsText).trim()

    Object.assign(post, next)
    const updated = await post.save()
    res.json(updated.toObject())
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ error: 'VALIDATION_ERROR' })
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

// elimina (pausa) una publicacion
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