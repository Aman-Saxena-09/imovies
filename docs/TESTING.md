# Testing and Verification

## Available automated tests

Run from the project root after dependencies are installed:

```bash
npm test
```

The current Vitest/Supertest suite checks that:
- `GET /api/health` returns a successful JSON response without requiring a database connection.
- Unknown routes return a structured JSON 404 response.

These are smoke tests; they are not evidence that MongoDB-backed registration, seat booking, concurrency handling, or cancellation were tested end to end.

## Manual test checklist

Use a dedicated local development database, never a production database.

1. Set `MONGODB_URI` in `server/.env` and start MongoDB.
2. Run `npm run seed` and confirm it creates movies, cinemas, upcoming showtimes and seat inventories.
3. Register a normal account. Verify the account persists in MongoDB and that the password is a bcrypt hash rather than plaintext.
4. Log out and log in with the new account. Check invalid password and duplicate email errors.
5. Browse movies, search for a title, apply a genre/language filter, and open movie details.
6. Open a showtime; confirm seats and price values load from the database.
7. Select standard and premium seats. Confirm the total equals the sum of server-configured seat prices.
8. Confirm a booking and verify the booking reference and booking record in MongoDB.
9. Open the same showtime in a second browser/session; verify the newly booked seats become occupied after the Socket.IO event.
10. Attempt to submit the same seat from two independent sessions at nearly the same time. At most one request should succeed; the other should receive a conflict response.
11. Try submitting nonexistent seats, duplicates, more than ten seats, and a forged total. The API should reject invalid seats and compute the amount itself.
12. Verify a user cannot read or cancel another user's booking by changing the booking ID.
13. Attempt cancellation within the two-hour cutoff and expect a conflict. Cancel an eligible future booking and verify the seat becomes available.
14. Sign in as the configured admin and verify dashboard statistics and movie/cinema/showtime CRUD.
15. Sign in as a normal user and manually open `/admin`; the client should redirect, and direct admin API calls should return `403`.
16. Run `npm run build` and `npm test`. Check browser console and backend logs during the above flow.

## Concurrency implementation note

Seat claiming is a single conditional update to the `Showtime` document. Test it with competing HTTP requests, not only two browser UI tabs, because the server is the authoritative source. The best-effort compensation path on booking creation failure also warrants a fault-injection integration test in a disposable database.

## Verification state in the generated workspace

- Backend JavaScript files passed `node --check` syntax validation.
- All client JSX files were parsed/transpiled for syntax using the available TypeScript JSX parser; no syntax diagnostics were reported.
- Import-path checks found no missing relative client/server source imports.
- Dependency installation, Vite production build, and Vitest execution were **not run** in the generation environment because npm registry DNS resolution failed (`EAI_AGAIN registry.npmjs.org`). Therefore, runtime and dependency-level tests remain unverified.

After dependencies are available, run `npm run install:all`, `npm test`, and `npm run build`. MongoDB-backed tests need a running isolated database configured through `MONGODB_TEST_URI`; do not point it at production data. Browser walkthroughs require browser automation or a manual browser session.
