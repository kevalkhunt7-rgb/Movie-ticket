# Debug Guide: Hero Slider Not Showing 🔍

## Problem
Admin saves slides but they don't appear in the frontend hero slider.

---

## ✅ Step-by-Step Fix

### Step 1: RESTART BACKEND SERVER (CRITICAL!)

The backend model was changed, so you MUST restart:

```bash
# Stop current backend (Ctrl+C)
# Then restart:
cd Backend
npm start
```

**Or if using nodemon:**
```bash
npx nodemon Server.js
```

---

### Step 2: Check Backend Console

After restarting, you should see:
```
✅ Server started on port 5000
✅ MongoDB Connected
✅ API Routes registered
```

**Verify hero route is registered:**
Look for this in Server.js startup logs or check:
```javascript
app.use("/api/hero", heroRoutes); // Should be line ~98
```

---

### Step 3: Create a Test Slide in Admin

1. Go to: `http://localhost:5173/admin/hero-settings`
2. Click **"Add New Slide"**
3. Fill in this test data:
   ```
   Background Image: https://images.unsplash.com/photo-1536440136628-849c177e76a1
   Poster Image: https://images.unsplash.com/photo-1616530940355-351fabd9524b
   Title: Test Slide 1
   Description: This is a test slide
   Genres: Test · Demo
   Year: 2024
   Duration: 2h 30m
   Rating: 8.5/10
   Button Text: Click Me
   Button Link: /movies
   ```
4. Click **"Add Slide"**
5. Add 2 more slides (different titles)
6. Click **"Save All Slides"**

---

### Step 4: Check Backend Console Logs

After saving, you should see:
```
[Hero] Update request received: { slidesCount: 3, enableSlider: true }
[Hero] Creating new hero settings  (or "Updating existing")
[Hero] Settings saved successfully
```

**If you don't see these logs:**
- Backend is not running
- Backend hasn't been restarted
- Route is not registered

---

### Step 5: Test API Endpoint Manually

Open browser and go to:
```
http://localhost:5000/api/hero
```

**Expected Response:**
```json
{
  "success": true,
  "settings": {
    "enableSlider": true,
    "autoRotate": true,
    "rotationInterval": 6000,
    "heroSlides": [
      {
        "_id": "...",
        "title": "Test Slide 1",
        "description": "This is a test slide",
        "backgroundImage": "https://...",
        "posterImage": "https://...",
        "genres": "Test · Demo",
        "releaseYear": "2024",
        "duration": "2h 30m",
        "rating": "8.5/10",
        "buttonText": "Click Me",
        "buttonLink": "/movies",
        "order": 0,
        "isActive": true
      },
      { ...slide 2... },
      { ...slide 3... }
    ]
  }
}
```

**If you get 404:**
- Backend not running
- Route not registered
- Need to restart backend

**If heroSlides is empty `[]`:**
- Admin didn't save properly
- Check admin console for errors

---

### Step 6: Check Frontend Console

1. Go to homepage: `http://localhost:5173/`
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for these logs:

```
[HeroSection] Response from API: { success: true, settings: {...} }
[HeroSection] Settings: { enableSlider: true, heroSlides: [...] }
[HeroSection] HeroSlides: [ {...}, {...}, {...} ]
[HeroSection] Slides count: 3
```

**If you see errors:**
- API call failed
- Backend not running
- CORS issue
- Wrong API URL

**If slides count is 0:**
- No data in database
- Admin didn't save
- Check backend logs

---

### Step 7: Check Network Tab

In browser DevTools → Network tab:

1. Refresh homepage
2. Look for request: `GET /api/hero`
3. Check response:
   - **Status:** Should be `200 OK`
   - **Response:** Should contain `heroSlides` array

**If status is 404:**
```
❌ Backend not running
❌ Route not registered
❌ Need to restart server
```

**If status is 200 but empty slides:**
```
❌ No data saved in database
❌ Admin save failed
❌ Check admin panel for errors
```

---

### Step 8: Verify Database

Connect to MongoDB and check:

```javascript
// In MongoDB Compass or shell
db.herosettings.find()
```

**Should see:**
```javascript
{
  _id: ObjectId("..."),
  enableSlider: true,
  autoRotate: true,
  rotationInterval: 6000,
  heroSlides: [
    { title: "Test Slide 1", ... },
    { title: "Test Slide 2", ... },
    { title: "Test Slide 3", ... }
  ],
  isActive: true,
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

**If collection is empty:**
- Admin never saved successfully
- Save request failed
- Check for validation errors

---

## 🐛 Common Issues & Solutions

### Issue 1: "404 Not Found" on /api/hero

**Cause:** Backend not restarted or route not registered

**Solution:**
```bash
# 1. Stop backend (Ctrl+C)
# 2. Verify Server.js has this line:
import heroRoutes from "./Routes/heroRoutes.js";
app.use("/api/hero", heroRoutes);

# 3. Restart backend
npm start
```

---

### Issue 2: Empty heroSlides Array `[]`

**Cause:** No data saved in database

**Solution:**
1. Go to admin panel
2. Create slides
3. Click "Save All Slides"
4. Check backend console for success logs
5. Refresh frontend

---

### Issue 3: Frontend Shows Loading Forever

**Cause:** API call failing or hanging

**Solution:**
1. Check browser console for errors
2. Verify backend is running
3. Check Network tab for failed requests
4. Verify API URL in `.env`:
   ```
   VITE_BACKEND_URL=http://localhost:5000
   ```

---

### Issue 4: Admin Save Fails

**Cause:** Backend validation error or network issue

**Solution:**
1. Check browser console for errors
2. Check backend console for error logs
3. Verify all required fields are filled:
   - ✅ Title
   - ✅ Description
   - ✅ Background Image
4. Check Network tab for 400/500 errors

---

### Issue 5: Slides Show But Images Don't Load

**Cause:** Invalid image URLs or CORS

**Solution:**
1. Test image URLs in browser
2. Use HTTPS URLs
3. Use accessible images (Unsplash, etc.)
4. Check browser console for 404 on images

---

## 🔍 Debug Checklist

### Backend:
- [ ] Backend server running
- [ ] Backend restarted after model changes
- [ ] Hero routes registered in Server.js
- [ ] MongoDB connected
- [ ] Console shows "[Hero]" logs
- [ ] API endpoint returns data: `http://localhost:5000/api/hero`

### Admin Panel:
- [ ] Can access `/admin/hero-settings`
- [ ] Can create new slide
- [ ] Form validates correctly
- [ ] Save button works
- [ ] Success message appears
- [ ] Slides visible in admin list

### Database:
- [ ] HeroSettings collection exists
- [ ] Contains heroSlides array
- [ ] Slides have all required fields
- [ ] isActive: true

### Frontend:
- [ ] Homepage loads
- [ ] No console errors
- [ ] API call successful (Network tab)
- [ ] Response contains heroSlides
- [ ] Console shows slide count > 0
- [ ] HeroSection renders slides

---

## 📝 Quick Test Commands

### Test Backend API:
```bash
curl http://localhost:5000/api/hero
```

### Check if Backend is Running:
```bash
curl http://localhost:5000/api/health
```

### Test Admin Save (with Postman):
```
PUT http://localhost:5000/api/hero
Headers: Authorization: Bearer YOUR_ADMIN_TOKEN
Body:
{
  "enableSlider": true,
  "autoRotate": true,
  "rotationInterval": 6000,
  "heroSlides": [
    {
      "title": "Test",
      "description": "Test description",
      "backgroundImage": "https://images.unsplash.com/photo-1536440136628-849c177e76a1",
      "order": 0
    }
  ]
}
```

---

## ✅ Expected Flow

```
1. Start Backend ✅
2. Go to Admin Panel ✅
3. Create 3 Slides ✅
4. Click Save ✅
5. Backend logs: "[Hero] Settings saved successfully" ✅
6. Visit Homepage ✅
7. Frontend logs: "[HeroSection] Slides count: 3" ✅
8. See slider with 3 slides ✅
```

---

## 🎯 Nuclear Option (Reset Everything)

If nothing works, reset the database collection:

```javascript
// In MongoDB shell or Compass
db.herosettings.deleteMany({})
```

Then:
1. Restart backend
2. Go to admin
3. Create fresh slides
4. Save
5. Check frontend

---

## 📞 Still Not Working?

Collect this info:
1. Backend console logs (after restart)
2. Frontend console logs (on homepage)
3. Network tab screenshot (showing /api/hero request)
4. Admin panel screenshot (showing saved slides)
5. MongoDB collection screenshot

This will help identify the exact issue!

---

**Remember:** The most common issue is forgetting to restart the backend after model changes! 🔄
