import { Router } from 'express'
import auth from '../middlewares/auth.js'
import Notification from '../models/Notification.js'

const router = Router()

router.get('/', auth, async (req, res) => {
    const notifications = await Notification
        .find({ user: req.user.id })
        .sort({ createdAt: -1 })

    res.json(notifications)
})

router.patch("/:id/read", auth, async (req, res) => {
    await Notification.findByIdAndUpdate(req.params.id, { read: true })
    res.json({ ok: true })
})

export default router