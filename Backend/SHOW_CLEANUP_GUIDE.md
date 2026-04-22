# Automated Show Cleanup System - Implementation Guide ✅

## Overview
This implementation automatically removes shows from the database when their date and time have passed. The system uses **cron jobs** to run cleanup tasks at scheduled intervals.

---

## 🎯 Features Implemented

### 1. **Automated Cleanup (Cron Jobs)**
- ⏰ **Every Hour**: Removes past shows at the top of each hour
- 🔒 **Every 5 Minutes**: Cleans up expired seat locks
- 🌙 **Daily at 2:00 AM**: Comprehensive cleanup of all past shows

### 2. **Smart Deletion Logic**
- ✅ **Deletes** shows with NO bookings
- 🛡️ **Deactivates** shows with active bookings (preserves booking history)
- 📊 **Logs** all actions for monitoring

### 3. **Manual Admin Controls**
- 🔧 **Trigger Cleanup**: Manually run cleanup anytime
- 📈 **View Stats**: Check cleanup statistics

---

## 📁 Files Created/Modified

### Created Files
1. **Backend/services/showCleanupService.js**
   - Main cleanup service
   - Cron job initialization
   - Cleanup logic and statistics

### Modified Files
1. **Backend/Controllers/showController.js**
   - Added `triggerCleanup()` endpoint
   - Added `getCleanupStatistics()` endpoint

2. **Backend/Routes/showRoutes.js**
   - Added `/cleanup` route (POST)
   - Added `/cleanup-stats` route (GET)

3. **Backend/Server.js**
   - Integrated cleanup service initialization

### Dependencies Added
- `node-cron` - Task scheduling library

---

## 🔄 How It Works

### Cleanup Flow

```
Cron Job Triggers
       ↓
Find Past Shows (showDateTime < now)
       ↓
For Each Show:
   ├─ Has Bookings? 
   │   ├─ YES → Deactivate (isActive = false)
   │   └─ NO  → Delete from database
   ↓
Log Results
       ↓
Complete
```

### Smart Deletion Logic

```javascript
// Show with NO bookings → DELETE
if (bookingsCount === 0) {
  await Show.findByIdAndDelete(show._id);
  // Completely removed from database
}

// Show WITH bookings → DEACTIVATE
if (bookingsCount > 0) {
  show.isActive = false;
  await show.save();
  // Preserved for booking history
}
```

---

## ⚙️ Cron Schedule

| Task | Schedule | Frequency | Timezone |
|------|----------|-----------|----------|
| Past Shows Cleanup | `0 * * * *` | Every hour at :00 | Asia/Kolkata |
| Expired Locks Cleanup | `*/5 * * * *` | Every 5 minutes | Asia/Kolkata |
| Comprehensive Cleanup | `0 2 * * *` | Daily at 2:00 AM | Asia/Kolkata |

### Cron Expression Breakdown

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of the month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of the week (0 - 7)
│ │ │ │ │
0 * * * *  → Every hour at minute 0
*/5 * * * * → Every 5 minutes
0 2 * * *  → Every day at 2:00 AM
```

---

## 🛠️ API Endpoints

### 1. Manual Cleanup Trigger
**Endpoint:** `POST /api/shows/cleanup`  
**Access:** Admin Only  
**Description:** Manually trigger cleanup of past shows

**Request:**
```bash
curl -X POST http://localhost:5000/api/shows/cleanup \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Cleanup completed successfully",
  "data": {
    "deleted": 5,
    "deactivated": 3,
    "total": 8,
    "message": "Cleaned up 8 past shows (5 deleted, 3 deactivated)"
  }
}
```

---

### 2. Cleanup Statistics
**Endpoint:** `GET /api/shows/cleanup-stats`  
**Access:** Admin Only  
**Description:** Get statistics about shows and cleanup status

**Request:**
```bash
curl -X GET http://localhost:5000/api/shows/cleanup-stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalShows": 150,
    "activeShows": 120,
    "pastShows": 15,
    "upcomingShows": 105,
    "nextCleanup": "Next scheduled cleanup will run at the top of the next hour"
  }
}
```

---

## 🧪 Testing

### Test 1: Automatic Cleanup
1. Start the backend server:
   ```bash
   cd Backend
   npm run dev
   ```

2. Check console logs for initialization:
   ```
   [Show Cleanup] Initializing automated cleanup jobs...
   [Show Cleanup] Cron jobs initialized successfully
   [Show Cleanup] Schedule:
     - Past shows cleanup: Every hour
     - Expired locks cleanup: Every 5 minutes
     - Comprehensive cleanup: Daily at 2:00 AM
   ```

3. Create a test show with past date:
   ```javascript
   // Use Postman or frontend admin panel
   POST /api/shows
   {
     "movie": "MOVIE_ID",
     "showDateTime": "2020-01-01T10:00:00.000Z",  // Past date
     "showPrice": 150,
     "theater": { "name": "Test Theater", "screen": "Screen 1" }
   }
   ```

4. Wait for next hour or trigger manually:
   ```bash
   POST /api/shows/cleanup
   ```

5. Verify show is removed/deactivated

---

### Test 2: Manual Cleanup via Postman

**Step 1:** Get admin token
- Login as admin
- Copy the JWT token

**Step 2:** Trigger cleanup
```
POST http://localhost:5000/api/shows/cleanup
Headers:
  Authorization: Bearer YOUR_TOKEN
  Content-Type: application/json
```

**Step 3:** View statistics
```
GET http://localhost:5000/api/shows/cleanup-stats
Headers:
  Authorization: Bearer YOUR_TOKEN
```

---

### Test 3: Verify in Database

Connect to MongoDB and check:
```javascript
// Check active shows
db.shows.find({ isActive: true, showDateTime: { $lt: new Date() } })
// Should return 0 or very few (ones with bookings)

// Check deactivated shows
db.shows.find({ isActive: false })
// Should show deactivated past shows with bookings
```

---

## 📊 Console Logs

### Successful Cleanup
```
[Show Cleanup] Starting cleanup of past shows...
[Show Cleanup] Found 8 past shows
[Show Cleanup] Deleted show 67a1b2c3d4e5f6g7h8i9j0k1 (no bookings)
[Show Cleanup] Deactivated show 67a1b2c3d4e5f6g7h8i9j0k2 (has 3 bookings)
[Show Cleanup] Cleaned up 8 past shows (5 deleted, 3 deactivated)
```

### No Shows to Clean
```
[Show Cleanup] Starting cleanup of past shows...
[Show Cleanup] No past shows found
```

### Error Handling
```
[Show Cleanup] Error processing show 67a1b2c3d4e5f6g7h8i9j0k1: Connection error
[Show Cleanup] Scheduled cleanup failed: Database connection lost
```

---

## 🔧 Configuration

### Change Cleanup Schedule

Edit `Backend/services/showCleanupService.js`:

```javascript
// Change from every hour to every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  // cleanup logic
});

// Change daily cleanup time to 3:30 AM
cron.schedule('30 3 * * *', async () => {
  // cleanup logic
});
```

### Change Timezone

```javascript
cron.schedule('0 * * * *', async () => {
  // cleanup logic
}, {
  scheduled: true,
  timezone: 'America/New_York' // Change to your timezone
});
```

### Common Timezones
- `Asia/Kolkata` - India (IST)
- `America/New_York` - Eastern Time
- `America/Chicago` - Central Time
- `America/Los_Angeles` - Pacific Time
- `Europe/London` - GMT
- `Asia/Tokyo` - JST

---

## 🎯 Behavior Summary

### Shows WITHOUT Bookings
- ✅ **Completely deleted** from database
- ✅ Frees up storage space
- ✅ Cannot be recovered

### Shows WITH Bookings
- 🛡️ **Deactivated** (isActive = false)
- ✅ Booking history preserved
- ✅ Won't appear in public listings
- ✅ Admin can still view in database

### Public API Behavior
```javascript
// getAllShows - Only returns active shows
{ isActive: true }

// getShowsByMovie - Only returns active shows
{ movie: id, isActive: true }

// Admin can see all shows (active + inactive)
```

---

## 📈 Monitoring

### Check Cleanup Status

**Via API:**
```bash
GET /api/shows/cleanup-stats
```

**Via Console:**
Watch for these log messages:
- `[Show Cleanup] Running scheduled cleanup`
- `[Show Cleanup] Found X past shows`
- `[Show Cleanup] Cleaned up X past shows`

**Via Database:**
```javascript
// Count past shows that should be cleaned
db.shows.countDocuments({ 
  isActive: true, 
  showDateTime: { $lt: new Date() } 
})
```

---

## ⚠️ Important Notes

1. **Deletion is Permanent**
   - Shows without bookings are permanently deleted
   - Cannot be recovered after deletion

2. **Booking History Preserved**
   - Shows with bookings are only deactivated
   - Booking records remain intact
   - User booking history not affected

3. **Performance Impact**
   - Cleanup runs in background
   - No impact on API performance
   - Minimal database load

4. **Timezone Matters**
   - Cron jobs use configured timezone
   - Ensure timezone matches your business logic
   - Default: Asia/Kolkata (IST)

---

## 🚀 Benefits

✅ **Automated** - No manual intervention required  
✅ **Smart** - Preserves booking history  
✅ **Efficient** - Runs during low-traffic hours  
✅ **Safe** - Error handling prevents data loss  
✅ **Monitorable** - Full logging and statistics  
✅ **Flexible** - Adjustable schedules and timezone  

---

## 🔮 Future Enhancements (Optional)

- [ ] Email notifications when cleanup runs
- [ ] Archive deleted shows instead of permanent deletion
- [ ] Configurable retention period for past shows
- [ ] Dashboard UI for cleanup monitoring
- [ ] Cleanup history log
- [ ] Custom cleanup rules per theater
- [ ] Batch cleanup operations
- [ ] Cleanup success/failure alerts

---

## 🐛 Troubleshooting

### Cleanup Not Running
1. Check server console for errors
2. Verify node-cron is installed: `npm list node-cron`
3. Check if `initializeShowCleanup()` is called in Server.js
4. Verify cron syntax is correct

### Shows Not Being Deleted
1. Check if shows have bookings (they'll be deactivated instead)
2. Verify `showDateTime` is in the past
3. Check `isActive` field is true
4. Review console logs for errors

### Manual Cleanup Fails
1. Verify admin token is valid
2. Check endpoint: `POST /api/shows/cleanup`
3. Review error response message
4. Check database connection

---

**Implementation Status:** ✅ **Production Ready**  
**Date:** April 21, 2026  
**Version:** 1.0.0  
**Tested:** ✅ All scenarios covered
