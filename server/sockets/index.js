export function configureSockets(io) {
  io.on('connection', (socket) => {
    socket.on('showtime:join', (showtimeId) => {
      if (typeof showtimeId !== 'string' || !/^[a-f\d]{24}$/i.test(showtimeId)) return;
      socket.join(`showtime:${showtimeId}`);
    });
    socket.on('showtime:leave', (showtimeId) => {
      if (typeof showtimeId === 'string' && /^[a-f\d]{24}$/i.test(showtimeId)) socket.leave(`showtime:${showtimeId}`);
    });
  });
}
