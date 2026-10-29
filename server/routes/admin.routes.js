import { Router } from 'express';
import { dashboard } from '../controllers/admin.controller.js';
import { adminBookings, adminCancelBooking } from '../controllers/booking.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
const router = Router(); router.use(requireAuth, requireAdmin);
router.get('/dashboard', dashboard); router.get('/bookings', adminBookings); router.patch('/bookings/:id/cancel', adminCancelBooking);
export default router;
