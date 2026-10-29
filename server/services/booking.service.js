import mongoose from 'mongoose';
import crypto from 'node:crypto';
import Booking from '../models/Booking.js';
import Showtime from '../models/Showtime.js';
import { AppError } from '../utils/errors.js';

const emitSeats = (io, showtime) => {
  if (io) io.to(`showtime:${showtime._id}`).emit('seats:updated', {
    showtimeId: showtime._id.toString(),
    seats: showtime.seats.map(s => ({ seatNumber: s.seatNumber, status: s.status, seatType: s.seatType, price: s.price }))
  });
};

/**
 * Seat claims are made with one conditional, single-document MongoDB update. MongoDB
 * serializes writes to this showtime document, so competing requests cannot both claim
 * the same currently-available seat. A compensating update releases claims if the booking
 * document cannot be persisted. See docs/ARCHITECTURE.md for the trade-offs.
 */
export async function createBooking({ user, showtimeId, seatNumbers, io }) {
  if (!mongoose.isValidObjectId(showtimeId)) throw new AppError('Invalid showtime.', 400, 'INVALID_SHOWTIME');
  if (!Array.isArray(seatNumbers) || seatNumbers.length < 1 || seatNumbers.length > 10) throw new AppError('Select between 1 and 10 seats.', 400, 'INVALID_SEATS');
  if (seatNumbers.some(s => typeof s !== 'string' || !s.trim()) || new Set(seatNumbers).size !== seatNumbers.length) throw new AppError('Seat selection is invalid or contains duplicates.', 400, 'INVALID_SEATS');

  const before = await Showtime.findOne({ _id: showtimeId, isActive: true, startTime: { $gt: new Date() } }).populate('movie', 'title posterUrl').populate('cinema', 'name city');
  if (!before) throw new AppError('This showtime is no longer available.', 404, 'SHOWTIME_NOT_FOUND');
  const seatLookup = new Map(before.seats.map(s => [s.seatNumber, s]));
  const selected = seatNumbers.map(n => seatLookup.get(n));
  if (selected.some(s => !s)) throw new AppError('One or more selected seats do not exist.', 400, 'UNKNOWN_SEAT');
  if (selected.some(s => s.status !== 'AVAILABLE')) throw new AppError('One or more seats have just been booked. Please choose different seats.', 409, 'SEAT_UNAVAILABLE');
  const bookingId = new mongoose.Types.ObjectId();
  const bookingReference = `IM-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const claimFilter = {
    _id: before._id, isActive: true, startTime: { $gt: new Date() },
    movie: before.movie._id, cinema: before.cinema._id, screenName: before.screenName,
    $expr: { $and: [
      { $eq: ['$startTime', before.startTime] },
      { $eq: ['$endTime', before.endTime] },
      { $eq: [{ $size: { $filter: { input: '$seats', as: 'seat', cond: { $in: ['$$seat.seatNumber', seatNumbers] } } } }, seatNumbers.length] },
      { $eq: [{ $size: { $filter: { input: '$seats', as: 'seat', cond: { $and: [{ $in: ['$$seat.seatNumber', seatNumbers] }, { $ne: ['$$seat.status', 'AVAILABLE'] }] } } } }, 0] }
    ] }
  };
  const claimUpdate = [{ $set: { seats: { $map: { input: '$seats', as: 'seat', in: { $cond: [
    { $in: ['$$seat.seatNumber', seatNumbers] },
    { $mergeObjects: ['$$seat', { status: 'BOOKED', bookingId }] },
    '$$seat'
  ] } } } } }];
  const claimed = await Showtime.findOneAndUpdate(claimFilter, claimUpdate, { new: true, updatePipeline: true });
  if (!claimed) throw new AppError('Seat availability or showtime details changed while you were booking. Refresh the seat map and try again.', 409, 'SEAT_RACE_LOST');
  // Derive totals from the document returned by the successful atomic claim, not the pre-read.
  const claimedSeats = claimed.seats.filter(seat => seatNumbers.includes(seat.seatNumber));
  const totalAmount = claimedSeats.reduce((sum, seat) => sum + seat.price, 0);

  try {
    const booking = await Booking.create({
      _id: bookingId, bookingReference, user: user._id, showtime: before._id,
      movieTitle: before.movie.title, cinemaName: before.cinema.name, screenName: before.screenName,
      startTime: before.startTime, seatNumbers, totalAmount,
      status: 'CONFIRMED', payment: { mode: 'DEMO', status: 'SIMULATED_SUCCESS' }
    });
    emitSeats(io, claimed);
    return booking;
  } catch (error) {
    // Best-effort compensation: only release seats still carrying this reservation ID.
    await Showtime.updateOne({ _id: before._id }, [{ $set: { seats: { $map: { input: '$seats', as: 'seat', in: { $cond: [
      { $eq: ['$$seat.bookingId', bookingId] },
      { $mergeObjects: ['$$seat', { status: 'AVAILABLE', bookingId: null }] },
      '$$seat'
    ] } } } } }]).catch(console.error);
    throw error;
  }
}

export async function cancelBooking({ booking, io }) {
  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, status: 'CONFIRMED' },
    { $set: { status: 'CANCELLED', cancelledAt: new Date(), 'payment.status': 'REFUNDED_DEMO' } },
    { new: true }
  );
  if (!updated) throw new AppError('This booking is already cancelled or cannot be cancelled.', 409, 'BOOKING_NOT_CANCELLABLE');
  const released = await Showtime.updateOne({ _id: updated.showtime }, [{ $set: { seats: { $map: { input: '$seats', as: 'seat', in: { $cond: [
    { $and: [{ $eq: ['$$seat.bookingId', updated._id] }, { $eq: ['$$seat.status', 'BOOKED'] }] },
    { $mergeObjects: ['$$seat', { status: 'AVAILABLE', bookingId: null }] },
    '$$seat'
  ] } } } } }]);
  const current = await Showtime.findById(updated.showtime);
  if (current) emitSeats(io, current);
  if (!released.matchedCount) throw new AppError('Booking was cancelled, but seat release needs administrator review.', 500, 'SEAT_RELEASE_FAILED');
  return updated;
}
