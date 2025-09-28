import jwt from 'jsonwebtoken'

export default function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const id = payload.id || payload._id || payload.sub
    if (!id) return res.status(401).json({ error: 'UNAUTHORIZED' })
    req.user = { id }
    next()
  } catch {
    return res.status(401).json({ error: 'UNAUTHORIZED' })
  }
}