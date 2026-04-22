import mongoose from 'mongoose';

const castSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  profile_path: {
    type: String,
    default: ''
  },
  character: {
    type: String,
    default: ''
  }
});

const genreSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  }
});

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  overview: {
    type: String,
    required: true
  },
  poster_path: {
    type: String,
    required: true
  },
  backdrop_path: {
    type: String,
    default: ''
  },
  trailer_url: {
    type: String,
    default: ''
  },
  genres: [genreSchema],
  casts: [castSchema],
  release_date: {
    type: Date,
    required: true
  },
  original_language: {
    type: String,
    default: 'en'
  },
  lang: {
    type: String,
    default: 'English'
  },
  tagline: {
    type: String,
    default: ''
  },
  vote_average: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  vote_count: {
    type: Number,
    default: 0
  },
  runtime: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['now_showing', 'coming_soon', 'ended'],
    default: 'coming_soon'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for search
movieSchema.index({ title: 'text', overview: 'text' });

const Movie = mongoose.model('Movie', movieSchema);

export default Movie;
