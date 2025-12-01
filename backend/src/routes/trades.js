// backend/src/routes/trades.js
import { Router } from 'express';
import { createTrade, listTrades, getTrade, changeStatus, counterOffer, rateTrade, suggestMeeting, acceptMeeting, rejectMeeting, cancelMeeting } from '../controllers/tradesController.js';
import requireAuth from '../middlewares/auth.js';

const router = Router();
router.use(requireAuth);

router.post('/', createTrade);
router.get('/', listTrades);
router.get('/:id', getTrade);
router.patch('/:id/status', changeStatus);
router.post('/:id/counter', counterOffer);
router.post('/:id/rate', rateTrade);

router.post('/:id/meeting/suggest', suggestMeeting);
router.post('/:id/meeting/accept', acceptMeeting);
router.post('/:id/meeting/reject', rejectMeeting);
router.post('/:id/meeting/cancel', cancelMeeting);

export default router;