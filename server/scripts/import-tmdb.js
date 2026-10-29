
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Movie from '../models/Movie.js';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

const headers = {
  Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
  accept: 'application/json',
};

async function tmdbFetch(path) {
  const response = await fetch(`${BASE_URL}${path}`, { headers });

  if (!response.ok) {
    throw new Error(`TMDB API error ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function importMovies() {
  if (!process.env.TMDB_ACCESS_TOKEN) {
    throw new Error('TMDB_ACCESS_TOKEN missing in server/.env');
  }

  await connectDB();

  const genresData = await tmdbFetch('/genre/movie/list?language=en');
  const genreMap = new Map(
    genresData.genres.map((genre) => [genre.id, genre.name])
  );

  const categories = [
    '/movie/popular?language=en-US&page=1',
    '/movie/now_playing?language=en-US&page=1',
    '/movie/upcoming?language=en-US&page=1',
    '/movie/top_rated?language=en-US&page=1',
  ];

  const uniqueMovies = new Map();

  for (const category of categories) {
    const data = await tmdbFetch(category);

    for (const movie of data.results ?? []) {
      uniqueMovies.set(movie.id, movie);
    }
  }

  let imported = 0;
  let skipped = 0;

  for (const movie of uniqueMovies.values()) {
    try {
      const details = await tmdbFetch(
        `/movie/${movie.id}?language=en-US`
      );

      const releaseDate = details.release_date
        ? new Date(`${details.release_date}T12:00:00Z`)
        : new Date();

      const status =
        details.release_date &&
        releaseDate > new Date()
          ? 'COMING_SOON'
          : 'NOW_SHOWING';

      const movieData = {
        tmdbId: details.id,
        title: details.title || details.original_title,
        description: details.overview || 'Description unavailable.',
        posterUrl: details.poster_path
          ? `${IMAGE_BASE}/w500${details.poster_path}`
          : '',
        backdropUrl: details.backdrop_path
          ? `${IMAGE_BASE}/w1280${details.backdrop_path}`
          : '',
        genre: (details.genre_ids || details.genres?.map((g) => g.id) || [])
          .map((id) => genreMap.get(id))
          .filter(Boolean),
        language: details.original_language
          ? [details.original_language]
          : [],
        durationMinutes: details.runtime || 120,
        releaseDate,
        rating: Math.max(
          0,
          Math.min(10, details.vote_average || 0)
        ),
        cast: [],
        certification: 'UA',
        status,
      };

      await Movie.findOneAndUpdate(
        { tmdbId: details.id },
        { $set: movieData },
        { upsert: true, new: true, runValidators: true }
      );

      imported++;
      console.log(`Imported: ${movieData.title}`);
    } catch (error) {
      skipped++;
      console.error(`Skipped ${movie.title}: ${error.message}`);
    }
  }

  console.log(`\nImport complete: ${imported} imported, ${skipped} skipped.`);
}

importMovies()
  .catch((error) => {
    console.error('TMDB import failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
