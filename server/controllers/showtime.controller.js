import { z } from 'zod';
import Movie from '../models/Movie.js';
import Cinema from '../models/Cinema.js';
import Showtime from '../models/Showtime.js';
import Booking from '../models/Booking.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';
const seatSchema = z.object({ seatNumber: z.string().trim().min(1), row: z.string().trim().min(1), seatType: z.enum(['STANDARD', 'PREMIUM']).default('STANDARD'), price: z.coerce.number().min(0) });
const showSchema = z.object({ movie: z.string(), cinema: z.string(), screenName: z.string().trim().min(1), startTime: z.coerce.date(), endTime: z.coerce.date(), seats: z.array(seatSchema).min(1).max(300) });
export const listShowtimes = asyncHandler(async (req, res) => {
  const filter = { isActive: true, startTime: { $gt: new Date() } };
  if (req.query.movie) filter.movie = req.query.movie;
  if (req.query.cinema) filter.cinema = req.query.cinema;
  if (req.query.date) { const start = new Date(`${req.query.date}T00:00:00+05:30`); const end = new Date(start.getTime() + 24 * 60 * 60 * 1000); if (!Number.isNaN(+start)) filter.startTime = { $gt: new Date(), $gte: start, $lt: end }; }
  const items = await Showtime.find(filter).populate('movie', 'title posterUrl durationMinutes rating language').populate('cinema', 'name city location').sort({ startTime: 1 });
  res.json({ success: true, data: { items } });
});
export const getShowtime = asyncHandler(async (req, res) => { const showtime = await Showtime.findOne({ _id: req.params.id, isActive: true }).populate('movie', 'title posterUrl durationMinutes rating language description').populate('cinema', 'name city location facilities'); if (!showtime) throw new AppError('Showtime not found.', 404); res.json({ success: true, data: { showtime } }); });
export const createShowtime = asyncHandler(async (req, res) => {
  const p = showSchema.safeParse(req.body); if (!p.success) throw new AppError(p.error.issues.map(i => i.message).join(' '));
  if (+p.data.endTime <= +p.data.startTime) throw new AppError('End time must be after start time.');
  const [movie, cinema] = await Promise.all([Movie.findById(p.data.movie), Cinema.findById(p.data.cinema)]);
  if (!movie || !cinema || !cinema.isActive) throw new AppError('Choose an existing movie and active cinema.');
  const overlap = await Showtime.exists({ cinema: cinema._id, screenName: p.data.screenName, isActive: true, startTime: { $lt: p.data.endTime }, endTime: { $gt: p.data.startTime } });
  if (overlap) throw new AppError('This screen already has a showtime that overlaps the selected period.', 409, 'SHOWTIME_OVERLAP');
  const seats = p.data.seats.map(s => ({ ...s, status: 'AVAILABLE', bookingId: null }));
  if (new Set(seats.map(s => s.seatNumber)).size !== seats.length) throw new AppError('Seat numbers must be unique.');
  const showtime = await Showtime.create({ ...p.data, seats }); res.status(201).json({ success: true, data: { showtime } });
});
export const updateShowtime = asyncHandler(async (req, res) => {
  const p = showSchema.partial().safeParse(req.body); if (!p.success) throw new AppError(p.error.issues.map(i => i.message).join(' '));
  const current = await Showtime.findById(req.params.id);
  if (!current) throw new AppError('Showtime not found.', 404);
  if (p.data.seats) {
    p.data.seats = p.data.seats.map(s => ({ ...s, status: 'AVAILABLE', bookingId: null }));
    if (new Set(p.data.seats.map(s => s.seatNumber)).size !== p.data.seats.length) throw new AppError('Seat numbers must be unique.');
  }
  if (+ (p.data.endTime || current.endTime) <= + (p.data.startTime || current.startTime)) throw new AppError('End time must be after start time.');
  const nextMovie = p.data.movie || current.movie;
  const nextCinema = p.data.cinema || current.cinema;
  const nextScreen = p.data.screenName || current.screenName;
  if (p.data.movie || p.data.cinema) {
    const [movie, cinema] = await Promise.all([Movie.findById(nextMovie), Cinema.findById(nextCinema)]);
    if (!movie || !cinema || !cinema.isActive) throw new AppError('Choose an existing movie and active cinema.');
  }
  const nextStart = p.data.startTime || current.startTime; const nextEnd = p.data.endTime || current.endTime;
  if (p.data.startTime || p.data.endTime || p.data.cinema || p.data.screenName) {
    const overlap = await Showtime.exists({ _id: { $ne: current._id }, cinema: nextCinema, screenName: nextScreen, isActive: true, startTime: { $lt: nextEnd }, endTime: { $gt: nextStart } });
    if (overlap) throw new AppError('This screen already has a showtime that overlaps the selected period.', 409, 'SHOWTIME_OVERLAP');
  }
  // This guard and the seat claim both write the same showtime document. An admin update
  // cannot overwrite a seat that another request has concurrently booked.
  const showtime = await Showtime.findOneAndUpdate({ _id: req.params.id, seats: { $not: { $elemMatch: { status: 'BOOKED' } } } }, p.data, { new: true, runValidators: true });
  if (!showtime) throw new AppError('Cannot update the showtime or seat inventory after a seat has been booked. Refresh and try again.', 409, 'SHOWTIME_HAS_BOOKINGS');
  res.json({ success: true, data: { showtime } });
});
export const deleteShowtime = asyncHandler(async (req, res) => {
  const existing = await Showtime.findById(req.params.id);
  if (!existing) throw new AppError('Showtime not found.', 404);
  if (await Booking.exists({ showtime: existing._id })) throw new AppError('This showtime has booking history and cannot be deleted.', 409, 'SHOWTIME_HAS_BOOKING_HISTORY');
  // Single atomic delete guard: either deletion happens before a seat claim, or
  // a successful seat claim makes the predicate fail. Booking history is checked first.
  const deleted = await Showtime.findOneAndDelete({ _id: existing._id, isActive: true, seats: { $not: { $elemMatch: { status: 'BOOKED' } } } });
  if (!deleted) throw new AppError('This showtime changed or now has booked seats. Refresh and try again.', 409, 'SHOWTIME_CHANGED');
  res.json({ success: true, data: { message: 'Showtime deleted.' } });
});
