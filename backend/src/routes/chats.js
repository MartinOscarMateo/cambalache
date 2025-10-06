import { Router } from 'express'
import Chat from '../models/Chat.js'
import Message from '../models/Message.js'
import auth from '../middlewares/auth.js'

const router = Router()

// crea o recuperar un chat existente
router.post('/', auth, async (req, res) => {
  try {
    const { userId } = req.body
    const myId = req.user.id

    if (!userId || userId === myId) return res.status(400).json({ error: 'userId inválido' })

    // busca si ya existe chat entre ambos
    let chat = await Chat.findOne({ participants: { $all: [myId, userId] } })
    if (!chat) {
      chat = await Chat.create({ participants: [myId, userId] })
    }

    res.status(201).json(chat)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// obtiene todos los chats del usuario
router.get('/', auth, async (req, res) => {
  try {
    const myId = req.user.id
    const chats = await Chat.find({ participants: myId })
      .populate('participants', 'name avatar')
      .sort({ updatedAt: -1 })

    res.json(chats)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// obtiene todos los mjs de un chat
router.get('/:chatId/messages', auth, async (req, res) => {
  try {
    const { chatId } = req.params
    const messages = await Message.find({ chatId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 })
    res.json(messages)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// enviar nuevo mensaje dentro de un chat
router.post('/messages', auth, async (req, res) => {
  try {
    const { chatId, text } = req.body
    if (!chatId || !text) return res.status(400).json({ error: 'Datos incompletos' })

    const message = await Message.create({
      chatId,
      sender: req.user.id,
      text
    })

    // actualiza el ultimo msj en el chat
    await Chat.findByIdAndUpdate(chatId, { lastMessage: text, updatedAt: new Date() })

    res.status(201).json(message)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router