import { z } from 'zod';
import Movie from '../models/Movie.js';
import Showtime from '../models/Showtime.js';
import Booking from '../models/Booking.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const movieSchema = z.object({ title: z.string().trim().min(1).max(140), description: z.string().trim().min(10).max(3000), posterUrl: z.string().optional().default(''), backdropUrl: z.string().optional().default(''), genre: z.array(z.string()).min(1), language: z.array(z.string()).min(1), durationMinutes: z.coerce.number().int().min(1).max(500), releaseDate: z.coerce.date(), rating: z.coerce.number().min(0).max(10).default(7), cast: z.array(z.string()).default([]), certification: z.string().default('UA'), status: z.enum(['NOW_SHOWING', 'COMING_SOON']).default('NOW_SHOWING') });
export const listMovies = asyncHandler(async (req, res) => {
  const { q, genre, language, status, page = '1', limit = '24' } = req.query;
  const filter = {};
  if (q) filter.$or = [{ title: { $regex: String(q).slice(0, 80), $options: 'i' } }, { description: { $regex: String(q).slice(0, 80), $options: 'i' } }];
  if (genre) filter.genre = { $in: [genre] };
  if (language) filter.language = { $in: [language] };
  if (status && ['NOW_SHOWING', 'COMING_SOON'].includes(status)) filter.status = status;
  const p = Math.max(1, Number.parseInt(page, 10) || 1), l = Math.min(60, Math.max(1, Number.parseInt(limit, 10) || 24));
  const [items, total] = await Promise.all([Movie.find(filter).sort({ status: 1, releaseDate: -1 }).skip((p - 1) * l).limit(l), Movie.countDocuments(filter)]);
  res.json({ success: true, data: { items, pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) } } });
});
export const getMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) throw new AppError('Movie not found.', 404, 'MOVIE_NOT_FOUND');
  const showtimes = await Showtime.find({ movie: movie._id, startTime: { $gt: new Date() }, isActive: true }).populate('cinema', 'name city location facilities').sort({ startTime: 1 });
  res.json({ success: true, data: { movie, showtimes } });
});
export const createMovie = asyncHandler(async (req, res) => { const parsed = movieSchema.safeParse(req.body); if (!parsed.success) throw new AppError(parsed.error.issues.map(i => i.message).join(' '), 400, 'VALIDATION_ERROR'); const movie = await Movie.create(parsed.data); res.status(201).json({ success: true, data: { movie } }); });
export const updateMovie = asyncHandler(async (req, res) => { const parsed = movieSchema.partial().safeParse(req.body); if (!parsed.success) throw new AppError(parsed.error.issues.map(i => i.message).join(' '), 400, 'VALIDATION_ERROR'); const movie = await Movie.findByIdAndUpdate(req.params.id, parsed.data, { new: true, runValidators: true }); if (!movie) throw new AppError('Movie not found.', 404, 'MOVIE_NOT_FOUND'); res.json({ success: true, data: { movie } }); });
export const deleteMovie = asyncHandler(async (req, res) => { const movie = await Movie.findById(req.params.id); if (!movie) throw new AppError('Movie not found.', 404, 'MOVIE_NOT_FOUND'); const showtimeIds = await Showtime.find({ movie: movie._id }).distinct('_id'); if (showtimeIds.length) throw new AppError('This movie still has showtime records. Remove eligible showtimes first; bookings and their history are preserved.', 409, 'MOVIE_HAS_SHOWTIMES'); if (await Booking.exists({ showtime: { $in: showtimeIds } })) throw new AppError('This movie has booking history and cannot be deleted.', 409, 'MOVIE_HAS_BOOKINGS'); await movie.deleteOne(); res.json({ success: true, data: { message: 'Movie deleted.' } }); });
