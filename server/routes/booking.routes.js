import { Router } from 'express';
import { bookSeats, myBookings, getBooking, cancelMyBooking } from '../controllers/booking.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
const router = Router();
router.use(requireAuth);
router.post('/', bookSeats); router.get('/my', myBookings); router.get('/:id', getBooking); router.patch('/:id/cancel', cancelMyBooking);
export default router;
