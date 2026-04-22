import mongoose from 'mongoose';

const showSchema = new mongoose.Schema({
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  showDateTime: {
    type: Date,
    required: true
  },
  showPrice: {
    type: Number,
    required: true,
    min: 0
  },
  theater: {
    name: {
      type: String,
      default: 'Cineplex Downtown'
    },
    screen: {
      type: String,
      default: 'Screen 1'
    },
    address: {
      type: String,
      default: ''
    }
  },
  occupiedSeats: {
    type: Map,
    of: String, // userId who booked the seat
    default: new Map()
  },
  lockedSeats: {
    type: Map,
    of: new mongoose.Schema({
      userId: { type: String, required: true },
      lockedAt: { type: Date, default: Date.now },
      expiresAt: { type: Date, required: true }
    }, { _id: false }),
    default: new Map()
  },
  totalSeats: {
    type: Number,
    default: 80 // 8 rows x 10 seats
  },
  seatLayout: {
    rows: {
      type: Number,
      default: 8
    },
    seatsPerRow: {
      type: Number,
      default: 10
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for querying shows by date
showSchema.index({ showDateTime: 1, movie: 1 });

// Method to check if seats are available
showSchema.methods.areSeatsAvailable = function(seatNumbers) {
  for (const seat of seatNumbers) {
    if (this.occupiedSeats.has(seat)) {
      return false;
    }
  }
  return true;
};

// Method to book seats
showSchema.methods.bookSeats = function(seatNumbers, userId) {
  for (const seat of seatNumbers) {
    this.occupiedSeats.set(seat, userId);
  }
};

// Method to get available seats count
showSchema.methods.getAvailableSeatsCount = function() {
  return this.totalSeats - this.occupiedSeats.size;
};

// Method to check if seat is locked by another user
showSchema.methods.isSeatLockedByOther = function(seatNumber, userId) {
  const lock = this.lockedSeats.get(seatNumber);
  if (!lock) return false;
  // Check if lock has expired
  if (new Date() > new Date(lock.expiresAt)) {
    this.lockedSeats.delete(seatNumber);
    return false;
  }
  return lock.userId !== userId;
};

// Method to lock a seat
showSchema.methods.lockSeat = function(seatNumber, userId, durationMinutes = 5) {
  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
  this.lockedSeats.set(seatNumber, {
    userId,
    lockedAt: new Date(),
    expiresAt
  });
  return expiresAt;
};

// Method to unlock a seat
showSchema.methods.unlockSeat = function(seatNumber, userId) {
  const lock = this.lockedSeats.get(seatNumber);
  if (lock && lock.userId === userId) {
    this.lockedSeats.delete(seatNumber);
    return true;
  }
  return false;
};

// Method to get all locked seats with their status
showSchema.methods.getLockedSeats = function() {
  const locked = {};
  const now = new Date();
  for (const [seatNumber, lock] of this.lockedSeats.entries()) {
    if (now <= new Date(lock.expiresAt)) {
      locked[seatNumber] = lock;
    } else {
      this.lockedSeats.delete(seatNumber);
    }
  }
  return locked;
};

// Method to cleanup expired locks
showSchema.methods.cleanupExpiredLocks = function() {
  const now = new Date();
  let cleaned = 0;
  for (const [seatNumber, lock] of this.lockedSeats.entries()) {
    if (now > new Date(lock.expiresAt)) {
      this.lockedSeats.delete(seatNumber);
      cleaned++;
    }
  }
  return cleaned;
};

const Show = mongoose.model('Show', showSchema);

export default Show;
