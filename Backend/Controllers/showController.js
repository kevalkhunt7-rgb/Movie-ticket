import Show from '../Model/Show.js';
import Movie from '../Model/Movie.js';
import { cleanupPastShows, getCleanupStats } from '../services/showCleanupService.js';

// @desc    Get all shows
// @route   GET /api/shows
// @access  Public
export const getAllShows = async (req, res) => {
  try {
    const { movie, date, page = 1, limit = 20 } = req.query;

    let query = { isActive: true };

    // Filter by movie
    if (movie) {
      query.movie = movie;
    }

    // Filter by date
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.showDateTime = { $gte: startDate, $lte: endDate };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const shows = await Show.find(query)
      .populate('movie', 'title poster_path backdrop_path runtime lang genres')
      .sort({ showDateTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Show.countDocuments(query);

    res.status(200).json({
      success: true,
      count: shows.length,
      total,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      },
      shows
    });
  } catch (error) {
    console.error('Get all shows error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single show
// @route   GET /api/shows/:id
// @access  Public
export const getShow = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('movie');

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    // Convert occupiedSeats Map to object for easier frontend handling
    const occupiedSeatsObj = {};
    show.occupiedSeats.forEach((value, key) => {
      occupiedSeatsObj[key] = value;
    });

    res.status(200).json({
      success: true,
      show: {
        ...show.toObject(),
        occupiedSeats: occupiedSeatsObj
      }
    });
  } catch (error) {
    console.error('Get show error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get shows by movie ID
// @route   GET /api/shows/movie/:movieId
// @access  Public
export const getShowsByMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    // Check if movie exists
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    let query = { movie: id, isActive: true };

    // Filter by date if provided
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.showDateTime = { $gte: startDate, $lte: endDate };
    } else {
      // Default: get shows from today onwards
      query.showDateTime = { $gte: new Date() };
    }

    const shows = await Show.find(query)
      .populate('movie', 'title poster_path runtime lang')
      .sort({ showDateTime: 1 });

    // Group shows by date
    const showsByDate = {};
    shows.forEach(show => {
      const dateKey = show.showDateTime.toISOString().split('T')[0];
      if (!showsByDate[dateKey]) {
        showsByDate[dateKey] = [];
      }
      showsByDate[dateKey].push({
        _id: show._id,
        time: show.showDateTime,
        showPrice: show.showPrice,
        availableSeats: show.getAvailableSeatsCount()
      });
    });

    res.status(200).json({
      success: true,
      movie: {
        _id: movie._id,
        title: movie.title,
        poster_path: movie.poster_path,
        runtime: movie.runtime,
        lang: movie.lang
      },
      showsByDate
    });
  } catch (error) {
    console.error('Get shows by movie error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new show (Admin only)
// @route   POST /api/shows
// @access  Private/Admin
export const createShow = async (req, res) => {
  try {
    const { movie, showDateTime, showPrice, theater } = req.body;

    // Check if movie exists
    const movieExists = await Movie.findById(movie);
    if (!movieExists) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    const show = await Show.create({
      movie,
      showDateTime,
      showPrice,
      theater
    });

    const populatedShow = await Show.findById(show._id)
      .populate('movie', 'title poster_path');

    res.status(201).json({
      success: true,
      message: 'Show created successfully',
      show: populatedShow
    });
  } catch (error) {
    console.error('Create show error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update show (Admin only)
// @route   PUT /api/shows/:id
// @access  Private/Admin
export const updateShow = async (req, res) => {
  try {
    let show = await Show.findById(req.params.id);

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    show = await Show.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('movie', 'title poster_path');

    res.status(200).json({
      success: true,
      message: 'Show updated successfully',
      show
    });
  } catch (error) {
    console.error('Update show error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete show (Admin only)
// @route   DELETE /api/shows/:id
// @access  Private/Admin
export const deleteShow = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    // Soft delete
    show.isActive = false;
    await show.save();

    res.status(200).json({
      success: true,
      message: 'Show deleted successfully'
    });
  } catch (error) {
    console.error('Delete show error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Check seat availability
// @route   POST /api/shows/:id/check-seats
// @access  Public
export const checkSeatAvailability = async (req, res) => {
  try {
    const { seats } = req.body;
    const show = await Show.findById(req.params.id);

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    const available = show.areSeatsAvailable(seats);

    res.status(200).json({
      success: true,
      available,
      message: available ? 'Seats are available' : 'Some seats are already booked'
    });
  } catch (error) {
    console.error('Check seats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Manually trigger cleanup of past shows (Admin only)
// @route   POST /api/shows/cleanup
// @access  Private/Admin
export const triggerCleanup = async (req, res) => {
  try {
    console.log('[Show Controller] Manual cleanup triggered by admin');
    
    const result = await cleanupPastShows();
    
    res.status(200).json({
      success: true,
      message: 'Cleanup completed successfully',
      data: result
    });
  } catch (error) {
    console.error('[Show Controller] Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup past shows',
      error: error.message
    });
  }
};

// @desc    Get cleanup statistics (Admin only)
// @route   GET /api/shows/cleanup-stats
// @access  Private/Admin
export const getCleanupStatistics = async (req, res) => {
  try {
    const stats = await getCleanupStats();
    
    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('[Show Controller] Error getting cleanup stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cleanup statistics',
      error: error.message
    });
  }
};
