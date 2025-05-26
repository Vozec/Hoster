import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (!this.socket) {
      this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3000', {
        path: '/socket.io',
        transports: ['websocket'],
        autoConnect: true
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToRouteLogs(routeId, callback) {
    if (!this.socket) {
      this.connect();
    }

    const eventName = `route_logs:${routeId}`;
    
    // Remove existing listener if any
    if (this.listeners.has(eventName)) {
      this.socket.off(eventName, this.listeners.get(eventName));
    }

    // Add new listener
    this.socket.on(eventName, callback);
    this.listeners.set(eventName, callback);

    // Join the room for this route
    this.socket.emit('join_route_logs', routeId);
  }

  unsubscribeFromRouteLogs(routeId) {
    if (!this.socket) return;

    const eventName = `route_logs:${routeId}`;
    
    if (this.listeners.has(eventName)) {
      this.socket.off(eventName, this.listeners.get(eventName));
      this.listeners.delete(eventName);
    }

    // Leave the room
    this.socket.emit('leave_route_logs', routeId);
  }
}

export default new SocketService(); 