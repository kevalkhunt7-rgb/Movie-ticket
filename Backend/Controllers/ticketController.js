import QRCode from 'qrcode';
import Booking from '../Model/Booking.js';
import crypto from 'crypto';

// Generate secure ticket token
const generateTicketToken = (bookingId, userId) => {
  const data = `${bookingId}:${userId}:${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
};

// @desc    Generate QR code for booking
// @route   POST /api/bookings/:bookingId/generate-ticket
// @access  Private
export const generateTicket = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    // Find booking with populated data
    const booking = await Booking.findOne({ bookingId })
      .populate('user', 'name email')
      .populate('show', 'showDateTime theater')
      .populate('movie', 'title poster_path lang runtime');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.user._id.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this ticket'
      });
    }

    // Check if booking is confirmed
    if (booking.bookingStatus !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Cannot generate ticket for ${booking.bookingStatus} booking`
      });
    }

    // Generate secure ticket token
    const ticketToken = generateTicketToken(bookingId, userId);

    // Create ticket data object
    const ticketData = {
      token: ticketToken,
      bookingId: booking.bookingId,
      movie: booking.movie.title,
      theater: booking.show.theater?.name || 'Cineplex Downtown',
      screen: booking.show.theater?.screen || 'Screen 1',
      date: booking.show.showDateTime,
      seats: booking.bookedSeats,
      amount: booking.totalAmount,
      user: booking.user.name,
      status: booking.bookingStatus,
      generatedAt: new Date().toISOString()
    };

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(ticketData), {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });

    // Save QR code to booking
    booking.qrCode = qrCodeDataUrl;
    await booking.save();

    res.status(200).json({
      success: true,
      ticket: {
        ...ticketData,
        qrCode: qrCodeDataUrl,
        moviePoster: booking.movie.poster_path,
        movieLanguage: booking.movie.lang,
        movieRuntime: booking.movie.runtime
      }
    });
  } catch (error) {
    console.error('Generate ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate ticket',
      error: error.message
    });
  }
};

// @desc    Get ticket details
// @route   GET /api/bookings/:bookingId/ticket
// @access  Private
export const getTicket = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    // Find booking with populated data
    const booking = await Booking.findOne({ bookingId })
      .populate('user', 'name email')
      .populate('show', 'showDateTime theater')
      .populate('movie', 'title poster_path lang runtime');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.user._id.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this ticket'
      });
    }

    // Format ticket data
    const ticketData = {
      bookingId: booking.bookingId,
      movie: booking.movie.title,
      moviePoster: booking.movie.poster_path,
      movieLanguage: booking.movie.lang,
      movieRuntime: booking.movie.runtime,
      theater: booking.show.theater?.name || 'Cineplex Downtown',
      screen: booking.show.theater?.screen || 'Screen 1',
      address: booking.show.theater?.address || '',
      date: booking.show.showDateTime,
      seats: booking.bookedSeats,
      amount: booking.totalAmount,
      userName: booking.user.name,
      userEmail: booking.user.email,
      status: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      qrCode: booking.qrCode,
      bookedAt: booking.createdAt
    };

    res.status(200).json({
      success: true,
      ticket: ticketData
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ticket',
      error: error.message
    });
  }
};

// @desc    Verify ticket (for theater entry - future use)
// @route   POST /api/tickets/verify
// @access  Private/Admin
export const verifyTicket = async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'QR data is required'
      });
    }

    // Parse QR data
    let ticketData;
    try {
      ticketData = JSON.parse(qrData);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format'
      });
    }

    // Find booking
    const booking = await Booking.findOne({ bookingId: ticketData.bookingId })
      .populate('user', 'name email')
      .populate('show', 'showDateTime theater')
      .populate('movie', 'title poster_path');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check if booking is valid
    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Ticket has been cancelled',
        ticket: {
          bookingId: booking.bookingId,
          status: booking.bookingStatus
        }
      });
    }

    // Check if show time has passed
    const showTime = new Date(booking.show.showDateTime);
    if (showTime < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Show time has passed',
        ticket: {
          bookingId: booking.bookingId,
          showTime: showTime
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ticket verified successfully',
      ticket: {
        bookingId: booking.bookingId,
        movie: booking.movie.title,
        user: booking.user.name,
        seats: booking.bookedSeats,
        showTime: booking.show.showDateTime,
        theater: booking.show.theater?.name,
        status: booking.bookingStatus,
        valid: true
      }
    });
  } catch (error) {
    console.error('Verify ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify ticket',
      error: error.message
    });
  }
};
