
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Movie from '../models/Movie.js';
import Cinema from '../models/Cinema.js';
import Showtime from '../models/Showtime.js';

function buildSeats() {
  const seats = [];

  for (const row of ['A', 'B', 'C', 'D', 'E', 'F']) {
    for (let number = 1; number <= 8; number++) {
      const premium =
        row === 'F' || (row === 'E' && number >= 3 && number <= 6);

      seats.push({
        seatNumber: `${row}${number}`,
        row,
        seatType: premium ? 'PREMIUM' : 'STANDARD',
        price: premium ? 260 : 180,
        status: 'AVAILABLE',
        bookingId: null,
      });
    }
  }

  return seats;
}

async function generateShowtimes() {
  await connectDB();

  // Only movies imported from TMDB.
  const movies = await Movie.find({
    tmdbId: { $exists: true },
    status: 'NOW_SHOWING',
  }).sort({ title: 1 });

  const cinemas = await Cinema.find({ isActive: true });

  if (!movies.length) {
    throw new Error('No TMDB movies with NOW_SHOWING status found.');
  }

  if (!cinemas.length) {
    throw new Error('No active cinemas found. Run the seed script first.');
  }

  const slots = ['12:00', '16:30', '21:00'];
  const daysToGenerate = 7;
  let created = 0;
  let skipped = 0;

  // Use India Standard Time for schedule generation.
  const indiaNow = new Date(Date.now() + 330 * 60 * 1000);

  for (let movieIndex = 0; movieIndex < movies.length; movieIndex++) {
    const movie = movies[movieIndex];

    for (const cinema of cinemas) {
      for (let day = 0; day < daysToGenerate; day++) {
        const dayUtc = new Date(
          Date.UTC(
            indiaNow.getUTCFullYear(),
            indiaNow.getUTCMonth(),
            indiaNow.getUTCDate() + day
          )
        );

        const dayLabel = [
          dayUtc.getUTCFullYear(),
          String(dayUtc.getUTCMonth() + 1).padStart(2, '0'),
          String(dayUtc.getUTCDate()).padStart(2, '0'),
        ].join('-');

        const slot = slots[movieIndex % slots.length];
        const startTime = new Date(`${dayLabel}T${slot}:00+05:30`);

        if (startTime <= new Date()) continue;

        const endTime = new Date(
          startTime.getTime() + (movie.durationMinutes + 20) * 60000
        );

        const screenName =
          cinema.screens?.[movieIndex % (cinema.screens?.length || 1)] ||
          'Screen 1';

        // Avoid duplicating an existing showtime.
        const existing = await Showtime.exists({
          movie: movie._id,
          cinema: cinema._id,
          startTime,
        });

        if (existing) {
          skipped++;
          continue;
        }

        await Showtime.create({
          movie: movie._id,
          cinema: cinema._id,
          screenName,
          startTime,
          endTime,
          seats: buildSeats(),
          isActive: true,
        });

        created++;
      }
    }
  }

  console.log(`Showtime generation complete.`);
  console.log(`Created: ${created}`);
  console.log(`Skipped existing: ${skipped}`);
  console.log(`Movies processed: ${movies.length}`);
  console.log(`Cinemas processed: ${cinemas.length}`);
}

generateShowtimes()
  .catch((error) => {
    console.error('Showtime generation failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
