import User from '../models/User.js';
import Movie from '../models/Movie.js';
import Cinema from '../models/Cinema.js';
import Showtime from '../models/Showtime.js';
import Booking from '../models/Booking.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const dashboard = asyncHandler(async (req, res) => {
  const [users, movies, cinemas, upcomingShowtimes, bookingCount, confirmed, cancelled, revenue] = await Promise.all([
    User.countDocuments(), Movie.countDocuments(), Cinema.countDocuments({ isActive: true }), Showtime.countDocuments({ isActive: true, startTime: { $gt: new Date() } }),
    Booking.countDocuments(), Booking.countDocuments({ status: 'CONFIRMED' }), Booking.countDocuments({ status: 'CANCELLED' }),
    Booking.aggregate([{ $match: { status: 'CONFIRMED' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }])
  ]);
  res.json({ success: true, data: { stats: { users, movies, cinemas, upcomingShowtimes, bookingCount, confirmed, cancelled, demoRevenue: revenue[0]?.total || 0 } } });
});
