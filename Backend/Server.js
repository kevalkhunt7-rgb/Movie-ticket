import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import dns from "dns";

import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { initializeSocketHandlers } from "./socket/seatSocket.js";
import { initializeShowCleanup } from "./services/showCleanupService.js";

// Import routes
import authRoutes from "./Routes/authRoutes.js";
import movieRoutes from "./Routes/movieRoutes.js";
import showRoutes from "./Routes/showRoutes.js";
import bookingRoutes from "./Routes/bookingRoutes.js";
import paymentRoutes from "./Routes/paymentRoutes.js";
import ticketRoutes from "./Routes/ticketRoutes.js";

// Load env vars first
dotenv.config();

// Debug: Log environment variables
console.log('[ENV] RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'EXISTS' : 'MISSING');
console.log('[ENV] RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'EXISTS' : 'MISSING');
console.log('[ENV] MONGODB_URI:', process.env.MONGODB_URI ? 'EXISTS' : 'MISSING');

// Optional DNS fallback
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// Connect DB
connectDB();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  'https://movie-ticket-2ort26a6t-kevalkhunt7-5969s-projects.vercel.app/'
].filter(Boolean);

// Express CORS for API routes
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin like Postman/mobile apps
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS not allowed for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight requests
app.options("*", cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  },
});

// Store io instance globally
app.set("io", io);

// Initialize socket handlers
initializeSocketHandlers(io);

// Initialize automated show cleanup cron jobs
initializeShowCleanup();

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/tickets", ticketRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Base route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to ShowFlix API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      movies: "/api/movies",
      shows: "/api/shows",
      bookings: "/api/bookings",
      payments: "/api/payments",
    },
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = httpServer.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
  );
  console.log("Allowed origins:", allowedOrigins);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  process.exit(1);
});

export default app;