import { Router } from 'express'
import Chat from '../models/Chat.js'
import authRequired from '../middlewares/authRequired.js'

const router = Router()

// crea un msj !!!
router.post('/', authRequired, async (req, res) => {
  try {
    const { to, text } = req.body
    if (!to || !text) return res.status(400).json({ message: 'Datos incompletos' })

    const msg = await Chat.create({
      from: req.user.id,
      to,
      text
    })

    res.status(201).json(msg)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// obtiene mesj entre dos usuarios !!!
router.get('/:otherUserId', authRequired, async (req, res) => {
  try {
    const myId = req.user.id
    const otherId = req.params.otherUserId

    const messages = await Chat.find({
      $or: [
        { from: myId, to: otherId },
        { from: otherId, to: myId }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('from to', 'name avatar')

    res.json(messages)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// obtiene todas las conversaciones del usuario
router.get('/', authRequired, async (req, res) => {
  try {
    const myId = req.user.id

    // busca todos los mensajes donde el usuario sea emisor o receptor
    const messages = await Chat.find({
      $or: [{ from: myId }, { to: myId }]
    })
      .sort({ createdAt: -1 })
      .populate('from to', 'name avatar')

    // agrupa por id del otro usuario
    const conversations = new Map()

    for (const msg of messages) {
      const otherUser =
        String(msg.from._id) === String(myId) ? msg.to : msg.from
      const key = String(otherUser._id)

      if (!conversations.has(key)) {
        conversations.set(key, {
          _id: key,
          otherUser,
          lastMessage: { text: msg.text, createdAt: msg.createdAt }
        })
      }
    }

    res.json(Array.from(conversations.values()))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router