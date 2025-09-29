// backend/src/controllers/tradesController.js
import mongoose from 'mongoose';
import Trade, { TRADE_STATUS } from '../models/Trade.js';
import Post from '../models/Post.js';

const ALLOWED_STATUS = new Set(TRADE_STATUS);
const TERMINAL = new Set(['accepted','rejected','canceled']);

const viewId = v => String(v);
const getOwnerId = (post) => post?.userId || post?.authorId || post?.ownerId;

function assert(cond, code, msg) {
  if (!cond) {
    const err = new Error(msg || code);
    err.code = code;
    throw err;
  }
}

async function mustValidPost(id) {
  const post = await Post.findById(id).lean();
  assert(post, 'POST_NOT_FOUND', 'Publicación no encontrada');
  assert(!post.isDeleted && !post.deletedAt, 'POST_DELETED', 'Publicación eliminada');
  return post;
}

function canTransition(current, action) {
  if (TERMINAL.has(current)) return false;
  if (!['pending','countered'].includes(current)) return false;
  return ['accept','reject','cancel','counter'].includes(action);
}

function parsePageLimit(q) {
  const page = Math.max(1, Number(q.page || 1));
  let limit = Number(q.limit || 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 10;
  if (limit > 50) limit = 50;
  return { page, limit };
}

export async function createTrade(req, res) {
  try {
    const userId = req.user.id;
    const { postRequestedId, postOfferedId, itemsText } = req.body;

    assert(postRequestedId, 'REQ_POST_REQUIRED', 'Falta postRequestedId');
    if (postOfferedId) {
      assert(String(postRequestedId) !== String(postOfferedId), 'SAME_POST', 'No podés pedir y ofrecer el mismo post');
    }

    const postRequested = await mustValidPost(postRequestedId);
    const receiverId = viewId(getOwnerId(postRequested));
    assert(receiverId, 'REQ_POST_NO_OWNER', 'Publicación sin dueño');
    assert(receiverId !== userId, 'SELF_TRADE_FORBIDDEN', 'No podés ofertar sobre tu propia publicación');

    if (postOfferedId) {
      const postOffered = await mustValidPost(postOfferedId);
      const offeredOwner = viewId(getOwnerId(postOffered));
      assert(offeredOwner === userId, 'OFFERED_NOT_OWNED', 'Debés ser dueño del post ofrecido');
    }
    assert(itemsText || postOfferedId, 'OFFER_REQUIRED', 'Ofrecé itemsText o postOfferedId');

    const trade = await Trade.create({
      proposerId: userId,
      receiverId,
      postRequestedId,
      postOfferedId: postOfferedId || undefined,
      itemsText: itemsText?.trim(),
      status: 'pending',
      history: [{ by: userId, action: 'created' }]
    });

    res.status(201).json(trade);
  } catch (err) {
    res.status(400).json({ code: err.code || 'TRADE_CREATE_ERROR', error: err.message });
  }
}

export async function listTrades(req, res) {
  try {
    const userId = req.user.id;
    const { role = 'inbox', status } = req.query;
    assert(['inbox', 'sent'].includes(role), 'BAD_ROLE', 'role inválido');
    if (status) assert(ALLOWED_STATUS.has(status), 'BAD_STATUS', 'status inválido');

    const { page, limit } = parsePageLimit(req.query);
    const q = role === 'inbox' ? { receiverId: userId } : { proposerId: userId };
    if (status) q.status = status;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Trade.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('proposerId', 'name')
        .populate('receiverId', 'name')
        .populate('postRequestedId', 'title')
        .populate('postOfferedId', 'title')
        .lean(),
      Trade.countDocuments(q)
    ]);

    res.json({ page, limit, total, items });
  } catch (err) {
    res.status(400).json({ code: err.code || 'TRADE_LIST_ERROR', error: err.message });
  }
}

export async function getTrade(req, res) {
  try {
    const userId = req.user.id;
    assert(mongoose.isValidObjectId(req.params.id), 'BAD_ID', 'ID inválido');
    const trade = await Trade.findById(req.params.id)
      .populate('proposerId', 'name')
      .populate('receiverId', 'name')
      .populate('postRequestedId', 'title')
      .populate('postOfferedId', 'title')
      .lean();
    assert(trade, 'NOT_FOUND', 'Trueque no encontrado');
    assert([viewId(trade.proposerId?._id), viewId(trade.receiverId?._id)].includes(userId), 'FORBIDDEN', 'No autorizado');
    res.json(trade);
  } catch (err) {
    res.status(404).json({ code: err.code || 'TRADE_GET_ERROR', error: err.message });
  }
}

export async function changeStatus(req, res) {
  try {
    const userId = req.user.id;
    const { action } = req.body; // accept | reject | cancel
    assert(['accept', 'reject', 'cancel'].includes(action), 'BAD_ACTION', 'Acción inválida');

    const trade = await Trade.findById(req.params.id);
    assert(trade, 'NOT_FOUND', 'Trueque no encontrado');
    assert([viewId(trade.proposerId), viewId(trade.receiverId)].includes(userId), 'FORBIDDEN', 'No autorizado');
    assert(canTransition(trade.status, action), 'BAD_STATE', 'Estado no permite la acción');

    if (action === 'cancel') {
      assert(viewId(trade.proposerId) === userId, 'ONLY_PROPOSER', 'Solo quien propuso puede cancelar');
      const from = trade.status;
      trade.status = 'canceled';
      trade.history.push({ by: userId, action: 'canceled', from, to: 'canceled' });
    } else {
      assert(viewId(trade.receiverId) === userId, 'ONLY_RECEIVER', 'Solo el receptor puede aceptar o rechazar');
      const to = action === 'accept' ? 'accepted' : 'rejected';
      const from = trade.status;
      trade.status = to;
      trade.history.push({ by: userId, action: action + 'ed', from, to });
    }

    await trade.save();
    res.json(trade.toJSON());
  } catch (err) {
    res.status(400).json({ code: err.code || 'TRADE_STATUS_ERROR', error: err.message });
  }
}

export async function counterOffer(req, res) {
  try {
    const userId = req.user.id;
    const { itemsText, postOfferedId } = req.body;

    const trade = await Trade.findById(req.params.id);
    assert(trade, 'NOT_FOUND', 'Trueque no encontrado');
    assert(viewId(trade.receiverId) === userId, 'ONLY_RECEIVER', 'Solo el receptor puede contraofertar');
    assert(canTransition(trade.status, 'counter'), 'BAD_STATE', 'Estado no permite contraoferta');

    if (postOfferedId) {
      assert(String(trade.postRequestedId) !== String(postOfferedId), 'SAME_POST', 'No podés pedir y ofrecer el mismo post');
      const postOffered = await mustValidPost(postOfferedId);
      const owner = viewId(getOwnerId(postOffered));
      assert(owner === userId, 'OFFERED_NOT_OWNED', 'Debés ser dueño del post ofrecido');
      trade.postOfferedId = postOfferedId;
    }
    if (itemsText !== undefined) trade.itemsText = String(itemsText).trim();
    assert(trade.itemsText || trade.postOfferedId, 'OFFER_REQUIRED', 'Contraoferta vacía');

    const from = trade.status;
    trade.status = 'countered';
    trade.history.push({ by: userId, action: 'countered', from, to: 'countered' });

    await trade.save();
    res.json(trade.toJSON());
  } catch (err) {
    res.status(400).json({ code: err.code || 'TRADE_COUNTER_ERROR', error: err.message });
  }
}