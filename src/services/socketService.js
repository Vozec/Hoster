let io = null;

exports.init = (server) => {
  if (!io) {
    const socketIo = require('socket.io');
    io = socketIo(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      console.log('New Socket.IO connection:', socket.id);

      socket.on('join_route_logs', (routeId) => {
        console.log(`Client ${socket.id} joined the logs room for route ${routeId}`);
        socket.join(`route_logs:${routeId}`);
      });

      socket.on('leave_route_logs', (routeId) => {
        console.log(`Client ${socket.id} left the logs room for route ${routeId}`);
        socket.leave(`route_logs:${routeId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  return io;
};

exports.getIO = () => {
  return io;
};

exports.emitRouteLog = (routeId, log) => {
  if (io) {
    io.to(`route_logs:${routeId}`).emit(`route_logs:${routeId}`, log);
  }
};
