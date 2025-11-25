// backend/src/controllers/tradesController.js
import mongoose from 'mongoose';
import Trade, { TRADE_STATUS } from '../models/Trade.js';
import User from "../models/User.js"
import Post from '../models/Post.js';
import Chat from '../models/Chat.js'
import Message from '../models/Message.js'

const ALLOWED_STATUS = new Set(TRADE_STATUS);
const TERMINAL = new Set(['rejected', 'cancelled', 'finished']);

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

    let chat = await Chat.findOne({ participants: { $all: [userId, receiverId] } })
    if (!chat) {
      chat = await Chat.create({ participants: [userId, receiverId] })
    }
    
    const autoText = `Hola! Te envié una solicitud de trueque por tu publicación "${postRequested.title}".`
    await Message.create({
      chatId: chat._id,
      sender: userId,
      text: autoText
    })
    
    await Chat.findByIdAndUpdate(chat._id, {
      lastMessage: autoText,
      updatedAt: new Date()
    })
    
    res.status(201).json(trade)
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

function canTransition(current, action) {
  if (TERMINAL.has(current)) return false;

  const allowed = {
    pending:   ['accept', 'reject', 'cancel'],
    countered: ['accept', 'reject', 'cancel'],
    accepted:  ['finish', 'cancel'],
    rejected:  [],
    cancelled: [],
    finished:  [],
  };

  return allowed[current]?.includes(action) ?? false;
}

export async function changeStatus(req, res) {
  try {
    const userId = req.user.id;
    const { action } = req.body;
    assert(['accept', 'reject', 'cancel', 'finish'].includes(action), 'BAD_ACTION', 'Acción inválida');
    
    const trade = await Trade.findById(req.params.id);
    assert(trade, 'NOT_FOUND', 'Trueque no encontrado');

    assert([viewId(trade.proposerId), viewId(trade.receiverId)].includes(userId), 'FORBIDDEN', 'No autorizado');
    
    //DEBUGGER

    // console.log("DEBUG:", { status: trade.status, action });
    // console.log("canTransition?", canTransition(trade.status, action));
    
    // console.log("---- DEBUG STATUS ----");
    // console.log("trade.status:", JSON.stringify(trade.status));
    // console.log("allowed keys:", Object.keys({
    //   pending:1, countered:1, accepted:1, rejected:1, cancelled:1, finished:1
    // }));
    // console.log("TERMINAL.has(current):", ["accepted","rejected","cancelled","finished"].includes(trade.status));
    // console.log("allowed[current]:", 
    //   {
    //     pending: ['accept','reject','cancel'],
    //     countered: ['accept','reject','cancel'],
    //     accepted: ['finish','cancel'],
    //     rejected: [],
    //     cancelled: [],
    //     finished: []
    //   }[trade.status]
    // );

    assert(canTransition(trade.status, action), 'BAD_STATE', 'Estado no permite la acción');

    if (action === 'cancel') {
      if (trade.status === "pending") {
        assert(
          viewId(trade.proposerId) === userId,
          "ONLY_PROPOSER",
          "Solo quien propuso puede cancelar mientras está pendiente"
        );
      } else if (trade.status === "accepted") {
        assert(
          [viewId(trade.proposerId), viewId(trade.receiverId)].includes(userId),
          "FORBIDDEN",
          "No autorizado para cancelar"
        );
      }

      const from = trade.status;
      trade.status = 'cancelled';
      trade.history.push({ by: userId, action: 'cancelled', from, to: 'cancelled' });
    } else if (action === 'finish') {
      assert(trade.status === 'accepted', 'BAD_STATE', 'Solo se finalizan trueques aceptados');

      const from = trade.status;
      trade.status = 'finished';
      trade.history.push({ by: userId, action: 'finished', from, to: 'finished' });
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

export async function rateTrade (req, res) {
  try {
    const tradeId = req.params.id;
    const userId = req.user.id;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating inválido (debe ser 1-5)" });
    } 

    const trade = await Trade.findById(tradeId);
    if (!trade) {
      return res.status(404).json({ message: "Trade no encontrado" });
    }

    if (trade.status !== "finished") {
      return res.status(400).json({ message: "Solo podés calificar un trueque finalizado" });
    }

    // validamos que sea el usuario del trade
    const isProposer = trade.proposerId.equals(userId);
    const isReceiver = trade.receiverId.equals(userId);

    if (!isProposer && !isReceiver) {
      return res.status(403).json({ message: "No pertenecés a este trade" });
    }

    const to = isProposer ? trade.receiverId : trade.proposerId;

    // evitar calificar 2 veces
    const alreadyRated = trade.ratings?.some(r => r.by.equals(userId));
    if (alreadyRated) {
      return res.status(400).json({ message: "Ya calificaste este trueque" });
    }

    trade.ratings.push({
      by: userId,
      to,
      value: rating,
      at: new Date()
    });

    await trade.save();

    // calculamos el promedio
    const userRated = await User.findById(to);

    userRated.ratingCount = userRated.ratingCount || 0;
    userRated.ratingTotal = userRated.ratingTotal || 0;
    userRated.ratingCount += 1;
    userRated.ratingTotal += rating;
    userRated.ratingAverage = Number((userRated.ratingTotal / userRated.ratingCount).toFixed(2));

    await userRated.save();

    return res.json({
      message: "Rating enviado exitosamente",
      rating: {
        by: userId,
        to,
        value: rating
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error al enviar rating" });
  }
}