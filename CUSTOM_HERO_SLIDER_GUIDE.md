# Custom Hero Slider Guide 🎬✨

## Overview
Admins can now create **fully customizable hero slides** with their own images, text, and links. No need to link to existing movies - create completely custom promotional slides!

---

## ✨ What's New

### Before:
- ❌ Could only select existing movies from database
- ❌ Limited to movie data (title, poster, description)
- ❌ No custom text or images

### Now:
- ✅ Create completely custom slides
- ✅ Add your own background images
- ✅ Add your own poster images
- ✅ Write custom titles, descriptions
- ✅ Set custom button text and links
- ✅ Add custom ratings, genres, year, duration
- ✅ Full control over every element

---

## 🎯 How It Works

### For Admins:

1. **Navigate to Admin Panel**
   - Login as admin
   - Click "Hero Settings" in sidebar

2. **Create New Slide**
   - Click "Add New Slide" button
   - Fill in the form:
     - **Background Image URL*** (required)
     - **Poster Image URL** (optional)
     - **Title*** (required)
     - **Description*** (required)
     - **Subtitle** (optional)
     - **Genres** (e.g., "Action · Adventure")
     - **Year** (e.g., "2024")
     - **Duration** (e.g., "2h 30m")
     - **Rating** (e.g., "8.5/10")
     - **Button Text** (e.g., "Buy Tickets")
     - **Button Link** (e.g., "/movies" or "/movies/123")

3. **Manage Slides**
   - **Edit**: Click "Edit" button on any slide
   - **Reorder**: Use ↑ ↓ arrows
   - **Remove**: Click × button
   - **Preview**: See thumbnail in admin panel

4. **Save All Changes**
   - Click "Save All Slides"
   - Visit homepage to see your slider!

### For Users:

1. **View Hero Slider**
   - Homepage shows custom slides automatically
   - Beautiful poster + details layout

2. **Navigate**
   - Click arrows or thumbnails
   - Auto-rotation (if enabled)
   - Keyboard navigation (← →)

3. **Take Action**
   - Click custom button
   - Goes to configured link

---

## 📝 Example Use Cases

### Example 1: Promote New Release
```
Background: https://example.com/movie-backdrop.jpg
Poster: https://example.com/movie-poster.jpg
Title: "Avatar: The Way of Water"
Description: "Return to Pandora in this epic sequel..."
Genres: "Sci-Fi · Adventure · Fantasy"
Year: "2024"
Duration: "3h 12m"
Rating: "8.5/10"
Button: "Buy Tickets Now"
Link: "/movies/avatar-2"
```

### Example 2: Special Event
```
Background: https://example.com/event-bg.jpg
Poster: (leave empty)
Title: "Marvel Marathon Night"
Description: "Watch all Marvel movies in one night!"
Genres: "Special Event"
Year: "2024"
Duration: "12 Hours"
Rating: (leave empty)
Button: "Book Event"
Link: "/events/marvel-marathon"
```

### Example 3: Coming Soon
```
Background: https://example.com/coming-soon.jpg
Poster: https://example.com/teaser-poster.jpg
Title: "Spider-Man 4"
Description: "The web-slinger returns in 2025..."
Genres: "Action · Superhero"
Year: "Coming 2025"
Duration: "TBA"
Rating: (leave empty)
Button: "Get Notified"
Link: "/notify/spiderman-4"
```

---

## 🎨 Admin Interface

### Slide Form Fields:

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| **Background Image** | ✅ | Full-screen backdrop | `https://...` |
| **Poster Image** | ❌ | Side poster (256-320px) | `https://...` |
| **Title** | ✅ | Main heading | "Movie Title" |
| **Description** | ✅ | Overview text | "Amazing story..." |
| **Subtitle** | ❌ | Additional text | "Now Showing" |
| **Genres** | ❌ | Genre tags | "Action · Drama" |
| **Year** | ❌ | Release year | "2024" |
| **Duration** | ❌ | Runtime | "2h 30m" |
| **Rating** | ❌ | User rating | "8.5/10" |
| **Button Text** | ❌ | CTA label | "Buy Tickets" |
| **Button Link** | ❌ | Destination URL | "/movies" |

### Preview in Admin:
```
┌─────────────────────────────────┐
│  [Background Image Preview]     │
│                                 │
│  Movie Title                    │
│  Action · Adventure             │
│                                 │
│  #1                             │
├─────────────────────────────────┤
│  📅 2024  ⏱️ 2h 30m            │
│  ⭐ 8.5/10  🔘 Buy Tickets     │
│                                 │
│  Description text preview...    │
│                                 │
│  [↑] [↓] [Edit] [×]            │
└─────────────────────────────────┘
```

---

## 🔧 Technical Details

### Database Schema

```javascript
heroSlides: [{
  title: String,           // Required
  subtitle: String,
  description: String,     // Required
  backgroundImage: String, // Required
  posterImage: String,
  genres: String,
  releaseYear: String,
  duration: String,
  rating: String,
  buttonText: String,
  buttonLink: String,
  order: Number,
  isActive: Boolean
}]
```

### API Endpoints

```
GET  /api/hero          - Get hero settings (Public)
PUT  /api/hero          - Update hero settings (Admin)
```

### Frontend Data Flow

```
1. HeroSection fetches /api/hero
2. Gets heroSlides array
3. Displays current slide data
4. Auto-rotates or manual navigation
5. Click button → navigate to buttonLink
```

---

## 💡 Best Practices

### Image Guidelines:
- **Background Images**: 1920x1080px minimum
- **Poster Images**: 500x750px minimum
- **Format**: JPG, PNG, or WebP
- **File Size**: < 500KB for fast loading
- **Use CDN**: For faster delivery

### Content Guidelines:
- **Title**: Keep it under 50 characters
- **Description**: 2-3 sentences max (will be truncated)
- **Genres**: Use "·" separator (e.g., "Action · Adventure")
- **Button Text**: Action-oriented (e.g., "Buy Now", "Learn More")
- **Links**: Use relative paths (e.g., "/movies") or full URLs

### Slider Best Practices:
- Add **3-5 slides** for best experience
- Set auto-rotation to **6000ms** (6 seconds)
- Use **high-quality images**
- Keep text **concise and compelling**
- Test on **mobile devices**

---

## 🎬 Visual Examples

### Frontend Hero Section:
```
┌─────────────────────────────────────────────┐
│                                             │
│  [POSTER]    Custom Title                   │
│              Action · Adventure · 2024      │
│   256px      ⏱️ 2h 30m  ⭐ 8.5/10          │
│                                             │
│              Custom description text...     │
│                                             │
│              [Custom Button →]              │
│                                             │
│  ◀ [🎬][🎬][🎬][🎬] ▶  2 / 4               │
└─────────────────────────────────────────────┘
```

### Admin Panel:
```
┌─────────────────────────────────────────────┐
│ Hero Section Manager                        │
│                              [+ Add Slide]  │
├─────────────────────────────────────────────┤
│ Slider Settings:                            │
│ ☑ Enable Slider  ☑ Auto Rotate  6000ms    │
├─────────────────────────────────────────────┤
│ Hero Slides (4):                            │
│                                             │
│ ┌──────────┐  ┌──────────┐                 │
│ │ [Slide1] │  │ [Slide2] │                 │
│ │ Title    │  │ Title    │                 │
│ │ #1       │  │ #2       │                 │
│ │ [↑↓Edit×]│  │ [↑↓Edit×]│                 │
│ └──────────┘  └──────────┘                 │
│                                             │
│ ┌──────────┐  ┌──────────┐                 │
│ │ [Slide3] │  │ [Slide4] │                 │
│ │ Title    │  │ Title    │                 │
│ │ #3       │  │ #4       │                 │
│ │ [↑↓Edit×]│  │ [↑↓Edit×]│                 │
│ └──────────┘  └──────────┘                 │
│                                             │
│ [Save All Slides]  [Cancel]                │
└─────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Tutorial

### Step 1: Add Your First Slide
1. Go to `/admin/hero-settings`
2. Click "Add New Slide"
3. Fill in required fields:
   - Background Image: `https://images.unsplash.com/photo-1536440136628-849c177e76a1`
   - Title: "Welcome to ShowFlix"
   - Description: "Discover amazing movies and shows"
4. Click "Add Slide"

### Step 2: Add More Slides
1. Click "Add New Slide" again
2. Create second slide with different content
3. Repeat for 3-5 slides

### Step 3: Configure Settings
- ☑ Enable Slider
- ☑ Auto Rotate
- Set interval to 6000ms

### Step 4: Save & Test
1. Click "Save All Slides"
2. Visit homepage
3. Watch your slider in action!

---

## 🔍 Troubleshooting

### Slide Not Showing?
1. Check all required fields are filled
2. Verify image URLs are accessible
3. Check browser console for errors
4. Ensure `enableSlider: true`

### Image Not Loading?
1. Verify URL is correct and accessible
2. Check for CORS issues
3. Use HTTPS URLs
4. Test URL in browser first

### Button Not Working?
1. Check `buttonLink` is valid URL
2. Use relative paths for internal links
3. Use full URLs for external links
4. Test link in browser

### Auto-Rotation Not Working?
1. Check `autoRotate: true`
2. Verify `heroSlides.length > 1`
3. Check `rotationInterval` value
4. Pause on hover is normal behavior

---

## 📱 Responsive Design

The hero slider is fully responsive:

| Screen | Poster | Layout | Navigation |
|--------|--------|--------|------------|
| **Mobile** | Hidden | Stacked | Touch-friendly |
| **Tablet** | 256px | Side-by-side | Arrows + thumbs |
| **Desktop** | 320px | Side-by-side | Full controls |

---

## 🎯 Advanced Tips

### Linking to Specific Movies:
```
Button Link: "/movies/60d5ec49f1b2c8b1f8e4e5f1"
```
(Get movie ID from admin movies page)

### External Links:
```
Button Link: "https://example.com/promotion"
```

### Email Links:
```
Button Link: "mailto:info@showflix.com"
Button Text: "Contact Us"
```

### Phone Links:
```
Button Link: "tel:+1234567890"
Button Text: "Call Now"
```

---

## ✅ Checklist

### Before Going Live:
- [ ] Add at least 3 slides
- [ ] Test all image URLs
- [ ] Verify all button links work
- [ ] Check spelling and grammar
- [ ] Test on mobile device
- [ ] Test on tablet device
- [ ] Test auto-rotation
- [ ] Test manual navigation
- [ ] Verify keyboard navigation
- [ ] Check loading speed

---

## 📈 Performance Tips

1. **Optimize Images**
   - Compress to < 500KB
   - Use WebP format
   - Use CDN for delivery

2. **Lazy Loading**
   - Only current slide loads fully
   - Next slide preloads in background

3. **Cache Settings**
   - Consider caching in localStorage
   - Update cache when admin saves

---

## 🎨 Customization

### Change Poster Size:
```jsx
// In HeroSection.jsx:
className='w-52 lg:w-64 xl:w-72'
// w-52 = 208px (mobile)
// w-64 = 256px (tablet)
// w-72 = 288px (desktop)
```

### Change Auto-Rotation Speed:
```
Admin Panel → Rotation Interval
- 3000 = Fast (3 seconds)
- 6000 = Medium (6 seconds) ← Default
- 10000 = Slow (10 seconds)
```

### Disable Auto-Rotation:
```
Admin Panel → Uncheck "Auto Rotate"
```

---

## 🌟 Features Summary

✅ **Fully Customizable** - Complete control over content  
✅ **Image Upload** - Custom backgrounds and posters  
✅ **Rich Text** - Titles, descriptions, subtitles  
✅ **Metadata** - Genres, year, duration, rating  
✅ **Custom CTAs** - Button text and links  
✅ **Reorder** - Drag to change order  
✅ **Edit Anytime** - Modify existing slides  
✅ **Preview** - See thumbnails in admin  
✅ **Auto-Rotate** - Configurable interval  
✅ **Manual Navigation** - Arrows + thumbnails  
✅ **Keyboard Support** - ← → arrows  
✅ **Pause on Hover** - User-friendly  
✅ **Responsive** - All screen sizes  
✅ **Progress Bars** - Visual timer  
✅ **Smooth Animations** - Beautiful transitions  

---

## 📞 Support

Need help? 
1. Check this guide
2. Verify all fields are filled correctly
3. Test image URLs in browser
4. Check browser console for errors
5. Contact support if issue persists

---

**Happy Creating!** 🎉🎬
