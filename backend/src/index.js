import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/healthz", (_req, res) => res.json({ ok: true }));
app.get('/api/posts', (_req, res) => {
  res.json([]);
});

const PORT = process.env.PORT || 4000;
const URI = process.env.MONGODB_URI;

mongoose
  .connect(URI)
  .then(() => {
    app.listen(PORT, () => console.log(`API http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB error:", err.message);
    process.exit(1);
  });