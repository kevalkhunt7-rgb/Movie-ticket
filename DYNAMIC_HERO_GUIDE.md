# Dynamic Hero Section & Movie Slider Guide 🎬

## Overview
The hero section is now fully dynamic! Admins can customize the homepage hero section and movie slider through the admin panel.

## Features Implemented

### 1. **Dynamic Hero Section** ✅
- Admin can change hero background image
- Customizable title, description, genres, year, duration
- Custom button text and link
- Optional logo display
- Auto-rotation with configurable interval

### 2. **Movie Slider** ✅
- Add multiple movies to hero slider
- Reorder movies with drag controls
- Auto-rotate between movies (configurable)
- Manual navigation with arrows
- Visual slide indicators

### 3. **Movie Details Page Slider** ✅
- Cast carousel with navigation
- Related movies slider
- Smooth transitions
- Responsive design

## Backend Structure

### Model: `HeroSettings.js`
```javascript
{
  backgroundImage: String,
  logo: String,
  title: String,
  subtitle: String,
  description: String,
  genres: String,
  releaseYear: String,
  duration: String,
  buttonText: String,
  buttonLink: String,
  enableSlider: Boolean,
  sliderMovies: [{ movie: ObjectId, order: Number }],
  autoRotate: Boolean,
  rotationInterval: Number
}
```

### API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/hero` | Public | Get hero settings |
| PUT | `/api/hero` | Admin | Update hero settings |
| GET | `/api/hero/movies` | Admin | Get movies for slider |

## Frontend Usage

### For Users (Public)
The hero section automatically fetches and displays:
- Current slide from admin-configured slider movies
- Fallback to default settings if no slider movies
- Auto-rotation if enabled
- Manual navigation controls

### For Admins

#### Access Hero Settings
1. Login as admin
2. Navigate to **Admin Dashboard**
3. Click on **"Hero Settings"** in the sidebar
4. URL: `/admin/hero-settings`

#### Configure Hero Section

**Basic Settings:**
- **Background Image URL**: Upload image and paste URL
- **Logo URL**: Optional brand logo
- **Title**: Main heading text
- **Description**: Subtitle/description text
- **Genres**: Display genres (e.g., "Action | Adventure")
- **Release Year**: Movie year
- **Duration**: Movie runtime (e.g., "2h 30m")

**Button Settings:**
- **Button Text**: CTA button label
- **Button Link**: Button destination URL

**Movie Slider Settings:**
1. ✅ Enable Movie Slider - Toggle slider on/off
2. ✅ Auto Rotate - Automatic slide transition
3. **Rotation Interval**: Time between slides (2-10 seconds)
4. **Add Movie to Slider**: Select from dropdown
5. **Reorder Movies**: Use up/down arrows
6. **Remove Movies**: Click X button

#### Steps to Add Movies to Slider:
1. Scroll to "Movie Slider Settings"
2. Select a movie from dropdown
3. Movie appears in the list
4. Use ↑ ↓ arrows to reorder
5. Click Save to apply changes

## How It Works

### Hero Section Flow
```
1. Page loads → Fetches /api/hero
2. If slider movies exist:
   - Display first movie's backdrop as background
   - Show movie title, description, genres
   - Start auto-rotation timer
3. User can manually navigate with arrows
4. Auto-rotation cycles through all slider movies
```

### Data Priority
```
Background Image:
  1. Current slider movie backdrop_path
  2. Admin configured backgroundImage
  3. Default: /backgroundImage.png

Title:
  1. Current slider movie title
  2. Admin configured title
  3. Default: "Movie Title"
```

## Movie Details Page

### Cast Slider
- Horizontal carousel of cast members
- Navigation buttons appear if > 5 cast members
- Smooth slide transitions
- Fixed width cards (96px each)

### Related Movies Slider
- Grid layout (4 columns)
- Slides by full page (4 movies at a time)
- Navigation controls when > 4 movies
- Responsive grid

## Customization Examples

### Example 1: Single Movie Hero
```
- Enable Slider: ❌ OFF
- Set background image manually
- Configure title, description, etc.
- Result: Static hero section
```

### Example 2: Multi-Movie Slider
```
- Enable Slider: ✅ ON
- Auto Rotate: ✅ ON
- Rotation Interval: 5000 (5 seconds)
- Add 3-5 movies to slider
- Result: Auto-rotating hero with navigation
```

### Example 3: Featured Movie Campaign
```
- Add specific movie to slider (order: 0)
- Set custom backdrop image
- Configure promotional button text
- Result: Featured movie promotion
```

## Technical Details

### Auto-Rotation Logic
```javascript
useEffect(() => {
  if (!sliderMovies || !autoRotate) return
  
  const interval = setInterval(() => {
    setCurrentSlide((prev) => (prev + 1) % sliderMovies.length)
  }, rotationInterval)
  
  return () => clearInterval(interval)
}, [heroData])
```

### Slide Navigation
```javascript
const nextSlide = () => {
  setCurrentSlide((prev) => (prev + 1) % sliderMovies.length)
}

const prevSlide = () => {
  setCurrentSlide((prev) => 
    (prev - 1 + sliderMovies.length) % sliderMovies.length
  )
}
```

## Files Modified

### Backend
- ✅ `Backend/Model/HeroSettings.js` - New model
- ✅ `Backend/Controllers/heroController.js` - New controller
- ✅ `Backend/Routes/heroRoutes.js` - New routes
- ✅ `Backend/Server.js` - Registered hero routes

### Frontend
- ✅ `frontend/src/services/api.js` - Added heroAPI
- ✅ `frontend/src/Component/HeroSection.jsx` - Dynamic hero with slider
- ✅ `frontend/src/pages/MovieDetails.jsx` - Cast & movies slider
- ✅ `frontend/src/admin/AdminHeroSettings.jsx` - Admin UI
- ✅ `frontend/src/admin/AdminLayout.jsx` - Added menu item
- ✅ `frontend/src/App.jsx` - Added route

## Testing Checklist

### Admin Testing
- [ ] Login as admin
- [ ] Navigate to Hero Settings
- [ ] Update background image
- [ ] Change title and description
- [ ] Add movies to slider
- [ ] Reorder movies
- [ ] Enable/disable auto-rotation
- [ ] Change rotation interval
- [ ] Save settings
- [ ] Verify changes on homepage

### User Testing
- [ ] Visit homepage
- [ ] Verify hero section displays correctly
- [ ] Test manual navigation (arrows)
- [ ] Test slide indicators
- [ ] Verify auto-rotation works
- [ ] Click CTA button
- [ ] Test on mobile devices
- [ ] Check movie details page sliders

## Troubleshooting

### Hero section not updating?
1. Check browser console for errors
2. Verify admin saved settings (check network tab)
3. Clear browser cache
4. Verify API endpoint is accessible

### Slider not rotating?
1. Check `enableSlider` is true
2. Check `autoRotate` is true
3. Verify `sliderMovies` array has items
4. Check `rotationInterval` value (2000-10000ms)

### Movies not appearing in dropdown?
1. Verify movies exist in database
2. Check `isActive: true` on movies
3. Verify `/api/hero/movies` endpoint returns data

### Images not loading?
1. Verify image URLs are accessible
2. Check for CORS issues
3. Use full URLs (https://...) or relative paths (/...)
4. Verify image format is supported (jpg, png, webp)

## Future Enhancements

### Potential Features
- [ ] Image upload directly from admin panel
- [ ] Preview before saving
- [ ] A/B testing for hero variants
- [ ] Scheduled hero changes
- [ ] Analytics on hero clicks
- [ ] Multiple hero templates
- [ ] Video background support
- [ ] Parallax effects

## Database Schema

### HeroSettings Collection
```javascript
{
  _id: ObjectId,
  backgroundImage: "/backgroundImage.png",
  logo: "",
  title: "Guardians of the Galaxy",
  subtitle: "",
  description: "Movie description...",
  genres: "Action | Adventure | Sci-Fi",
  releaseYear: "2018",
  duration: "2h 8m",
  buttonText: "Explore Movies",
  buttonLink: "/movies",
  enableSlider: true,
  autoRotate: true,
  rotationInterval: 5000,
  sliderMovies: [
    { movie: ObjectId("..."), order: 0 },
    { movie: ObjectId("..."), order: 1 }
  ],
  isActive: true,
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

## Performance Considerations

- Hero settings are fetched on page load
- Consider implementing caching (localStorage/sessionStorage)
- Auto-rotation uses setInterval (cleaned up on unmount)
- Images should be optimized for web
- Use CDN for faster image delivery

## Security Notes

- Only admins can update hero settings
- Public can only read hero settings
- Input validation on backend
- URL sanitization for image paths
- Rate limiting on API endpoints (if needed)

---

**Need Help?** Check the admin panel or contact support for assistance! 🚀
