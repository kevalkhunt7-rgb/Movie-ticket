import express from 'express';
import {
  getAllShows,
  getShow,
  getShowsByMovie,
  createShow,
  updateShow,
  deleteShow,
  checkSeatAvailability,
  triggerCleanup,
  getCleanupStatistics
} from '../Controllers/showController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllShows);
router.get('/movie/:id', getShowsByMovie);
router.get('/:id', getShow);
router.post('/:id/check-seats', checkSeatAvailability);

// Admin routes
router.post('/', protect, admin, createShow);
router.put('/:id', protect, admin, updateShow);
router.delete('/:id', protect, admin, deleteShow);

// Admin cleanup routes
router.post('/cleanup', protect, admin, triggerCleanup);
router.get('/cleanup-stats', protect, admin, getCleanupStatistics);

export default router;
