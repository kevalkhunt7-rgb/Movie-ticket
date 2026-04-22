import Razorpay from 'razorpay';
import crypto from 'crypto';
import Booking from '../Model/Booking.js';
import Show from '../Model/Show.js';
import User from '../Model/User.js';
import { sendTicketEmail } from '../services/emailService.js';

// Lazy initialization of Razorpay - will be called when needed
let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    console.log('[Razorpay] Initializing with Key ID:', keyId ? 'EXISTS' : 'MISSING');
    
    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured');
    }
    
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  }
  return razorpayInstance;
};

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const { showId, seats, amount } = req.body;
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

    // Check if seats are still available
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

    // Create Razorpay order
    const options = {
      amount: Math.round(totalAmount * 100), // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: userId.toString(),
        showId: showId.toString(),
        seats: seats.join(','),
        movieName: show.movie.title
      }
    };

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: totalAmount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id'
    });
  } catch (error) {
    console.error('Create order error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message,
      details: error.response?.data || 'No additional details'
    });
  }
};

// @desc    Verify Razorpay payment and create booking
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      showId,
      seats
    } = req.body;

    const userId = req.user._id;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'your_key_secret')
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
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

    // Check if seats are still available
    if (!show.areSeatsAvailable(seats)) {
      return res.status(400).json({
        success: false,
        message: 'Some seats were booked by another user'
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
      paymentStatus: 'completed',
      paymentId: razorpay_payment_id,
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
      console.log('[Payment Controller] Sending ticket email...');
      const emailResult = await sendTicketEmail(populatedBooking);
      if (emailResult.success) {
        console.log('[Payment Controller] Ticket email sent successfully');
      } else {
        console.error('[Payment Controller] Failed to send ticket email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('[Payment Controller] Email sending error:', emailError);
      // Don't fail the payment if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and booking created successfully',
      booking: populatedBooking
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};

// @desc    Get Razorpay key
// @route   GET /api/payments/key
// @access  Public
export const getRazorpayKey = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get Razorpay key'
    });
  }
};
