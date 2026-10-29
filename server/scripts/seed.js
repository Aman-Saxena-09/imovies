import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Movie from '../models/Movie.js';
import Cinema from '../models/Cinema.js';
import Showtime from '../models/Showtime.js';

const movies = [
  { title: 'Dune: Part Two', description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.', posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', backdropUrl: 'https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg', genre: ['Sci-Fi', 'Adventure'], language: ['English', 'Hindi'], durationMinutes: 166, rating: 8.5, cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson'], certification: 'UA', status: 'NOW_SHOWING' },
  { title: 'The Dark Knight', description: 'Batman faces the Joker, a criminal mastermind intent on plunging Gotham City into anarchy.', posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', backdropUrl: 'https://image.tmdb.org/t/p/w1280/hqkIcbrOHL86UncnHIsHVcVmzue.jpg', genre: ['Action', 'Crime'], language: ['English', 'Hindi'], durationMinutes: 152, rating: 9.0, cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'], certification: 'UA', status: 'NOW_SHOWING' },
  { title: 'Interstellar', description: 'A team of explorers travels beyond this galaxy to discover whether mankind has a future among the stars.', posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', backdropUrl: 'https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg', genre: ['Sci-Fi', 'Drama'], language: ['English', 'Hindi'], durationMinutes: 169, rating: 8.7, cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'], certification: 'UA', status: 'NOW_SHOWING' },
  { title: 'Spider-Man: Across the Spider-Verse', description: 'Miles Morales catapults across the Multiverse and encounters a team of Spider-People charged with protecting its existence.', posterUrl: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj9w9gQ.jpg', backdropUrl: 'https://image.tmdb.org/t/p/w1280/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg', genre: ['Animation', 'Action'], language: ['English', 'Hindi'], durationMinutes: 140, rating: 8.6, cast: ['Shameik Moore', 'Hailee Steinfeld', 'Brian Tyree Henry'], certification: 'U', status: 'NOW_SHOWING' },
  { title: 'Oppenheimer', description: 'The story of J. Robert Oppenheimer and his role in the development of the atomic bomb.', posterUrl: 'https://image.tmdb.org/t/p/w500/ptpr0kGAckfQkJeJIt8st5dglvd.jpg', backdropUrl: 'https://image.tmdb.org/t/p/w1280/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg', genre: ['Drama', 'History'], language: ['English', 'Hindi'], durationMinutes: 180, rating: 8.3, cast: ['Cillian Murphy', 'Emily Blunt', 'Robert Downey Jr.'], certification: 'A', status: 'NOW_SHOWING' },
  { title: 'Avatar: Fire and Ash', description: 'A new journey across Pandora introduces new clans and challenges for the Sully family.', posterUrl: 'https://image.tmdb.org/t/p/w500/placeholder-avatar-fire-and-ash.jpg', genre: ['Sci-Fi', 'Adventure'], language: ['English', 'Hindi'], durationMinutes: 165, rating: 0, cast: ['Sam Worthington', 'Zoe Saldaña'], certification: 'UA', status: 'COMING_SOON' },
  { title: 'Fantastic Four: First Steps', description: 'A retro-futuristic new beginning for Marvel’s first family as they face a cosmic-scale threat.', posterUrl: 'https://image.tmdb.org/t/p/w500/placeholder-fantastic-four.jpg', genre: ['Action', 'Sci-Fi'], language: ['English', 'Hindi'], durationMinutes: 120, rating: 0, cast: ['Pedro Pascal', 'Vanessa Kirby'], certification: 'UA', status: 'COMING_SOON' },
  { title: 'The Grand Budapest Hotel', description: 'A legendary concierge and his lobby boy become embroiled in the theft of a priceless painting.', posterUrl: 'https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg', backdropUrl: 'https://image.tmdb.org/t/p/w1280/nX5XotM9yprCKarRH4fzOq1VM1J.jpg', genre: ['Comedy', 'Adventure'], language: ['English'], durationMinutes: 99, rating: 8.1, cast: ['Ralph Fiennes', 'Tony Revolori', 'Saoirse Ronan'], certification: 'UA', status: 'NOW_SHOWING' }
];
const buildSeats = () => {
  const seats = [];
  for (const row of ['A', 'B', 'C', 'D', 'E', 'F']) for (let n = 1; n <= 8; n++) {
    const premium = row === 'F' || (row === 'E' && n >= 3 && n <= 6);
    seats.push({ seatNumber: `${row}${n}`, row, seatType: premium ? 'PREMIUM' : 'STANDARD', price: premium ? 260 : 180, status: 'AVAILABLE', bookingId: null });
  }
  return seats;
};

async function seed() {
  await connectDB();
  for (const data of movies) {
    await Movie.findOneAndUpdate({ title: data.title }, { $set: { ...data, releaseDate: data.status === 'COMING_SOON' ? new Date(Date.now() + 21 * 86400000) : new Date(Date.now() - 30 * 86400000) } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  }
  const cinemaData = [
    { name: 'CineSquare Central', location: 'MP Nagar, Zone 1', city: 'Bhopal', facilities: ['Dolby Atmos', 'Recliner', 'Food Court'], screens: ['Screen 1', 'Screen 2'] },
    { name: 'Starlight Cinemas', location: 'Vijay Nagar', city: 'Indore', facilities: ['Laser Projection', 'Parking', 'Snacks'], screens: ['Screen 1', 'Screen 2'] }
  ];
  const cinemas = [];
  for (const data of cinemaData) cinemas.push(await Cinema.findOneAndUpdate({ name: data.name, city: data.city }, { $set: { ...data, isActive: true } }, { upsert: true, new: true, setDefaultsOnInsert: true }));
  const nowShowing = await Movie.find({ status: 'NOW_SHOWING' }).sort({ title: 1 }).limit(6);
  // Cinema times are in India Standard Time (UTC+05:30), independent of the host OS timezone.
  // Distribute the six sample movies across two screens and three non-overlapping daily slots.
  const indiaNow = new Date(Date.now() + 330 * 60000);
  const slots = ['12:00', '16:30', '21:00'];
  for (const [movieIndex, movie] of nowShowing.entries()) for (const cinema of cinemas) for (let day = 0; day < 5; day++) {
    const dayUtc = new Date(Date.UTC(indiaNow.getUTCFullYear(), indiaNow.getUTCMonth(), indiaNow.getUTCDate() + day));
    const dayLabel = `${dayUtc.getUTCFullYear()}-${String(dayUtc.getUTCMonth() + 1).padStart(2, '0')}-${String(dayUtc.getUTCDate()).padStart(2, '0')}`;
    const clock = slots[Math.floor(movieIndex / 2) % slots.length];
    const date = new Date(`${dayLabel}T${clock}:00+05:30`);
    if (date <= new Date()) continue;
    const endTime = new Date(date.getTime() + movie.durationMinutes * 60000 + 20 * 60000);
    const screenName = cinema.screens[movieIndex % cinema.screens.length] || 'Screen 1';
    await Showtime.findOneAndUpdate({ movie: movie._id, cinema: cinema._id, startTime: date }, { $setOnInsert: { movie: movie._id, cinema: cinema._id, screenName, startTime: date, endTime, seats: buildSeats(), isActive: true } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  }
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const email = process.env.ADMIN_EMAIL.toLowerCase();
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await User.findOneAndUpdate({ email }, { $set: { name: 'IMovies Admin', passwordHash, role: 'ADMIN' } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    console.log(`Admin account configured for ${email}.`);
  } else console.log('ADMIN_EMAIL / ADMIN_PASSWORD not set; admin user was not created. Configure them in server/.env and rerun the seed script.');
  console.log(`Seed complete: ${movies.length} movies, ${cinemas.length} cinemas and upcoming showtimes are ready.`);
  await mongoose.disconnect();
}
seed().catch(async error => { console.error('Seed failed:', error.message); await mongoose.disconnect().catch(() => {}); process.exit(1); });
