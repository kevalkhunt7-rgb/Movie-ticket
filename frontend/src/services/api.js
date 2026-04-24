import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
console.log(API_URL)

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only remove token and redirect if it's not an admin API call
      // This prevents unwanted page reloads
      const currentPath = window.location.pathname;
      
      // Don't redirect on admin routes - let the AdminRoute handle it
      if (!currentPath.startsWith('/admin')) {
        localStorage.removeItem('token');
        // Use window.location only for non-admin routes
        window.location.href = '/';
      } else {
        // For admin routes, just clear token but don't reload
        // The AdminRoute guard will handle the redirect
        console.warn('Authentication error on admin route - token may be expired');
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  clerkAuth: (userData) => api.post('/auth/clerk', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  getAllUsers: () => api.get('/auth/users'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  resetPassword: (email, resetToken, newPassword) => api.post('/auth/reset-password', { email, resetToken, newPassword })
};

// Movie APIs
export const movieAPI = {
  getAllMovies: (params) => api.get('/movies', { params }),
  getMovie: (id) => api.get(`/movies/${id}`),
  createMovie: (data) => api.post('/movies', data),
  updateMovie: (id, data) => api.put(`/movies/${id}`, data),
  deleteMovie: (id) => api.delete(`/movies/${id}`),
  toggleFavorite: (id) => api.post(`/movies/${id}/favorite`),
  getMyFavorites: () => api.get('/movies/favorites/my')
};

console.log(movieAPI,"movieAPI")

// Show APIs
export const showAPI = {
  getAllShows: (params) => api.get('/shows', { params }),
  getShow: (id) => api.get(`/shows/${id}`),
  getShowsByMovie: (movieId, params) => api.get(`/shows/movie/${movieId}`, { params }),
  createShow: (data) => api.post('/shows', data),
  updateShow: (id, data) => api.put(`/shows/${id}`, data),
  deleteShow: (id) => api.delete(`/shows/${id}`),
  checkSeatAvailability: (id, seats) => api.post(`/shows/${id}/check-seats`, { seats })
};

// Booking APIs
export const bookingAPI = {
  createBooking: (data) => api.post('/bookings', data),
  getMyBookings: (params) => api.get('/bookings/my', { params }),
  getAllBookings: (params) => api.get('/bookings', { params }),
  getBooking: (id) => api.get(`/bookings/${id}`),
  cancelBooking: (id) => api.put(`/bookings/${id}/cancel`),
  updatePaymentStatus: (id, data) => api.put(`/bookings/${id}/payment`, data)
};

// Payment APIs
export const paymentAPI = {
  getRazorpayKey: () => api.get('/payments/key'),
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify', data)
};

// Ticket APIs
export const ticketAPI = {
  generateTicket: (bookingId) => api.post(`/tickets/${bookingId}/generate-ticket`),
  getTicket: (bookingId) => api.get(`/tickets/${bookingId}/ticket`),
  verifyTicket: (qrData) => api.post('/tickets/verify', { qrData })
};

// Hero APIs
export const heroAPI = {
  getHeroSettings: () => api.get('/hero'),
  updateHeroSettings: (data) => api.put('/hero', data),
  getMoviesForSlider: () => api.get('/hero/movies')
};

export default api;
