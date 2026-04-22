import express from 'express';
import {
  clerkAuth,
  getMe,
  updateProfile,
  getAllUsers,
  forgotPassword,
  verifyOTP,
  resetPassword
} from '../Controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/clerk', clerkAuth);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Admin routes
router.get('/users', protect, admin, getAllUsers);

export default router;
