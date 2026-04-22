import cron from 'node-cron';
import Show from '../Model/Show.js';
import Booking from '../Model/Booking.js';

/**
 * Show Cleanup Service
 * Automatically removes shows that have passed their date and time
 */

// Clean up past shows
export const cleanupPastShows = async () => {
  try {
    const now = new Date();
    
    console.log('[Show Cleanup] Starting cleanup of past shows...');
    
    // Find all active shows that have passed
    const pastShows = await Show.find({
      showDateTime: { $lt: now },
      isActive: true
    });

    if (pastShows.length === 0) {
      console.log('[Show Cleanup] No past shows found');
      return { deleted: 0, message: 'No past shows to delete' };
    }

    console.log(`[Show Cleanup] Found ${pastShows.length} past shows`);

    let deletedCount = 0;
    let skippedCount = 0;

    for (const show of pastShows) {
      try {
        // Check if there are any bookings for this show
        const bookingsCount = await Booking.countDocuments({
          show: show._id,
          bookingStatus: { $in: ['confirmed', 'completed'] }
        });

        if (bookingsCount > 0) {
          // Don't delete shows with active bookings, just deactivate them
          show.isActive = false;
          await show.save();
          skippedCount++;
          console.log(`[Show Cleanup] Deactivated show ${show._id} (has ${bookingsCount} bookings)`);
        } else {
          // Safe to delete shows without bookings
          await Show.findByIdAndDelete(show._id);
          deletedCount++;
          console.log(`[Show Cleanup] Deleted show ${show._id} (no bookings)`);
        }
      } catch (error) {
        console.error(`[Show Cleanup] Error processing show ${show._id}:`, error.message);
      }
    }

    const result = {
      deleted: deletedCount,
      deactivated: skippedCount,
      total: pastShows.length,
      message: `Cleaned up ${pastShows.length} past shows (${deletedCount} deleted, ${skippedCount} deactivated)`
    };

    console.log(`[Show Cleanup] ${result.message}`);
    return result;
  } catch (error) {
    console.error('[Show Cleanup] Error during cleanup:', error);
    throw error;
  }
};

// Clean up expired seat locks
export const cleanupExpiredLocks = async () => {
  try {
    console.log('[Show Cleanup] Cleaning up expired seat locks...');
    
    const shows = await Show.find({ isActive: true });
    let totalCleaned = 0;

    for (const show of shows) {
      const cleaned = show.cleanupExpiredLocks();
      if (cleaned > 0) {
        await show.save();
        totalCleaned += cleaned;
      }
    }

    console.log(`[Show Cleanup] Cleaned ${totalCleaned} expired locks`);
    return { cleaned: totalCleaned };
  } catch (error) {
    console.error('[Show Cleanup] Error cleaning locks:', error);
    throw error;
  }
};

// Initialize cron jobs
export const initializeShowCleanup = () => {
  console.log('[Show Cleanup] Initializing automated cleanup jobs...');

  // Run past shows cleanup every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('[Show Cleanup] Running scheduled cleanup (every hour)');
    try {
      await cleanupPastShows();
    } catch (error) {
      console.error('[Show Cleanup] Scheduled cleanup failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata' // Adjust to your timezone
  });

  // Run expired locks cleanup every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await cleanupExpiredLocks();
    } catch (error) {
      console.error('[Show Cleanup] Lock cleanup failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });

  // Run comprehensive cleanup daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[Show Cleanup] Running daily comprehensive cleanup');
    try {
      const result = await cleanupPastShows();
      console.log('[Show Cleanup] Daily cleanup complete:', result);
    } catch (error) {
      console.error('[Show Cleanup] Daily cleanup failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });

  console.log('[Show Cleanup] Cron jobs initialized successfully');
  console.log('[Show Cleanup] Schedule:');
  console.log('  - Past shows cleanup: Every hour');
  console.log('  - Expired locks cleanup: Every 5 minutes');
  console.log('  - Comprehensive cleanup: Daily at 2:00 AM');
};

// Get cleanup statistics
export const getCleanupStats = async () => {
  try {
    const now = new Date();
    
    const totalShows = await Show.countDocuments();
    const activeShows = await Show.countDocuments({ isActive: true });
    const pastShows = await Show.countDocuments({
      showDateTime: { $lt: now },
      isActive: true
    });
    const upcomingShows = await Show.countDocuments({
      showDateTime: { $gte: now },
      isActive: true
    });

    return {
      totalShows,
      activeShows,
      pastShows,
      upcomingShows,
      nextCleanup: 'Next scheduled cleanup will run at the top of the next hour'
    };
  } catch (error) {
    console.error('[Show Cleanup] Error getting stats:', error);
    throw error;
  }
};

export default {
  cleanupPastShows,
  cleanupExpiredLocks,
  initializeShowCleanup,
  getCleanupStats
};
