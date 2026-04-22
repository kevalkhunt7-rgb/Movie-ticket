import express from 'express';
import { createOrder, verifyPayment, getRazorpayKey } from '../Controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to get Razorpay key
router.get('/key', getRazorpayKey);

// Protected routes
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);

export default router;
