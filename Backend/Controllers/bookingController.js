import Booking from '../Model/Booking.js';
import Show from '../Model/Show.js';
import Movie from '../Model/Movie.js';
import User from '../Model/User.js';
import { v4 as uuidv4 } from 'uuid';
import { sendTicketEmail } from '../services/emailService.js';

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req, res) => {
  try {
    const { showId, seats, paymentId } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!showId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide showId and seats array'
      });
    }

    // Find the show
    const show = await Show.findById(showId).populate('movie');
    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    // Check if seats are available
    if (!show.areSeatsAvailable(seats)) {
      return res.status(400).json({
        success: false,
        message: 'Some seats are already booked'
      });
    }

    // Calculate amounts
    const ticketPrice = show.showPrice * seats.length;
    const convenienceFee = 2;
    const totalAmount = ticketPrice + convenienceFee;

    // Generate unique booking ID
    const bookingId = 'BK' + Date.now().toString(36).toUpperCase();

    // Create booking
    const booking = await Booking.create({
      user: userId,
      show: showId,
      movie: show.movie._id,
      bookingId,
      bookedSeats: seats,
      ticketPrice,
      convenienceFee,
      totalAmount,
      paymentStatus: paymentId ? 'completed' : 'pending',
      paymentId: paymentId || '',
      bookingStatus: 'confirmed'
    });

    // Book seats in show
    show.bookSeats(seats, userId.toString());
    
    // Clear locks for these seats
    seats.forEach(seat => {
      show.lockedSeats.delete(seat);
    });
    
    await show.save();

    // Add booking to user's bookings
    await User.findByIdAndUpdate(userId, {
      $push: { bookings: booking._id }
    });

    // Populate booking details
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('show', 'showDateTime theater')
      .populate('movie', 'title poster_path lang runtime');

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`show:${showId}`).emit('seats-booked', {
        seats,
        userId: userId.toString()
      });
    }

    // Send ticket email with PDF attachment
    try {
      console.log('[Booking Controller] Sending ticket email...');
      const emailResult = await sendTicketEmail(populatedBooking);
      if (emailResult.success) {
        console.log('[Booking Controller] Ticket email sent successfully');
      } else {
        console.error('[Booking Controller] Failed to send ticket email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('[Booking Controller] Email sending error:', emailError);
      // Don't fail the booking if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: populatedBooking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user's bookings
// @route   GET /api/bookings/my
// @access  Private
export const getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user._id;

    let query = { user: userId };

    // Filter by status
    if (status) {
      query.bookingStatus = status;
    }

    const bookings = await Booking.find(query)
      .populate('show', 'showDateTime theater')
      .populate('movie', 'title poster_path lang genres runtime')
      .sort({ createdAt: -1 });

    // Categorize bookings
    const now = new Date();
    const upcoming = [];
    const past = [];

    bookings.forEach(booking => {
      const showDate = new Date(booking.show.showDateTime);
      if (showDate > now && booking.bookingStatus !== 'cancelled') {
        upcoming.push(booking);
      } else {
        past.push(booking);
      }
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      upcoming,
      past
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
export const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      $or: [
        { _id: req.params.id },
        { bookingId: req.params.id }
      ]
    })
      .populate('user', 'name email phone')
      .populate('show', 'showDateTime theater seatLayout')
      .populate('movie', 'title poster_path backdrop_path lang genres runtime');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking or is admin
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking is already cancelled
    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // Check if show time has passed
    const show = await Show.findById(booking.show);
    if (new Date(show.showDateTime) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel past bookings'
      });
    }

    // Free up seats
    booking.bookedSeats.forEach(seat => {
      show.occupiedSeats.delete(seat);
    });
    await show.save();

    // Update booking status
    booking.bookingStatus = 'cancelled';
    booking.paymentStatus = 'refunded';
    booking.isRefunded = true;
    booking.refundAmount = booking.totalAmount;
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      refundAmount: booking.refundAmount
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all bookings (Admin only)
// @route   GET /api/bookings
// @access  Private/Admin
export const getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    let query = {};
    if (status) {
      query.bookingStatus = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(query)
      .populate('user', 'name email')
      .populate('show', 'showDateTime theater')
      .populate('movie', 'title poster_path')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    // Calculate stats
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'completed'] }, '$totalAmount', 0] } },
          totalBookings: { $sum: 1 },
          confirmedBookings: { $sum: { $cond: [{ $eq: ['$bookingStatus', 'confirmed'] }, 1, 0] } },
          cancelledBookings: { $sum: { $cond: [{ $eq: ['$bookingStatus', 'cancelled'] }, 1, 0] } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: stats[0] || {},
      bookings
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update payment status
// @route   PUT /api/bookings/:id/payment
// @access  Private
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId, status } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    booking.paymentId = paymentId;
    booking.paymentStatus = status;
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Payment status updated',
      booking
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
