import { Router } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { registerSchema } from '../schemas/auth.js';
import validate from '../middlewares/validate.js';

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

export default router;