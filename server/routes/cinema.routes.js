import { Router } from 'express';
import { listCinemas, createCinema, updateCinema, deleteCinema } from '../controllers/cinema.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
const router = Router();
router.get('/', listCinemas); router.post('/', requireAuth, requireAdmin, createCinema); router.patch('/:id', requireAuth, requireAdmin, updateCinema); router.delete('/:id', requireAuth, requireAdmin, deleteCinema);
export default router;
