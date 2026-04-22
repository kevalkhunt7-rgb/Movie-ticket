import express from 'express';
import {
  getAllMovies,
  getMovie,
  createMovie,
  updateMovie,
  deleteMovie,
  toggleFavorite,
  getMyFavorites
} from '../Controllers/movieController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllMovies);
router.get('/:id', getMovie);

// Protected routes
router.get('/favorites/my', protect, getMyFavorites);
router.post('/:id/favorite', protect, toggleFavorite);

// Admin routes
router.post('/', protect, admin, createMovie);
router.put('/:id', protect, admin, updateMovie);
router.delete('/:id', protect, admin, deleteMovie);

export default router;
