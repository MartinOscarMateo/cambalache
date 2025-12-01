// backend/src/controllers/tradesController.js
import mongoose from 'mongoose';
import Trade, { TRADE_STATUS } from '../models/Trade.js';
import User from "../models/User.js";
import Post from '../models/Post.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';

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

async function ensureChatForTrade(trade) {
  const p1 = viewId(trade.proposerId);
  const p2 = viewId(trade.receiverId);
  if (trade.chatId) {
    const existing = await Chat.findById(trade.chatId);
    if (existing) return existing;
  }
  let chat = await Chat.findOne({ participants: { $all: [p1, p2] } });
  if (!chat) {
    chat = await Chat.create({ participants: [p1, p2] });
  }
  trade.chatId = chat._id;
  return chat;
}

function buildMeetingSummary(meeting, fallbackArea = '') {
  if (!meeting) return fallbackArea || 'un punto de encuentro';
  const parts = [];
  if (meeting.placeName) parts.push(meeting.placeName);
  if (meeting.barrio) parts.push(meeting.barrio);
  if (meeting.placeAddress) parts.push(meeting.placeAddress);
  if (!parts.length && fallbackArea) return fallbackArea;
  return parts.join(' · ') || 'un punto de encuentro';
}

async function postSystemMessage(chatId, senderId, text) {
  if (!chatId || !text) return;
  await Message.create({ chatId, sender: senderId, text });
  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: text,
    updatedAt: new Date()
  });
}

export async function createTrade(req, res) {
  try {
    const userId = req.user.id;
    const sender = await User.findById(userId).select("name");
    const { postRequestedId, postOfferedId, itemsText, meetingArea } = req.body;
    assert(postRequestedId, 'REQ_POST_REQUIRED', 'Falta postRequestedId');
    if (postOfferedId) {
      assert(String(postRequestedId) !== String(postOfferedId), 'SAME_POST', 'No podés pedir y ofrecer el mismo post');
    }
    const postRequested = await mustValidPost(postRequestedId);
    const receiverId = viewId(getOwnerId(postRequested));
    assert(receiverId, 'REQ_POST_NO_OWNER', 'Publicación sin dueño');
    assert(receiverId !== userId, 'SELF_TRADE_FORBIDDEN', 'No podés ofertar sobre tu propia publicación');
    let postOffered = null;
    if (postOfferedId) {
      postOffered = await mustValidPost(postOfferedId);
      const offeredOwner = viewId(getOwnerId(postOffered));
      assert(offeredOwner === userId, 'OFFERED_NOT_OWNED', 'Debés ser dueño del post ofrecido');
    }
    assert(itemsText || postOfferedId, 'OFFER_REQUIRED', 'Ofrecé itemsText o postOfferedId');
    let finalMeetingArea = (meetingArea || '').trim();
    const requestedBarrio = postRequested.barrio || '';
    const offeredBarrio = postOffered?.barrio || '';
    if (!finalMeetingArea) {
      if (requestedBarrio && offeredBarrio) {
        if (requestedBarrio === offeredBarrio) {
          finalMeetingArea = requestedBarrio;
        } else {
          finalMeetingArea = offeredBarrio + ' ↔ ' + requestedBarrio;
        }
      } else {
        finalMeetingArea = requestedBarrio || offeredBarrio || '';
      }
    }
    let chat = await Chat.findOne({ participants: { $all: [userId, receiverId] } });
    if (!chat) {
      chat = await Chat.create({ participants: [userId, receiverId] });
    }
    const trade = await Trade.create({
      proposerId: userId,
      receiverId,
      postRequestedId,
      postOfferedId: postOfferedId || undefined,
      itemsText: itemsText?.trim(),
      status: 'pending',
      history: [{ by: userId, action: 'created' }],
      chatId: chat._id,
      meetingArea: finalMeetingArea || undefined
    });
    const notifyUser = String(trade.proposerId) === String(userId) ? trade.receiverId : trade.proposerId;
    await Notification.create({
      user: notifyUser,
      type: "TRADE_REQUEST",
      title: "Nueva propuesta de trueque",
      message: `${sender.name} te envió una propuesta de trueque.`,
      link: `/chat/${userId}`
    });
    console.log("Creating notification for:", trade.receiverId);
    res.status(201).json(trade);
  } catch (err) {
    console.error("ERROR CREANDO NOTIFICACION:", err);
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
        .populate('postRequestedId', 'title barrio images')
        .populate('postOfferedId', 'title barrio images')
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
      .populate('postRequestedId', 'title barrio images')
      .populate('postOfferedId', 'title barrio images')
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
    pending: ['accept', 'reject', 'cancel', 'counter'],
    countered: ['accept', 'reject', 'cancel', 'counter'],
    accepted: ['finish', 'cancel'],
    rejected: [],
    cancelled: [],
    finished: []
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
    assert(canTransition(trade.status, action), 'BAD_STATE', 'Estado no permite la acción');
    if (!Array.isArray(trade.finishedBy)) {
      trade.finishedBy = [];
    }
    const from = trade.status;
    let to;
    let message;
    if (action === 'cancel') {
      if (trade.status === "pending") {
        assert(
          viewId(trade.proposerId) === userId,
          "ONLY_PROPOSER",
          "Solo quien propuso puede cancelar mientras está pendiente"
        );
      }
      to = "cancelled";
      trade.finishedBy = [];
    } else if (action === "finish") {
      assert(trade.status === "accepted", 'BAD_STATE', 'Solo se finalizan trueques aceptados');
      const me = viewId(userId);
      const participants = [viewId(trade.proposerId), viewId(trade.receiverId)];
      const alreadyMarked = trade.finishedBy.some(id => viewId(id) === me);
      if (!alreadyMarked) {
        trade.finishedBy.push(userId);
      }
      const finishedSet = new Set(trade.finishedBy.map(id => viewId(id)));
      const bothFinished = participants.every(id => finishedSet.has(id));
      if (bothFinished) {
        to = "finished";
        message = "El trueque finalizó exitosamente.";
      } else {
        to = from;
        message = "La otra persona marcó el trueque como realizado. Confirmalo cuando también hayas hecho el intercambio.";
      }
    } else {
      assert(viewId(trade.receiverId) === userId, 'ONLY_RECEIVER', 'Solo el receptor puede aceptar o rechazar');
      to = action === "accept" ? "accepted" : "rejected";
      if (to !== "accepted") {
        trade.finishedBy = [];
      }
    }
    const actionNames = {
      accept: "accepted",
      reject: "rejected",
      cancel: "cancelled",
      finish: "finished"
    };
    const statusMessages = {
      accepted: "El receptor aceptó tu propuesta de trueque.",
      rejected: "Tu propuesta de trueque fue rechazada.",
      cancelled: "El trueque fue cancelado.",
      finished: "El trueque finalizó exitosamente."
    };
    trade.status = to;
    const historyNote = action === "finish" && to === from
      ? "El usuario marcó el trueque como realizado. Falta que la otra parte también lo marque."
      : undefined;
    trade.history.push({
      by: userId,
      action: actionNames[action],
      from,
      to,
      ...(historyNote ? { note: historyNote } : {})
    });
    if (!message) {
      message = statusMessages[to] || `El trueque cambió su estado a: ${to}.`;
    }
    const notifyUser = String(trade.proposerId) === String(userId) ? trade.receiverId : trade.proposerId;
    await Notification.create({
      user: notifyUser,
      type: "TRADE_UPDATE",
      title: to === "finished" ? "Trueque finalizado" : "Actualización en un trueque",
      message,
      link: `/chat/${userId}`
    });
    const chat = await ensureChatForTrade(trade);
    await postSystemMessage(chat._id, userId, message);
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
    const chat = await ensureChatForTrade(trade);
    const sender = await User.findById(userId).select('name').lean();
    const autoText = `${sender?.name || 'Alguien'} envió una contraoferta en este trueque.`;
    await postSystemMessage(chat._id, userId, autoText);
    const notifyUser = String(trade.proposerId) === String(userId) ? trade.receiverId : trade.proposerId;
    await Notification.create({
      user: notifyUser,
      type: "TRADE_UPDATE",
      title: "Nueva contraoferta en tu trueque",
      message: autoText,
      link: `/chat/${userId}`
    });
    await trade.save();
    res.json(trade.toJSON());
  } catch (err) {
    res.status(400).json({ code: err.code || 'TRADE_COUNTER_ERROR', error: err.message });
  }
}

export async function suggestMeeting(req, res) {
  try {
    const userId = req.user.id;
    const { meetingPlaceId, placeName, placeAddress, barrio, lat, lng, note } = req.body;
    const trade = await Trade.findById(req.params.id);
    assert(trade, 'NOT_FOUND', 'Trueque no encontrado');
    assert([viewId(trade.proposerId), viewId(trade.receiverId)].includes(userId), 'FORBIDDEN', 'No autorizado');
    assert(!TERMINAL.has(trade.status), 'TRADE_CLOSED', 'El trueque está cerrado, no se pueden proponer puntos de encuentro');
    const hasLocationData =
      meetingPlaceId ||
      placeName ||
      barrio ||
      (typeof lat === 'number' && typeof lng === 'number');
    assert(hasLocationData, 'MEETING_PLACE_REQUIRED', 'Debés indicar al menos un lugar o barrio');
    if (trade.meeting && trade.meeting.status === 'confirmed') {
      assert(false, 'MEETING_ALREADY_CONFIRMED', 'Ya hay un punto de encuentro confirmado, cancelalo antes de proponer otro');
    }
    trade.meeting = trade.meeting || {};
    trade.meeting.status = 'proposed';
    trade.meeting.placeId = meetingPlaceId || undefined;
    trade.meeting.placeName = placeName || '';
    trade.meeting.placeAddress = placeAddress || '';
    trade.meeting.barrio = barrio || '';
    if (typeof lat === 'number') trade.meeting.lat = lat;
    if (typeof lng === 'number') trade.meeting.lng = lng;
    trade.meeting.suggestedBy = userId;
    trade.meeting.acceptedBy = [userId];
    trade.meeting.suggestedAt = new Date();
    trade.meeting.confirmedAt = undefined;
    if (!trade.meetingArea && barrio) {
      trade.meetingArea = barrio;
    }
    const from = trade.status;
    trade.history.push({
      by: userId,
      action: 'meeting_suggested',
      from,
      to: from,
      note: note && String(note).trim() ? String(note).trim() : undefined
    });
    const chat = await ensureChatForTrade(trade);
    const summary = buildMeetingSummary(trade.meeting, trade.meetingArea);
    const sender = await User.findById(userId).select('name').lean();
    const autoText = `${sender?.name || 'Alguien'} sugirió encontrarse en ${summary}.`;
    await postSystemMessage(chat._id, userId, autoText);
    const notifyUser = String(trade.proposerId) === String(userId) ? trade.receiverId : trade.proposerId;
    await Notification.create({
      user: notifyUser,
      type: "TRADE_MEETING",
      title: "Nueva propuesta de punto de encuentro",
      message: autoText,
      link: `/chat/${userId}`
    });
    await trade.save();
    res.json(trade.toJSON());
  } catch (err) {
    res.status(400).json({ code: err.code || 'TRADE_MEETING_SUGGEST_ERROR', error: err.message });
  }
}

export async function acceptMeeting(req, res) {
  try {
    const userId = req.user.id;
    const trade = await Trade.findById(req.params.id);
    assert(trade, 'NOT_FOUND', 'Trueque no encontrado');
    assert([viewId(trade.proposerId), viewId(trade.receiverId)].includes(userId), 'FORBIDDEN', 'No autorizado');
    assert(!TERMINAL.has(trade.status), 'TRADE_CLOSED', 'El trueque está cerrado, no se pueden aceptar puntos de encuentro');
    assert(trade.meeting && trade.meeting.status === 'proposed', 'NO_MEETING_PROPOSED', 'No hay un punto de encuentro propuesto');
    if (!Array.isArray(trade.meeting.acceptedBy)) {
      trade.meeting.acceptedBy = [];
    }
    const alreadyAccepted = trade.meeting.acceptedBy.some(id => viewId(id) === viewId(userId));
    if (!alreadyAccepted) {
      trade.meeting.acceptedBy.push(userId);
    }
    const participants = [viewId(trade.proposerId), viewId(trade.receiverId)];
    const acceptedSet = new Set(trade.meeting.acceptedBy.map(id => viewId(id)));
    const bothAccepted = participants.every(id => acceptedSet.has(id));
    let noteText = 'El usuario aceptó el punto de encuentro propuesto.';
    if (bothAccepted) {
      trade.meeting.status = 'confirmed';
      trade.meeting.confirmedAt = new Date();
      noteText = 'Ambas partes aceptaron el punto de encuentro. Quedó confirmado.';
    }
    const from = trade.status;
    trade.history.push({
      by: userId,
      action: 'meeting_accepted',
      from,
      to: from,
      note: noteText
    });
    const chat = await ensureChatForTrade(trade);
    const summary = buildMeetingSummary(trade.meeting, trade.meetingArea);
    const sender = await User.findById(userId).select('name').lean();
    let autoText;
    if (bothAccepted) {
      autoText = `${sender?.name || 'Alguien'} aceptó el punto de encuentro. Ambas partes se encontrarán en ${summary}.`;
    } else {
      autoText = `${sender?.name || 'Alguien'} aceptó el punto de encuentro propuesto. Falta que la otra parte confirme.`;
    }
    await postSystemMessage(chat._id, userId, autoText);
    const notifyUser = String(trade.proposerId) === String(userId) ? trade.receiverId : trade.proposerId;
    await Notification.create({
      user: notifyUser,
      type: "TRADE_MEETING",
      title: bothAccepted ? "Punto de encuentro confirmado" : "Aceptaron tu propuesta de encuentro",
      message: autoText,
      link: `/chat/${userId}`
    });
    await trade.save();
    res.json(trade.toJSON());
  } catch (err) {
    res.status(400).json({ code: err.code || 'TRADE_MEETING_ACCEPT_ERROR', error: err.message });
  }
}

export async function rejectMeeting(req, res) {
  try {
    const userId = req.user.id;
    const { note } = req.body;
    const trade = await Trade.findById(req.params.id);
    assert(trade, 'NOT_FOUND', 'Trueque no encontrado');
    assert([viewId(trade.proposerId), viewId(trade.receiverId)].includes(userId), 'FORBIDDEN', 'No autorizado');
    assert(!TERMINAL.has(trade.status), 'TRADE_CLOSED', 'El trueque está cerrado, no se pueden rechazar puntos de encuentro');
    assert(trade.meeting && trade.meeting.status === 'proposed', 'NO_MEETING_PROPOSED', 'No hay un punto de encuentro propuesto');
    trade.meeting = { status: 'none' };
    const from = trade.status;
    trade.history.push({
      by: userId,
      action: 'meeting_rejected',
      from,
      to: from,
      note: note && String(note).trim() ? String(note).trim() : 'El usuario rechazó el punto de encuentro propuesto.'
    });
    const chat = await ensureChatForTrade(trade);
    const sender = await User.findById(userId).select('name').lean();
    const autoText = `${sender?.name || 'Alguien'} rechazó el punto de encuentro propuesto. Podés sugerir otro lugar.`;
    await postSystemMessage(chat._id, userId, autoText);
    const notifyUser = String(trade.proposerId) === String(userId) ? trade.receiverId : trade.proposerId;
    await Notification.create({
      user: notifyUser,
      type: "TRADE_MEETING",
      title: "Rechazaron tu punto de encuentro",
      message: autoText,
      link: `/chat/${userId}`
    });
    await trade.save();
    res.json(trade.toJSON());
  } catch (err) {
    res.status(400).json({ code: err.code || 'TRADE_MEETING_REJECT_ERROR', error: err.message });
  }
}

export async function cancelMeeting(req, res) {
  try {
    const userId = req.user.id;
    const { note } = req.body;
    const trade = await Trade.findById(req.params.id);
    assert(trade, 'NOT_FOUND', 'Trueque no encontrado');
    assert([viewId(trade.proposerId), viewId(trade.receiverId)].includes(userId), 'FORBIDDEN', 'No autorizado');
    assert(!TERMINAL.has(trade.status), 'TRADE_CLOSED', 'El trueque está cerrado, no se pueden cancelar puntos de encuentro');
    assert(trade.meeting && trade.meeting.status === 'confirmed', 'NO_MEETING_CONFIRMED', 'No hay un punto de encuentro confirmado para cancelar');
    trade.meeting = { status: 'none' };
    const from = trade.status;
    const noteText = note && String(note).trim()
      ? String(note).trim()
      : 'El usuario canceló el punto de encuentro acordado.';
    trade.history.push({
      by: userId,
      action: 'meeting_cancelled',
      from,
      to: from,
      note: noteText
    });
    const chat = await ensureChatForTrade(trade);
    const sender = await User.findById(userId).select('name').lean();
    const autoText = `${sender?.name || 'Alguien'} canceló el punto de encuentro acordado.`;
    await postSystemMessage(chat._id, userId, autoText);
    const notifyUser = String(trade.proposerId) === String(userId) ? trade.receiverId : trade.proposerId;
    await Notification.create({
      user: notifyUser,
      type: "TRADE_MEETING",
      title: "Se canceló el punto de encuentro",
      message: autoText,
      link: `/chat/${userId}`
    });
    await trade.save();
    res.json(trade.toJSON());
  } catch (err) {
    res.status(400).json({ code: err.code || 'TRADE_MEETING_CANCEL_ERROR', error: err.message });
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
    const isProposer = trade.proposerId.equals(userId);
    const isReceiver = trade.receiverId.equals(userId);
    if (!isProposer && !isReceiver) {
      return res.status(403).json({ message: "No pertenecés a este trade" });
    }
    const to = isProposer ? trade.receiverId : trade.proposerId;
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