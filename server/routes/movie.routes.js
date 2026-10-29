import { Router } from 'express';
import { listMovies, getMovie, createMovie, updateMovie, deleteMovie } from '../controllers/movie.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
const router = Router();
router.get('/', listMovies); router.get('/:id', getMovie);
router.post('/', requireAuth, requireAdmin, createMovie); router.patch('/:id', requireAuth, requireAdmin, updateMovie); router.delete('/:id', requireAuth, requireAdmin, deleteMovie);
export default router;
