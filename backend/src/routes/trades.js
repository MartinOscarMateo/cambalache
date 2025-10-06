import { Router } from 'express';
import { createTrade, listTrades, getTrade, changeStatus, counterOffer } from '../controllers/tradesController.js';
import requireAuth from '../middlewares/auth.js';

const router = Router();
router.use(requireAuth);

router.post('/', createTrade);
router.get('/', listTrades);
router.get('/:id', getTrade);
router.patch('/:id/status', changeStatus);
router.post('/:id/counter', counterOffer);

export default router;