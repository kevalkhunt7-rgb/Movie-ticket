import mongoose from 'mongoose';

const heroSettingsSchema = new mongoose.Schema({
  // Hero Section Settings
  backgroundImage: {
    type: String,
    required: true,
    default: '/backgroundImage.png'
  },
  logo: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    required: true,
    default: 'Guardians of the Galaxy'
  },
  subtitle: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: 'Guardians of the Galaxy follows a group of unlikely space outlaws led by Peter Quill who team up to stop a powerful villain threatening the galaxy.'
  },
  genres: {
    type: String,
    default: 'Action | Adventure | Sci-Fi'
  },
  releaseYear: {
    type: String,
    default: '2018'
  },
  duration: {
    type: String,
    default: '2h 8m'
  },
  
  // Featured Movie (linked to movie database)
  featuredMovie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    default: null
  },
  
  // Button Settings
  buttonText: {
    type: String,
    default: 'Explore Movies'
  },
  buttonLink: {
    type: String,
    default: '/movies'
  },
  
  // Slider Settings - Custom Hero Slides
  enableSlider: {
    type: Boolean,
    default: true
  },
  heroSlides: [{
    // Custom slide data (not linked to movies)
    title: {
      type: String,
      required: true
    },
    subtitle: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      required: true
    },
    backgroundImage: {
      type: String,
      required: true
    },
    posterImage: {
      type: String,
      default: ''
    },
    genres: {
      type: String,
      default: ''
    },
    releaseYear: {
      type: String,
      default: ''
    },
    duration: {
      type: String,
      default: ''
    },
    rating: {
      type: String,
      default: ''
    },
    buttonText: {
      type: String,
      default: 'Buy Tickets'
    },
    buttonLink: {
      type: String,
      default: '/movies'
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Display Settings
  isActive: {
    type: Boolean,
    default: true
  },
  autoRotate: {
    type: Boolean,
    default: true
  },
  rotationInterval: {
    type: Number,
    default: 5000 // 5 seconds
  }
}, {
  timestamps: true
});

const HeroSettings = mongoose.model('HeroSettings', heroSettingsSchema);

export default HeroSettings;
