import 'dotenv/config';
import mongoose from 'mongoose';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Movie from '../models/Movie.js';
import Cinema from '../models/Cinema.js';
import Showtime from '../models/Showtime.js';
import Booking from '../models/Booking.js';
import { createBooking } from '../services/booking.service.js';

const dbUri = process.env.MONGODB_TEST_URI;
describe.skipIf(!dbUri)('booking concurrency integration (requires isolated MONGODB_TEST_URI)', () => {
  let user, movie, cinema, showtime;
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) await connectDB(dbUri);
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    user = await User.create({ name: 'Booking Test User', email: `booking-test-${suffix}@example.test`, passwordHash: 'test-hash' });
    movie = await Movie.create({ title: `Booking Test Movie ${suffix}`, description: 'A test film used only by the isolated concurrency test.', genre: ['Drama'], language: ['English'], durationMinutes: 100, rating: 7, status: 'NOW_SHOWING' });
    cinema = await Cinema.create({ name: `Booking Test Cinema ${suffix}`, location: 'Test Lane', city: 'Test City', screens: ['Screen 1'] });
    showtime = await Showtime.create({ movie: movie._id, cinema: cinema._id, screenName: 'Screen 1', startTime: new Date(Date.now() + 24 * 3600000), endTime: new Date(Date.now() + 26 * 3600000), seats: [
      { seatNumber: 'A1', row: 'A', seatType: 'STANDARD', price: 180, status: 'AVAILABLE' },
      { seatNumber: 'A2', row: 'A', seatType: 'STANDARD', price: 180, status: 'AVAILABLE' }
    ] });
  });
  afterAll(async () => {
    if (showtime) await Booking.deleteMany({ showtime: showtime._id });
    if (showtime) await Showtime.deleteOne({ _id: showtime._id });
    if (cinema) await Cinema.deleteOne({ _id: cinema._id });
    if (movie) await Movie.deleteOne({ _id: movie._id });
    if (user) await User.deleteOne({ _id: user._id });
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
  it('allows only one of two concurrent requests to claim the same seat', async () => {
    const requests = await Promise.allSettled([
      createBooking({ user, showtimeId: showtime._id.toString(), seatNumbers: ['A1'] }),
      createBooking({ user, showtimeId: showtime._id.toString(), seatNumbers: ['A1'] })
    ]);
    expect(requests.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect(requests.filter(r => r.status === 'rejected')).toHaveLength(1);
    const current = await Showtime.findById(showtime._id);
    expect(current.seats.find(s => s.seatNumber === 'A1').status).toBe('BOOKED');
    expect(await Booking.countDocuments({ showtime: showtime._id, seatNumbers: 'A1', status: 'CONFIRMED' })).toBe(1);
  });
});
