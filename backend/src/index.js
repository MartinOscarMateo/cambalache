import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/posts', (_req, res) => res.json([]));

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`API http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('MongoDB error:', err.message);
    process.exit(1);
  });
