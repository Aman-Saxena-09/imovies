import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Movie from '../models/Movie.js';
import Cinema from '../models/Cinema.js';
import Showtime from '../models/Showtime.js';
import Booking from '../models/Booking.js';

const dbUri = process.env.MONGODB_TEST_URI;
describe.skipIf(!dbUri)('API integration (requires an isolated MONGODB_TEST_URI)', () => {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(16).slice(2, 8)}`;
  const adminEmail = `imovies-admin-${suffix}@example.test`;
  const userEmail = `imovies-user-${suffix}@example.test`;
  const otherEmail = `imovies-other-${suffix}@example.test`;
  const adminPassword = 'test-admin-password-29';
  const userPassword = 'test-user-password-29';
  let admin, user, otherUser, movie, cinema, showtime, adminAgent, userAgent, otherAgent;
  const createdMovieIds = [];

  beforeAll(async () => {
    process.env.JWT_SECRET ||= 'test-only-secret-that-is-not-for-production-123456789';
    if (mongoose.connection.readyState === 0) await connectDB(dbUri);
    admin = await User.create({ name: 'Integration Admin', email: adminEmail, passwordHash: await bcrypt.hash(adminPassword, 4), role: 'ADMIN' });
    movie = await Movie.create({ title: `Integration Film ${suffix}`, description: 'A film created only for the isolated IMovies API test suite.', genre: ['Drama'], language: ['English'], durationMinutes: 120, rating: 7.5, status: 'NOW_SHOWING' });
    cinema = await Cinema.create({ name: `Integration Cinema ${suffix}`, location: 'Test Road', city: 'Test City', facilities: ['Test'], screens: ['Screen 1'] });
    showtime = await Showtime.create({ movie: movie._id, cinema: cinema._id, screenName: 'Screen 1', startTime: new Date(Date.now() + 48 * 3600000), endTime: new Date(Date.now() + 50 * 3600000), seats: [
      { seatNumber: 'A1', row: 'A', seatType: 'STANDARD', price: 180, status: 'AVAILABLE' },
      { seatNumber: 'A2', row: 'A', seatType: 'PREMIUM', price: 260, status: 'AVAILABLE' },
      { seatNumber: 'A3', row: 'A', seatType: 'STANDARD', price: 180, status: 'AVAILABLE' }
    ] });
    adminAgent = request.agent(app); userAgent = request.agent(app); otherAgent = request.agent(app);
    const adminLogin = await adminAgent.post('/api/auth/login').send({ email: adminEmail, password: adminPassword });
    if (adminLogin.status !== 200) throw new Error(`Test admin login failed: ${adminLogin.status} ${JSON.stringify(adminLogin.body)}`);
    const registration = await userAgent.post('/api/auth/register').send({ name: 'Integration User', email: userEmail, password: userPassword });
    if (registration.status !== 201) throw new Error(`Test user registration failed: ${registration.status} ${JSON.stringify(registration.body)}`);
    user = await User.findOne({ email: userEmail });
    const otherRegistration = await otherAgent.post('/api/auth/register').send({ name: 'Other User', email: otherEmail, password: userPassword });
    if (otherRegistration.status !== 201) throw new Error(`Second test user registration failed: ${otherRegistration.status}`);
    otherUser = await User.findOne({ email: otherEmail });
  });

  afterAll(async () => {
    const userIds = [admin?._id, user?._id, otherUser?._id].filter(Boolean);
    if (userIds.length) await Booking.deleteMany({ user: { $in: userIds } });
    if (showtime) await Showtime.deleteOne({ _id: showtime._id });
    if (movie) await Movie.deleteOne({ _id: movie._id });
    if (createdMovieIds.length) await Movie.deleteMany({ _id: { $in: createdMovieIds } });
    if (cinema) await Cinema.deleteOne({ _id: cinema._id });
    if (userIds.length) await User.deleteMany({ _id: { $in: userIds } });
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });

  it('rejects duplicate registration and invalid login credentials', async () => {
    const duplicate = await request(app).post('/api/auth/register').send({ name: 'Duplicate User', email: userEmail, password: userPassword });
    expect(duplicate.status).toBe(409);
    const invalid = await request(app).post('/api/auth/login').send({ email: userEmail, password: 'wrong-password' });
    expect(invalid.status).toBe(401);
  });

  it('protects booking history and admin-only endpoints', async () => {
    expect((await request(app).get('/api/bookings/my')).status).toBe(401);
    expect((await userAgent.get('/api/admin/dashboard')).status).toBe(403);
    expect((await adminAgent.get('/api/admin/dashboard')).status).toBe(200);
  });

  it('allows admin movie creation', async () => {
    const response = await adminAgent.post('/api/movies').send({
      title: `Admin Created ${suffix}`, description: 'An integration test movie with a sufficiently long description.',
      genre: ['Thriller'], language: ['English'], durationMinutes: 99, releaseDate: '2027-01-01', rating: 7.2,
      cast: ['Test Cast'], certification: 'UA', status: 'NOW_SHOWING'
    });
    expect(response.status).toBe(201);
    createdMovieIds.push(response.body.data.movie._id);
  });

  it('derives booking totals on the server, prevents duplicate seats, enforces ownership and releases seats on cancellation', async () => {
    const created = await userAgent.post('/api/bookings').send({ showtimeId: showtime._id.toString(), seatNumbers: ['A1', 'A2'], totalAmount: 1 });
    expect(created.status).toBe(201);
    const booking = created.body.data.booking;
    expect(booking.totalAmount).toBe(440);
    expect(booking.payment.mode).toBe('DEMO');

    const competing = await otherAgent.post('/api/bookings').send({ showtimeId: showtime._id.toString(), seatNumbers: ['A1'] });
    expect(competing.status).toBe(409);
    expect((await otherAgent.get(`/api/bookings/${booking._id}`)).status).toBe(404);
    expect((await userAgent.get(`/api/bookings/${booking._id}`)).status).toBe(200);

    const cancellation = await userAgent.patch(`/api/bookings/${booking._id}/cancel`);
    expect(cancellation.status).toBe(200);
    expect(cancellation.body.data.booking.status).toBe('CANCELLED');
    const updatedShowtime = (await request(app).get(`/api/showtimes/${showtime._id}`)).body.data.showtime;
    expect(updatedShowtime.seats.find(s => s.seatNumber === 'A1').status).toBe('AVAILABLE');
    expect(updatedShowtime.seats.find(s => s.seatNumber === 'A2').status).toBe('AVAILABLE');
  });
});
