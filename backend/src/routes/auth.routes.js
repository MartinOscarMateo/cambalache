import { Router } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { registerSchema } from '../schemas/auth.js';
import validate from '../middlewares/validate.js';
import jwt from 'jsonwebtoken';
import { loginSchema } from '../schemas/auth.js';
import authRequired from '../middlewares/authRequired.js';

const router = Router();

router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', authRequired, async (req, res) => {
  const user = await User.findById(req.user.id).select('name email createdAt');
  if (!user) return res.status(404).json({ message: 'No encontrado' });
  res.json(user);
});

export default router;