import HeroSettings from '../Model/HeroSettings.js';
import Movie from '../Model/Movie.js';

// @desc    Get hero settings (Public)
// @route   GET /api/hero
// @access  Public
export const getHeroSettings = async (req, res) => {
  try {
    const settings = await HeroSettings.findOne({ isActive: true });

    if (!settings) {
      console.log('[Hero] No settings found, returning defaults');
      // Return default settings if none exist
      return res.status(200).json({
        success: true,
        settings: {
          enableSlider: true,
          autoRotate: true,
          rotationInterval: 6000,
          heroSlides: []
        }
      });
    }

    console.log('[Hero] Settings found:', {
      slidesCount: settings.heroSlides?.length || 0,
      enableSlider: settings.enableSlider
    });

    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get hero settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update hero settings (Admin only)
// @route   PUT /api/hero
// @access  Private/Admin
export const updateHeroSettings = async (req, res) => {
  try {
    console.log('[Hero] Update request received:', {
      slidesCount: req.body.heroSlides?.length || 0,
      enableSlider: req.body.enableSlider
    });

    let settings = await HeroSettings.findOne({ isActive: true });

    if (!settings) {
      // Create new settings if none exist
      console.log('[Hero] Creating new hero settings');
      settings = await HeroSettings.create(req.body);
    } else {
      // Update existing settings
      console.log('[Hero] Updating existing hero settings');
      settings = await HeroSettings.findByIdAndUpdate(
        settings._id,
        req.body,
        { new: true, runValidators: true }
      );
    }

    console.log('[Hero] Settings saved successfully');

    res.status(200).json({
      success: true,
      message: 'Hero settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update hero settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all movies for reference (Admin only)
// @route   GET /api/hero/movies
// @access  Private/Admin
export const getMoviesForSlider = async (req, res) => {
  try {
    const movies = await Movie.find({ isActive: true })
      .select('title poster_path backdrop_path status')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      movies
    });
  } catch (error) {
    console.error('Get movies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
