import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import postsRoutes from './routes/posts.js';
import followsRoutes from './routes/follows.js';
import tradesRouter from './routes/trades.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chat.js';
import logger from 'morgan';

import { Server } from 'socket.io';
import { createServer } from 'node:http';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST']
  },
  // connectionStateRecovery: {
  //   maxDisconnectionDuration: 
  // }
});

app.use(logger('dev'));

io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado al WebSocket');

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado del WebSocket');
  });
});

app.use(express.static(path.join(process.cwd(), 'frontend', 'dist')));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/frontend/dist/index.html');
});

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api', followsRoutes);
app.use('/api/trades', tradesRouter);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => server.listen(PORT, () => console.log(`API http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('MongoDB error:', err.message);
    process.exit(1);
  });