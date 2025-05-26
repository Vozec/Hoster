/**
 * Socket.IO Service for WebSocket connections management
 * This module uses a singleton pattern to avoid circular dependencies
 */

// Variable to store the Socket.IO instance
let io = null;

/**
 * Initialize Socket.IO with an HTTP server
 * @param {Object} server - HTTP server
 * @returns {Object} - Socket.IO instance
 */
exports.init = (server) => {
  if (!io) {
    const socketIo = require('socket.io');
    io = socketIo(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // Configure Socket.IO events
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

/**
 * Get the Socket.IO instance
 * @returns {Object|null} - Socket.IO instance or null if not initialized
 */
exports.getIO = () => {
  return io;
};

/**
 * Emit a log event for a specific route
 * @param {string} routeId - Route ID
 * @param {Object} log - Log data to emit
 */
exports.emitRouteLog = (routeId, log) => {
  if (io) {
    io.to(`route_logs:${routeId}`).emit(`route_logs:${routeId}`, log);
  }
};
