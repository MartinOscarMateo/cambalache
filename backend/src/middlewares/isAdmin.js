import User from '../models/User.js'

export default async function isAdmin(req, res, next) {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' })

    const user = await User.findById(userId).select('role active')
    if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' })
    if (!user.active) return res.status(403).json({ error: 'FORBIDDEN' })
    if (user.role !== 'admin') return res.status(403).json({ error: 'FORBIDDEN' })

    next()
  } catch {
    return res.status(500).json({ error: 'INTERNAL_ERROR' })
  }
}