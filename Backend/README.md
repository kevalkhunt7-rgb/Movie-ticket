# ShowFlix Backend API

A complete REST API for the ShowFlix Movie Ticket Booking application built with Node.js, Express, and MongoDB.

## Features

- User authentication with Clerk
- Movie management (CRUD operations)
- Show scheduling and seat management
- Booking system with payment integration
- Favorites functionality
- Admin dashboard support

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Clerk** - User authentication service

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/showflix

# JWT
JWT_SECRET=your_jwt_secret

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

3. Start the server:
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/clerk` | Authenticate with Clerk | Public |
| GET | `/api/auth/me` | Get current user | Private |
| PUT | `/api/auth/profile` | Update profile | Private |
| GET | `/api/auth/users` | Get all users | Admin |

### Movies
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/movies` | Get all movies | Public |
| GET | `/api/movies/:id` | Get single movie | Public |
| POST | `/api/movies` | Create movie | Admin |
| PUT | `/api/movies/:id` | Update movie | Admin |
| DELETE | `/api/movies/:id` | Delete movie | Admin |
| GET | `/api/movies/favorites/my` | Get my favorites | Private |
| POST | `/api/movies/:id/favorite` | Toggle favorite | Private |

### Shows
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/shows` | Get all shows | Public |
| GET | `/api/shows/:id` | Get single show | Public |
| GET | `/api/shows/movie/:movieId` | Get shows by movie | Public |
| POST | `/api/shows/:id/check-seats` | Check seat availability | Public |
| POST | `/api/shows` | Create show | Admin |
| PUT | `/api/shows/:id` | Update show | Admin |
| DELETE | `/api/shows/:id` | Delete show | Admin |

### Bookings
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/bookings` | Create booking | Private |
| GET | `/api/bookings/my` | Get my bookings | Private |
| GET | `/api/bookings/:id` | Get single booking | Private |
| PUT | `/api/bookings/:id/cancel` | Cancel booking | Private |
| PUT | `/api/bookings/:id/payment` | Update payment status | Private |
| GET | `/api/bookings` | Get all bookings | Admin |

## Data Models

### User
- clerkId (String, unique)
- email (String, unique)
- name (String)
- avatar (String)
- phone (String)
- role (Enum: 'user', 'admin')
- favorites (Array of Movie IDs)
- bookings (Array of Booking IDs)

### Movie
- title (String)
- overview (String)
- poster_path (String)
- backdrop_path (String)
- trailer_url (String)
- genres (Array)
- casts (Array)
- release_date (Date)
- vote_average (Number)
- runtime (Number)
- status (Enum: 'now_showing', 'coming_soon', 'ended')

### Show
- movie (ObjectId, ref: Movie)
- showDateTime (Date)
- showPrice (Number)
- theater (Object)
- occupiedSeats (Map)
- totalSeats (Number)

### Booking
- user (ObjectId, ref: User)
- show (ObjectId, ref: Show)
- movie (ObjectId, ref: Movie)
- bookingId (String, unique)
- bookedSeats (Array)
- totalAmount (Number)
- paymentStatus (Enum)
- bookingStatus (Enum)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port | No (default: 5000) |
| MONGODB_URI | MongoDB connection string | Yes |
| JWT_SECRET | Secret for JWT signing | Yes |
| FRONTEND_URL | Frontend application URL | No |
| NODE_ENV | Environment mode | No |

## Seat Layout

Default seat configuration:
- 8 Rows (A-H)
- 10 Seats per row (1-10)
- Total: 80 seats per show

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "stack": "Error stack trace (development only)"
}
```

## License

MIT
