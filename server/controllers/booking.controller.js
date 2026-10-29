import { z } from 'zod';
import Booking from '../models/Booking.js';
import Showtime from '../models/Showtime.js';
import { createBooking, cancelBooking } from '../services/booking.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const createSchema = z.object({ showtimeId: z.string(), seatNumbers: z.array(z.string()).min(1).max(10) });
export const bookSeats = asyncHandler(async (req, res) => {
  const p = createSchema.safeParse(req.body); if (!p.success) throw new AppError(p.error.issues.map(i => i.message).join(' '));
  const booking = await createBooking({ user: req.user, ...p.data, io: req.app.get('io') });
  res.status(201).json({ success: true, data: { booking } });
});
export const myBookings = asyncHandler(async (req, res) => {
  const items = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100).populate({ path: 'showtime', select: 'startTime screenName', populate: { path: 'movie', select: 'posterUrl' } });
  res.json({ success: true, data: { items } });
});
export const getBooking = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'ADMIN' ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id };
  const booking = await Booking.findOne(filter).populate({ path: 'showtime', select: 'startTime endTime screenName seats', populate: [{ path: 'movie', select: 'title posterUrl durationMinutes' }, { path: 'cinema', select: 'name city location' }] });
  if (!booking) throw new AppError('Booking not found.', 404, 'BOOKING_NOT_FOUND');
  res.json({ success: true, data: { booking } });
});
export const cancelMyBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
  if (!booking) throw new AppError('Booking not found.', 404, 'BOOKING_NOT_FOUND');
  const showtime = await Showtime.findById(booking.showtime);
  if (!showtime || showtime.startTime.getTime() <= Date.now() + 2 * 60 * 60 * 1000) throw new AppError('Bookings can only be cancelled at least 2 hours before showtime.', 409, 'CANCELLATION_WINDOW_CLOSED');
  const cancelled = await cancelBooking({ booking, io: req.app.get('io') });
  res.json({ success: true, data: { booking: cancelled } });
});
export const adminBookings = asyncHandler(async (req, res) => {
  const { status, q } = req.query; const filter = {};
  if (status && ['CONFIRMED', 'CANCELLED'].includes(status)) filter.status = status;
  if (q) filter.$or = [{ bookingReference: { $regex: escapeRegex(String(q).slice(0, 50)), $options: 'i' } }, { movieTitle: { $regex: escapeRegex(String(q).slice(0, 80)), $options: 'i' } }];
  const items = await Booking.find(filter).sort({ createdAt: -1 }).limit(200).populate('user', 'name email');
  res.json({ success: true, data: { items } });
});
export const adminCancelBooking = asyncHandler(async (req, res) => { const booking = await Booking.findById(req.params.id); if (!booking) throw new AppError('Booking not found.', 404); const showtime = await Showtime.findById(booking.showtime); if (showtime && showtime.startTime > new Date()) { const cancelled = await cancelBooking({ booking, io: req.app.get('io') }); return res.json({ success: true, data: { booking: cancelled } }); } throw new AppError('Past bookings cannot be cancelled.', 409); });
