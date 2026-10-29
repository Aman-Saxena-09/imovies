import 'dotenv/config';
import http from 'node:http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDB } from './config/db.js';
import { configureSockets } from './sockets/index.js';

const PORT = Number(process.env.PORT) || 5000;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim()), credentials: true }, connectionStateRecovery: {} });
configureSockets(io); app.set('io', io);

async function start() {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be configured and at least 32 characters long.');
    await connectDB();
    server.listen(PORT, () => console.log(`IMovies API listening on http://localhost:${PORT}`));
  } catch (error) { console.error(`Startup failed: ${error.message}`); process.exit(1); }
}
async function shutdown(signal) {
  console.log(`${signal} received. Closing IMovies server...`);
  server.close(async () => { io.close(); await mongoose.disconnect().catch(() => {}); process.exit(0); });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT')); process.on('SIGTERM', () => shutdown('SIGTERM'));
start();
