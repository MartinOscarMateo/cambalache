import { Router } from 'express';
import mongoose from 'mongoose';
import Chat from '../models/Chat.js';
import auth from '../middlewares/auth.js';

const router = Router();

router.post('/', async(req, res) => {
    const { user, text } = req.body;
    if (!user || !text) return res.status(400).json({ error: 'Flojo de papeles'});
    const msg = new Chat({ user, text });
    await msg.save();
    res.status(201).json(msg);
});

router.get('/' , auth, async(req, res) => {
    const messages = await Chat.find().sort({ createdAt: 1 });
    res.json(messages);
});

export default router;