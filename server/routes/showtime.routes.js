import { Router } from 'express';
import { listShowtimes, getShowtime, createShowtime, updateShowtime, deleteShowtime } from '../controllers/showtime.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
const router = Router();
router.get('/', listShowtimes); router.get('/:id', getShowtime); router.post('/', requireAuth, requireAdmin, createShowtime); router.patch('/:id', requireAuth, requireAdmin, updateShowtime); router.delete('/:id', requireAuth, requireAdmin, deleteShowtime);
export default router;
