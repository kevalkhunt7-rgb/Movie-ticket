import express from 'express';
import { generateTicket, getTicket, verifyTicket } from '../Controllers/ticketController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Generate ticket QR code
router.post('/:bookingId/generate-ticket', protect, generateTicket);

// Get ticket details
router.get('/:bookingId/ticket', protect, getTicket);

// Verify ticket (admin only - for theater entry)
router.post('/verify', protect, admin, verifyTicket);

export default router;
