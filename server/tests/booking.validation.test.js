import { describe, it, expect } from 'vitest';
import { createBooking } from '../services/booking.service.js';

describe('booking request validation (no database required)', () => {
  it('rejects malformed showtime IDs before accessing MongoDB', async () => {
    await expect(createBooking({ user: { _id: 'user' }, showtimeId: 'not-an-object-id', seatNumbers: ['A1'] }))
      .rejects.toMatchObject({ statusCode: 400, code: 'INVALID_SHOWTIME' });
  });
  it('rejects duplicate seat numbers before accessing MongoDB', async () => {
    await expect(createBooking({ user: { _id: 'user' }, showtimeId: '507f1f77bcf86cd799439011', seatNumbers: ['A1', 'A1'] }))
      .rejects.toMatchObject({ statusCode: 400, code: 'INVALID_SEATS' });
  });
  it('limits a booking to ten seats', async () => {
    await expect(createBooking({ user: { _id: 'user' }, showtimeId: '507f1f77bcf86cd799439011', seatNumbers: Array.from({ length: 11 }, (_, i) => `A${i + 1}`) }))
      .rejects.toMatchObject({ statusCode: 400, code: 'INVALID_SEATS' });
  });
});
