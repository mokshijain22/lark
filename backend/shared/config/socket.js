const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

// Called once from server.js with the raw http server
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || '*' },
  });

  // Authenticate each socket connection using the same JWT as REST API
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Each user joins a private room keyed by their own id -
    // this is how we target notifications to exactly one person.
    socket.join(`user:${socket.userId}`);

    socket.on('disconnect', () => {
      // no-op for now; presence/online-status updates could hook in here later
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized - call initSocket(server) first');
  return io;
};

// Emit a notification event to one specific user's room.
// Safe to call even if socket.io hasn't been initialized (e.g. in tests) - it just no-ops.
const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
};

module.exports = { initSocket, getIO, emitToUser };
