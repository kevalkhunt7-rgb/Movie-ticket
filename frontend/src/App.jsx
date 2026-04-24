import React from 'react'
import Navbar from './Component/Navbar'
import { Route, Routes, useLocation, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetails from './pages/MovieDetails'
import SeatLayout from './pages/SeatLayout'
import MyBookings from './pages/MyBookings'
import Favorites from './pages/Favorites'
import Payment from './pages/Payment'
import BookingConfirmation from './pages/BookingConfirmation'
import ForgotPassword from './pages/ForgotPassword'
import { Toaster } from "react-hot-toast"
import Footer from './Component/Footer'
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react'
import { useAuth } from './context/AuthContext'

// Admin imports
import AdminLayout from './admin/AdminLayout'
import AdminDashboard from './admin/AdminDashboard'
import AdminMovies from './admin/AdminMovies'
import AdminShows from './admin/AdminShows'
import AdminBookings from './admin/AdminBookings'
import AdminUsers from './admin/AdminUsers'
import AdminHeroSettings from './admin/AdminHeroSettings'
import MovieForm from './admin/MovieForm'
import ShowForm from './admin/ShowForm'

// Admin Route Guard
const AdminRoute = ({ children }) => {
  const { backendUser, loading } = useAuth()
  

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }
  
  // Redirect to home if not authenticated or not admin
  if (!backendUser || backendUser.role !== 'admin') { 
    console.warn('Admin access denied: User is not authenticated or not an admin')
    return <Navigate to="/" replace />
  }
  
  return children
}

const App = () => {

  const isAdminRoute = useLocation().pathname.startsWith('/admin')

  return (
    <>
      <header>
        <Show when="signed-out">
          <SignInButton />
          <SignUpButton />
        </Show>
        <Show when="signed-in">
          
        </Show>
      </header>
      <Toaster />
      {!isAdminRoute && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route path='/' element={<Home />} />
        <Route path='/movies' element={<Movies />} />
        <Route path='/movies/:id' element={<MovieDetails />} />
        <Route path='/seat-layout/:showId' element={<SeatLayout />} />
        <Route path='/my-bookings' element={<MyBookings />} />
        <Route path='/favorite' element={<Favorites />} />
        <Route path='/payment' element={<Payment />} />
        <Route path='/booking-confirmation' element={<BookingConfirmation />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        
        {/* Admin Routes */}
        <Route path='/admin' element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path='movies' element={<AdminMovies />} />
          <Route path='movies/add' element={<MovieForm />} />
          <Route path='movies/edit/:id' element={<MovieForm />} />
          <Route path='shows' element={<AdminShows />} />
          <Route path='shows/add' element={<ShowForm />} />
          <Route path='shows/edit/:id' element={<ShowForm />} />
          <Route path='bookings' element={<AdminBookings />} />
          <Route path='users' element={<AdminUsers />} />
          <Route path='hero-settings' element={<AdminHeroSettings />} />
        </Route>
      </Routes>
      {!isAdminRoute && <Footer />}
    </>
  )
}

export default App