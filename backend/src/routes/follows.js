import { Router } from 'express';
import mongoose from 'mongoose';
import Follow from '../models/Follow.js';
import User from '../models/User.js';
import auth from '../middlewares/auth.js';

const router = Router();
const { ObjectId } = mongoose.Types;

router.post('/follows/:userId', auth, async (req, res) => {
  const followerId = req.user.id;
  const followingId = req.params.userId;
  if (!ObjectId.isValid(followingId)) return res.status(400).json({ code: 'INVALID_ID', error: 'userId inválido' });
  if (followerId === followingId) return res.status(400).json({ code: 'SELF_FOLLOW', error: 'No podés seguirte' });
  const exists = await User.exists({ _id: followingId });
  if (!exists) return res.status(404).json({ code: 'USER_NOT_FOUND', error: 'Usuario inexistente' });
  try {
    const doc = await Follow.create({ followerId, followingId });
    return res.status(201).json({ id: doc._id.toString() });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ code: 'ALREADY_FOLLOWING', error: 'Ya seguís a este usuario' });
    return res.status(500).json({ code: 'FOLLOW_CREATE_FAILED', error: 'Error al seguir' });
  }
});

router.delete('/follows/:userId', auth, async (req, res) => {
  const followerId = req.user.id;
  const followingId = req.params.userId;
  if (!ObjectId.isValid(followingId)) return res.status(400).json({ code: 'INVALID_ID', error: 'userId inválido' });
  await Follow.deleteOne({ followerId, followingId });
  return res.status(204).end();
});

router.get('/users/:id/followers', auth, async (req, res) => {
  const userId = req.params.id;
  if (!ObjectId.isValid(userId)) return res.status(400).json({ code: 'INVALID_ID', error: 'id inválido' });
  const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 20));
  const cursor = req.query.cursor && ObjectId.isValid(req.query.cursor) ? new ObjectId(req.query.cursor) : null;
  const base = { followingId: userId };
  const filter = cursor ? { ...base, _id: { $lt: cursor } } : base;
  const [total, rows] = await Promise.all([
    Follow.countDocuments(base),
    Follow.find(filter).sort({ _id: -1 }).limit(limit + 1).populate('followerId', 'name avatar')
  ]);
  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const items = slice.map(r => ({ _id: r.followerId._id, name: r.followerId.name, avatar: r.followerId.avatar || null }));
  const nextCursor = hasMore ? slice[slice.length - 1]._id.toString() : null;
  return res.json({ items, total, nextCursor });
});

router.get('/users/:id/following', auth, async (req, res) => {
  const userId = req.params.id;
  if (!ObjectId.isValid(userId)) return res.status(400).json({ code: 'INVALID_ID', error: 'id inválido' });
  const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 20));
  const cursor = req.query.cursor && ObjectId.isValid(req.query.cursor) ? new ObjectId(req.query.cursor) : null;
  const base = { followerId: userId };
  const filter = cursor ? { ...base, _id: { $lt: cursor } } : base;
  const [total, rows] = await Promise.all([
    Follow.countDocuments(base),
    Follow.find(filter).sort({ _id: -1 }).limit(limit + 1).populate('followingId', 'name avatar')
  ]);
  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const items = slice.map(r => ({ _id: r.followingId._id, name: r.followingId.name, avatar: r.followingId.avatar || null }));
  const nextCursor = hasMore ? slice[slice.length - 1]._id.toString() : null;
  return res.json({ items, total, nextCursor });
});

export default router;