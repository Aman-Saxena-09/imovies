# IMovies Demo Video Script (3–5 minutes)

Record the real app running locally with seeded MongoDB data. Do not show credentials or a real `.env` file. Mention that checkout is a simulation and no money is charged.

## 0:00–0:25 — Introduction

“Hi, this is IMovies, a full-stack movie ticket booking application. It is built with React, Node.js, Express, MongoDB, Mongoose, JWT authentication and Socket.IO. Users can browse movies, select seats and manage bookings, while administrators manage the cinema catalogue and showtimes.”

## 0:25–1:00 — Browse movies

Show the home page, now-showing cards, coming-soon cards and the all-movies page. Demonstrate search or a genre/language filter. Open a movie detail page and point out the plot, genre, duration, certification and available cinema showtimes.

## 1:00–1:50 — Select seats and book

Sign in using a dedicated demo user (do not disclose the password in the recording). Choose a cinema/showtime. Show the cinema layout and seat legend. Select a standard seat and a premium seat; explain that prices are loaded from the backend. Open the review page and show the derived total. Confirm the **simulated** booking.

## 1:50–2:25 — Confirmation and booking history

Show the unique booking reference, movie/cinema details, screen, seats, and simulated payment note. Open My Bookings and show the saved booking. If there is time, demonstrate cancellation of a sufficiently distant upcoming showtime and show that seats are released.

## 2:25–3:15 — Admin panel

Sign in as a locally configured demo administrator. Show dashboard counts. Open movie management and explain the create/edit/delete rules. Show cinema and showtime management, then the booking administration list. Do not use a default public password; configure your own local admin credentials before recording.

## 3:15–4:00 — Architecture and reliability

Briefly show `docs/ARCHITECTURE.md` and `docs/ER_DIAGRAM.md`. Explain the React → Express → Mongoose → MongoDB path. Explain JWT cookie authentication, server-side booking price calculation, the conditional atomic seat-claim update, and Socket.IO seat updates. Be clear that the demo checkout is not a real payment gateway.

## 4:00–4:20 — Closing

Summarize the stack, tested booking flow, role-protected admin API, and the GitHub repository. Mention known limitations honestly and provide the actual repository/live demo URLs after they exist.

## Recording checklist

- Seed the database and verify the home page before recording.
- Use a dedicated demo account; avoid showing private credentials.
- Capture screenshots under `docs/screenshots/` from the actual running app.
- Show browser console only if there are no unexplained errors.
- Replace README placeholders with actual GitHub, deployment and video links only after publishing.
