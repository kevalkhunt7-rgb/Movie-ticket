import Show from '../Model/Show.js';

// Store active connections per show
const showRooms = new Map(); // showId -> Set of socket ids
const userSockets = new Map(); // userId -> socket id

// Lock expiration interval (check every 30 seconds)
const LOCK_CHECK_INTERVAL = 30000;
// Default lock duration in minutes
const DEFAULT_LOCK_DURATION = 5;

export const initializeSocketHandlers = (io) => {
  // Cleanup expired locks periodically
  setInterval(async () => {
    await cleanupExpiredLocks(io);
  }, LOCK_CHECK_INTERVAL);

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join a show room
    socket.on('join-show', async ({ showId, userId }) => {
      try {
        if (!showId || !userId) {
          socket.emit('error', { message: 'showId and userId are required' });
          return;
        }

        // Leave any previous show rooms
        socket.rooms.forEach((room) => {
          if (room.startsWith('show:')) {
            socket.leave(room);
          }
        });

        // Join new show room
        const roomName = `show:${showId}`;
        socket.join(roomName);
        socket.userId = userId;
        socket.showId = showId;

        // Track user socket
        userSockets.set(userId, socket.id);

        // Add to show rooms tracking
        if (!showRooms.has(showId)) {
          showRooms.set(showId, new Set());
        }
        showRooms.get(showId).add(socket.id);

        // Get current seat status
        const show = await Show.findById(showId);
        if (show) {
          // Cleanup expired locks first
          show.cleanupExpiredLocks();
          await show.save();

          const lockedSeats = show.getLockedSeats();
          const occupiedSeats = Object.fromEntries(show.occupiedSeats);

          // Send current seat status to the user
          socket.emit('seat-status', {
            lockedSeats,
            occupiedSeats
          });
        }

        console.log(`User ${userId} joined show ${showId}`);
      } catch (error) {
        console.error('Error joining show:', error);
        socket.emit('error', { message: 'Failed to join show' });
      }
    });

    // Lock seats
    socket.on('lock-seats', async ({ showId, seats, userId }) => {
      try {
        if (!showId || !seats || !Array.isArray(seats) || !userId) {
          socket.emit('error', { message: 'Invalid lock request' });
          return;
        }

        const show = await Show.findById(showId);
        if (!show) {
          socket.emit('error', { message: 'Show not found' });
          return;
        }

        // Cleanup expired locks first
        show.cleanupExpiredLocks();

        const lockedSeats = [];
        const failedSeats = [];
        const expiresAtList = {};

        for (const seatNumber of seats) {
          // Check if seat is already booked
          if (show.occupiedSeats.has(seatNumber)) {
            failedSeats.push({ seatNumber, reason: 'already_booked' });
            continue;
          }

          // Check if seat is locked by another user
          if (show.isSeatLockedByOther(seatNumber, userId)) {
            failedSeats.push({ seatNumber, reason: 'locked_by_other' });
            continue;
          }

          // Lock the seat
          const expiresAt = show.lockSeat(seatNumber, userId, DEFAULT_LOCK_DURATION);
          lockedSeats.push(seatNumber);
          expiresAtList[seatNumber] = expiresAt;
        }

        await show.save();

        // Notify the user who locked the seats
        socket.emit('seats-locked', {
          success: true,
          lockedSeats,
          failedSeats,
          expiresAt: expiresAtList,
          lockDuration: DEFAULT_LOCK_DURATION
        });

        // Broadcast to all other users in the same show
        socket.to(`show:${showId}`).emit('seats-locked-by-other', {
          seats: lockedSeats,
          expiresAt: expiresAtList
        });

        console.log(`User ${userId} locked seats: ${lockedSeats.join(', ')}`);
      } catch (error) {
        console.error('Error locking seats:', error);
        socket.emit('error', { message: 'Failed to lock seats' });
      }
    });

    // Unlock seats
    socket.on('unlock-seats', async ({ showId, seats, userId }) => {
      try {
        if (!showId || !seats || !Array.isArray(seats) || !userId) {
          socket.emit('error', { message: 'Invalid unlock request' });
          return;
        }

        const show = await Show.findById(showId);
        if (!show) {
          socket.emit('error', { message: 'Show not found' });
          return;
        }

        const unlockedSeats = [];

        for (const seatNumber of seats) {
          if (show.unlockSeat(seatNumber, userId)) {
            unlockedSeats.push(seatNumber);
          }
        }

        if (unlockedSeats.length > 0) {
          await show.save();

          // Notify the user
          socket.emit('seats-unlocked', {
            success: true,
            unlockedSeats
          });

          // Broadcast to all other users in the same show
          socket.to(`show:${showId}`).emit('seats-unlocked-by-other', {
            seats: unlockedSeats
          });

          console.log(`User ${userId} unlocked seats: ${unlockedSeats.join(', ')}`);
        }
      } catch (error) {
        console.error('Error unlocking seats:', error);
        socket.emit('error', { message: 'Failed to unlock seats' });
      }
    });

    // Handle booking completion
    socket.on('booking-completed', async ({ showId, seats, userId }) => {
      try {
        const show = await Show.findById(showId);
        if (!show) return;

        // Book the seats (move from locked to occupied)
        for (const seatNumber of seats) {
          show.lockedSeats.delete(seatNumber);
          show.occupiedSeats.set(seatNumber, userId);
        }

        await show.save();

        // Broadcast to all users in the show
        io.to(`show:${showId}`).emit('seats-booked', {
          seats,
          userId
        });

        console.log(`Seats booked by ${userId}: ${seats.join(', ')}`);
      } catch (error) {
        console.error('Error completing booking:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);

      const { userId, showId } = socket;

      if (userId && showId) {
        // Remove from tracking
        userSockets.delete(userId);
        
        const roomSockets = showRooms.get(showId);
        if (roomSockets) {
          roomSockets.delete(socket.id);
          if (roomSockets.size === 0) {
            showRooms.delete(showId);
          }
        }

        // Auto-release locks after a short delay (in case user reconnects)
        setTimeout(async () => {
          // Check if user reconnected
          if (userSockets.has(userId)) {
            return; // User reconnected, don't release locks
          }

          try {
            const show = await Show.findById(showId);
            if (!show) return;

            const unlockedSeats = [];

            // Find and release all locks by this user
            for (const [seatNumber, lock] of show.lockedSeats.entries()) {
              if (lock.userId === userId) {
                show.lockedSeats.delete(seatNumber);
                unlockedSeats.push(seatNumber);
              }
            }

            if (unlockedSeats.length > 0) {
              await show.save();

              // Broadcast to remaining users
              io.to(`show:${showId}`).emit('seats-unlocked-by-other', {
                seats: unlockedSeats,
                reason: 'user_disconnected'
              });

              console.log(`Auto-released seats for disconnected user ${userId}: ${unlockedSeats.join(', ')}`);
            }
          } catch (error) {
            console.error('Error auto-releasing seats:', error);
          }
        }, 10000); // 10 second grace period
      }
    });
  });
};

// Cleanup expired locks across all shows
async function cleanupExpiredLocks(io) {
  try {
    const shows = await Show.find({ 'lockedSeats.0': { $exists: true } });
    
    for (const show of shows) {
      const cleaned = show.cleanupExpiredLocks();
      
      if (cleaned > 0) {
        await show.save();
        
        // Get remaining locked seats
        const lockedSeats = show.getLockedSeats();
        
        // Notify all users in the show
        io.to(`show:${show._id}`).emit('seat-status', {
          lockedSeats,
          occupiedSeats: Object.fromEntries(show.occupiedSeats)
        });
        
        console.log(`Cleaned ${cleaned} expired locks for show ${show._id}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up expired locks:', error);
  }
}

export { showRooms, userSockets };
