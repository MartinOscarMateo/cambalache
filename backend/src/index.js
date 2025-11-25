import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import logger from 'morgan'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import connectDB from './config/db.js'

import authRoutes from './routes/auth.routes.js'
import postsRoutes from './routes/posts.js'
import followsRoutes from './routes/follows.js'
import tradesRouter from './routes/trades.js'
import userRoutes from './routes/userRoutes.js'
import chatRoutes from './routes/chats.js'
import adminUsersRouter from './routes/admin.users.js'
import barriosRoutes from './routes/barrios.js'

const app = express()
const server = createServer(app)

// configuracion de socket.io con cors
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST']
  }
})

// middlewares base
app.use(logger('dev'))
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json())

// rutas api
app.use('/api/auth', authRoutes)
app.use('/api/posts', postsRoutes)
app.use('/api', followsRoutes)
app.use('/api/trades', tradesRouter)
app.use('/api/users', userRoutes)
app.use('/api/chats', chatRoutes)
app.use('/api/admin/users', adminUsersRouter)
app.use('/api/barrios', barriosRoutes)

// ruta healthcheck
app.get('/health', (_req, res) => res.json({ ok: true }))

// servir frontend compilado
app.use(express.static(path.join(process.cwd(), 'frontend', 'dist')))
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/frontend/dist/index.html')
})

// autenticacion para sockets
io.use((socket, next) => {
  const token = socket.handshake.auth?.token
  if (!token) return next(new Error('Token requerido'))
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET)
    socket.user = user
    next()
  } catch {
    next(new Error('Token invalido'))
  }
})

// manejo de eventos de socket
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.user?.email)

  // el cliente escucha solo sus propios mensajes privados
  socket.join(socket.user.id)

  // mensaje privado
  socket.on('private_message', (msg) => {
    const targetId = msg.to
    if (!targetId || !msg.text) return
    io.to(targetId).emit('private_message', {
      from: socket.user.id,
      text: msg.text,
      createdAt: new Date()
    })
  })

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.user?.email)
  })
})

const PORT = process.env.PORT || 4000

connectDB()
  .then(() => server.listen(PORT, () => console.log(`API http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('MongoDB error:', err.message)
    process.exit(1)
  })