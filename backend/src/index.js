import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import postsRoutes from './routes/posts.js';

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json());

app.use('/api/auth', authRoutes)
app.use('/api/posts', postsRoutes)

app.get('/health', (_req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`API http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('MongoDB error:', err.message);
    process.exit(1);
  });