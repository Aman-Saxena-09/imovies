# Deployment Notes

This project is designed to run locally first. Deploy the frontend and backend separately and use MongoDB Atlas or another secured MongoDB deployment for the database.

## 1. Prepare MongoDB

1. Create a MongoDB Atlas cluster and database user.
2. Restrict network access to your hosting provider's outbound IPs where practical; avoid leaving an unrestricted network rule in place long term.
3. Copy the connection string into the backend environment as `MONGODB_URI`. URL-encode special characters in the database username/password.
4. Run the seed script from a machine or one-off job whose `MONGODB_URI` points to the intended deployment database. Check sample data before using the app publicly.

## 2. Deploy the Express backend

The backend can be deployed to a Node-compatible host such as Render or Railway. Configure the service root as `server/` if your host supports a service root, or configure the build/start commands from the repository root.

- Install command from repo root: `npm run install:all`.
- Start command from the `server/` directory: `npm start`.
- Set environment variables: `NODE_ENV=production`, `PORT` (if required by the host), `MONGODB_URI`, `JWT_SECRET` (long, random, and private), `JWT_EXPIRES_IN=1d`, `CLIENT_URL=https://YOUR_FRONTEND_HOST`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` if the seed task needs to create the admin.
- Run `npm run seed` from the repository root once the database URI and admin credentials are correctly configured, or run `npm run seed` from `server/` using the host's one-off command facility.
- Verify `https://YOUR_BACKEND_HOST/api/health` returns JSON.

Do not expose `JWT_SECRET`, `MONGODB_URI`, or admin credentials in client variables or GitHub.

## 3. Deploy the React frontend

The Vite frontend can be deployed to Vercel, Netlify, or another static host.

- Build command from repository root: `npm run build`.
- Output directory: `client/dist`.
- Set `VITE_API_URL=https://YOUR_BACKEND_HOST/api`.
- Set `VITE_SOCKET_URL=https://YOUR_BACKEND_HOST`.
- If the hosting UI builds inside `client/`, use `npm run build` and output `dist` instead.
- `client/public/_redirects` includes a Netlify SPA rewrite so refreshing a client-side route serves `index.html`.

## 4. Cross-origin cookies and CORS

The frontend sends the HTTP-only auth cookie with Axios `withCredentials: true`. `CLIENT_URL` must contain the exact deployed frontend origin, with no path and no wildcard when credentials are enabled. Keep the frontend and API on the same site where practical (for example, separate subdomains of a domain you control) so `SameSite=Lax` can work with HTTPS cookies. `COOKIE_SAME_SITE` is configurable; only use `none` with `Secure` over HTTPS and after adding/validating a suitable CSRF protection strategy. Do not loosen cookie policy casually.

## 5. Verify before sharing publicly

- Build the client and run the test suite.
- Check login/logout and cookie behavior in the deployed browser.
- Verify registration, admin restrictions, seat conflicts, cancellation, and Socket.IO reconnects with two browser sessions.
- Ensure the database contains only demo/public content and no private user data.
- Rotate any secret that was accidentally exposed.
- Add a live URL or video URL to the README only after the app is actually deployed or recorded.

**Important:** no deployment has been performed by this repository generation step. These are deployment instructions, not a claim that a live service exists.
