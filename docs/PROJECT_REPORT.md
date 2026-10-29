# IMovies — Full-Stack Project Report

## 1. Technical Architecture

IMovies uses React and Vite as the browser application, Express as a REST API, Mongoose for model/validation support, and MongoDB for persistence. The client calls `/api` endpoints with Axios and sends the HTTP-only authentication cookie. Socket.IO publishes seat availability changes to clients who are viewing a specific showtime. Controllers handle HTTP input/output while a booking service encapsulates the seat-claiming business rule.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the component diagram and discussion of the booking consistency strategy.

## 2. ER-Diagram

The core entities are User, Movie, Cinema, Showtime and Booking. User has many bookings; Movie and Cinema each have many showtimes; a showtime can be referenced by multiple current or cancelled bookings. The seat inventory is embedded in Showtime because availability is scoped to one screening. The full Mermaid diagram is in [`ER_DIAGRAM.md`](ER_DIAGRAM.md).

## 3. Features

- Movie catalogue, search, genre/language filters, movie details, showtimes and poster fallbacks.
- Registration, login/logout, hashed passwords and protected account routes.
- Cinema/showtime selection, seat-type pricing, a real-time seat map, booking review, simulated checkout and confirmation reference.
- Booking history, cancellation rules, demo status/refund labels and text ticket download.
- Admin dashboard, movie/cinema/showtime management, booking review and administration APIs.
- API error handling, request validation, CORS, Helmet, rate limiting and environment-file examples.

## 4. Roles and Responsibilities

**Guest:** browse the film catalogue and movie details.

**User:** register/sign in, select seats, create a booking, view their own booking records and cancel eligible future bookings.

**Admin:** use the admin dashboard to create/update/delete eligible catalogue records, configure showtimes, and review/cancel future bookings. The API checks the persisted role on every protected admin route.

## 5. User Flow

The typical flow is: open application → browse/search movies → view movie details → select cinema and showtime → sign in/register → choose seats → review the order and server-derived total → confirm simulated checkout → view the confirmation and booking reference → revisit the record in My Bookings.

See [`USER_FLOW.md`](USER_FLOW.md) for the flowchart and error scenarios.

## 6. MVC Pattern

- **Model:** Mongoose models in `server/models/` describe users, movies, cinemas, showtimes and bookings, and define validation/index rules.
- **View:** React components/pages in `client/src/` display data and capture user input.
- **Controller:** Express controllers in `server/controllers/` validate HTTP-level intent, call model/service operations and shape the response.
- **Service layer:** `server/services/booking.service.js` separates critical seat availability, booking persistence, and cancellation behavior from HTTP routing.

## 7. Creating Project Folder

The root folder contains `client`, `server`, `docs`, a root `package.json`, `.gitignore`, and this README. The client and server have their own package manifests. Node dependencies and build artifacts are excluded from Git.

## 8. Client Setup

The frontend uses React 18, Vite, React Router, Axios, Bootstrap 5, Socket.IO Client, and Lucide icons. `client/src/main.jsx` imports Bootstrap and custom CSS; `client/src/App.jsx` declares the app routes and context providers. Client API URLs can be set with `VITE_API_URL` and `VITE_SOCKET_URL` in `client/.env`.

## 9. Server Setup

`server/server.js` loads environment variables, creates an HTTP server, attaches Socket.IO, configures showtime rooms, connects to MongoDB, and then listens on the port. `server/app.js` configures middleware, health check, API routes, 404 handling and centralized errors. The default local API port is 5000.

## 10. Backend Structure

- `config/db.js`: Mongoose connection.
- `models/`: schema definitions, references, indexes and seat inventory.
- `routes/`: route-to-controller map plus auth guards.
- `controllers/`: request validation and API responses.
- `services/booking.service.js`: atomic seat claim and cancellation.
- `middleware/`: JWT verification, admin-role checks, validation and error mapping.
- `sockets/`: showtime room join/leave behavior.
- `scripts/seed.js`: sample data and optional admin setup.
- `tests/`: API smoke tests.

## 11. Development and Explanation — Backend

The Express server exposes JSON routes under `/api`. Zod is used to validate key request bodies. Async controllers pass errors to centralized middleware. Authentication middleware reads the HTTP-only cookie (or a Bearer token for API tools), verifies the JWT, loads the current user, and attaches it to the request. The admin middleware rejects normal users with a `403` response.

## 12. Configure MongoDB

Install MongoDB Community Server and start its local service, or configure a MongoDB Atlas URI. Copy `server/.env.example` to `server/.env`, set `MONGODB_URI` and `JWT_SECRET`, and optionally supply `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Do not commit the `.env` file. Mongoose creates the database/collections after seed or application writes; no manual database creation command is needed.

## 13. Create Database Connection

`server/config/db.js` calls `mongoose.connect` using `MONGODB_URI` and a finite selection timeout. The server starts accepting requests only once the connection is established. A failed connection prints a startup error rather than silently running against a missing database.

## 14. Create Schema and Models

- User: name, unique lowercase email, bcrypt hash, role and timestamps.
- Movie: title, description, poster/backdrop, genres, languages, duration, release date, rating, cast, certification and status.
- Cinema: name, location, city, facilities, screens and active state.
- Showtime: movie/cinema references, screen name, start/end time, and embedded seat inventory. Seat numbers are validated for uniqueness in one showtime.
- Booking: unique reference, user/showtime references, seat numbers, amount, display snapshots, booking status and demo-payment status.

Passwords are stored as hashes and omitted from normal JSON representations. The backend calculates total price from selected seat records, not from a value submitted by the browser.

## 15. Frontend Structure

`components/` contains shared UI elements. `context/` contains authentication and toast contexts. `services/` contains the Axios and Socket.IO clients. `pages/` contains the main browsing, auth, booking, account and administration views. `ProtectedRoute` enforces sign-in and admin-only frontend navigation; backend middleware separately enforces access control.

## 16. Development and Explanation — Frontend

React Router handles navigation. Axios calls Express and includes credentials so the browser sends the HTTP-only cookie. The seat selection page joins a Socket.IO room and updates available/occupied states from server broadcasts. Booking review re-fetches the showtime and checks current seat status; final confirmation submits seat IDs/numbers to the server, where all seats and prices are validated again. The browser then displays the booking reference returned by the API.

## 17. Steps for Project Execution

From a clean clone:

```bash
npm run install:all
# copy server/.env.example to server/.env and edit values
npm run seed
npm run dev
```

Open `http://localhost:5173`. Check `http://localhost:5000/api/health` to verify API startup. For a production frontend build use `npm run build`. Run the configured API smoke tests using `npm test`.

## 18. Output Screenshots

Capture genuine screenshots after running the application with MongoDB and seeded records. Recommended files: `home.png`, `movie-details.png`, `seat-selection.png`, `booking-confirmation.png`, `my-bookings.png`, and `admin-dashboard.png`. Save them in `docs/screenshots/` and add them to the README. No screenshots are claimed to exist until captured from a running browser.

## 19. Demo Video

Use [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) to record a 3–5 minute walkthrough. Record the real app rather than a mockup, and upload the recording to a destination you control. Add its actual URL to the README afterward; do not include an invented video link.
