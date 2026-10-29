# IMovies REST API

Base URL during development: `http://localhost:5000/api`.

JSON routes return `{ "success": true, "data": ... }` on success and `{ "success": false, "error": { "code": "...", "message": "..." } }` on failures. Authentication uses the HTTP-only `imovies_token` cookie. Send requests from the configured frontend origin with credentials enabled.

## Health

### `GET /health`
Public. Returns service status and timestamp. Does not prove that MongoDB is connected if the API process is started independently; the current server starts listening only after the database connection succeeds.

## Authentication

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public, rate-limited | Register a user |
| POST | `/auth/login` | Public, rate-limited | Sign in and set cookie |
| POST | `/auth/logout` | Public | Clear auth cookie |
| GET | `/auth/me` | Signed in | Get current user |

Register body:
```json
{ "name": "Example User", "email": "user@example.com", "password": "change-me-123" }
```
Login body:
```json
{ "email": "user@example.com", "password": "change-me-123" }
```

Passwords must be 8–128 characters on registration. Duplicate email returns `409`. Invalid credentials return `401`. The API never returns `passwordHash`.

## Movies

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/movies?q=dune&genre=Sci-Fi&language=English&status=NOW_SHOWING&page=1&limit=24` | Public | List/filter/paginate |
| GET | `/movies/:id` | Public | Movie details plus upcoming showtimes |
| POST | `/movies` | Admin | Create movie |
| PATCH | `/movies/:id` | Admin | Update movie |
| DELETE | `/movies/:id` | Admin | Delete only after showtime records are safely removed and no booking history depends on it |

Movie write bodies use `title`, `description`, optional `posterUrl` / `backdropUrl`, `genre` array, `language` array, `durationMinutes`, `releaseDate`, `rating`, `cast` array, `certification`, and `status` (`NOW_SHOWING` or `COMING_SOON`).

## Cinemas

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/cinemas?city=Indore` | Public | List active cinemas |
| POST | `/cinemas` | Admin | Create cinema |
| PATCH | `/cinemas/:id` | Admin | Update cinema |
| DELETE | `/cinemas/:id` | Admin | Deactivate cinema; upcoming showtimes prevent deactivation |

Cinema body: `name`, `location`, `city`, optional `facilities` and `screens` arrays, optional `isActive` boolean.

## Showtimes

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/showtimes?movie=:movieId&cinema=:cinemaId&date=YYYY-MM-DD` | Public | List upcoming showtimes |
| GET | `/showtimes/:id` | Public | Showtime details and seat inventory |
| POST | `/showtimes` | Admin | Create a screening |
| PATCH | `/showtimes/:id` | Admin | Update screening fields (cannot replace seat inventory after booked seats exist) |
| DELETE | `/showtimes/:id` | Admin | Delete only if no booking history exists and no seat is booked |

Create body example (use real IDs from the database):
```json
{
  "movie": "MOVIE_OBJECT_ID",
  "cinema": "CINEMA_OBJECT_ID",
  "screenName": "Screen 1",
  "startTime": "2027-01-15T16:30:00.000Z",
  "endTime": "2027-01-15T19:00:00.000Z",
  "seats": [
    { "seatNumber": "A1", "row": "A", "seatType": "STANDARD", "price": 180 },
    { "seatNumber": "F1", "row": "F", "seatType": "PREMIUM", "price": 260 }
  ]
}
```

## Bookings

All routes require a signed-in user unless noted. Users can access only their own booking records; admins can read booking details across users.

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/bookings` | Signed in | Atomically claim seats and create a demo booking |
| GET | `/bookings/my` | Signed in | Current user's booking history |
| GET | `/bookings/:id` | Owner or admin | Booking confirmation/details |
| PATCH | `/bookings/:id/cancel` | Owner | Cancel at least two hours before the show |

Create booking body:
```json
{ "showtimeId": "SHOWTIME_OBJECT_ID", "seatNumbers": ["B2", "B3"] }
```

The backend derives the amount from the showtime seat inventory and ignores any client-supplied total. `201` returns the created booking. A seat conflict can return `409` with codes such as `SEAT_UNAVAILABLE` or `SEAT_RACE_LOST`. A cancelled booking cannot be cancelled again. The checkout is a simulation only.

## Administration

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/admin/dashboard` | Admin | User/movie/cinema/showtime/booking counts and simulated booking value |
| GET | `/admin/bookings?q=IM-...&status=CONFIRMED` | Admin | Search recent bookings |
| PATCH | `/admin/bookings/:id/cancel` | Admin | Cancel future confirmed booking |

## Socket.IO events

- Client emits `showtime:join` with a 24-character showtime ID.
- Client emits `showtime:leave` to stop receiving updates.
- Server emits `seats:updated` to the room with `{ showtimeId, seats: [{ seatNumber, status, seatType, price }] }`.

Socket events do not create bookings and must never be treated as the authority for seat availability. The booking endpoint rechecks availability.
