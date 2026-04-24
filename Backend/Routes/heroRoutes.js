import express from 'express';
import {
  getHeroSettings,
  updateHeroSettings,
  getMoviesForSlider
} from '../Controllers/heroController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route
router.get('/', getHeroSettings);

// Admin routes
router.put('/', protect, admin, updateHeroSettings);
router.get('/movies', protect, admin, getMoviesForSlider);

export default router;
