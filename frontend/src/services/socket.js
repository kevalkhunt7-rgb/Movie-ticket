import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        withCredentials: true
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket.id);
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
      this.listeners.clear();
    }
  }

  joinShow(showId, userId) {
    if (this.socket) {
      this.socket.emit('join-show', { showId, userId });
    }
  }

  lockSeats(showId, seats, userId) {
    if (this.socket) {
      this.socket.emit('lock-seats', { showId, seats, userId });
    }
  }

  unlockSeats(showId, seats, userId) {
    if (this.socket) {
      this.socket.emit('unlock-seats', { showId, seats, userId });
    }
  }

  bookingCompleted(showId, seats, userId) {
    if (this.socket) {
      this.socket.emit('booking-completed', { showId, seats, userId });
    }
  }

  // Event listeners
  onSeatStatus(callback) {
    this.addListener('seat-status', callback);
  }

  onSeatsLocked(callback) {
    this.addListener('seats-locked', callback);
  }

  onSeatsLockedByOther(callback) {
    this.addListener('seats-locked-by-other', callback);
  }

  onSeatsUnlocked(callback) {
    this.addListener('seats-unlocked', callback);
  }

  onSeatsUnlockedByOther(callback) {
    this.addListener('seats-unlocked-by-other', callback);
  }

  onSeatsBooked(callback) {
    this.addListener('seats-booked', callback);
  }

  onError(callback) {
    this.addListener('error', callback);
  }

  addListener(event, callback) {
    if (this.socket) {
      // Remove existing listener for this event/callback pair
      this.socket.off(event, callback);
      this.socket.on(event, callback);
      this.listeners.set(`${event}_${callback.name}`, callback);
    }
  }

  removeListener(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      this.listeners.delete(`${event}_${callback.name}`);
    }
  }

  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
    }
  }
}

export const socketService = new SocketService();
export default socketService;
