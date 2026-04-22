import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import BlurCircle from '../Component/BlurCircle'
import TicketCard from '../Component/TicketCard'
import { ticketAPI } from '../services/api'
import { CheckCircle, Download, Share2, Home, Ticket, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

const BookingConfirmation = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { movie, selectedSeats, showTime, date, totalAmount, bookingId, bookingDate, paymentId } = location.state || {}
  const [showConfetti, setShowConfetti] = useState(true)
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showTicket, setShowTicket] = useState(false)

  // Generate ticket on mount
  useEffect(() => {
    if (!movie || !bookingId) {
      navigate('/movies')
      return
    }

    generateTicket()
    
    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [movie, bookingId, navigate])

  const generateTicket = async () => {
    try {
      setLoading(true)
      const response = await ticketAPI.generateTicket(bookingId)
      setTicket(response.data.ticket)
    } catch (error) {
      console.error('Generate ticket error:', error)
      toast.error('Failed to generate ticket')
    } finally {
      setLoading(false)
    }
  }

  if (!movie || !bookingId) return null

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timeString) => {
    const date = new Date(timeString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  // Get show datetime - compatible with both old and new data shapes
  const showDateTime = showTime?.showDateTime || showTime?.time || date

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Movie Ticket - ${movie.title}`,
        text: `I've booked tickets for ${movie.title} on ${formatDate(date)} at ${formatTime(showDateTime)}!`,
        url: window.location.href
      })
    } else {
      toast.success('Link copied to clipboard!')
    }
  }

  return (
    <div className='min-h-screen pt-24 pb-12 px-4 md:px-8 lg:px-16 relative overflow-hidden'>
      <BlurCircle top='50px' right='-100px' color='bg-green-500/20' size={400} />
      <BlurCircle bottom='50px' left='-100px' color='bg-primary/20' size={350} />

      {/* Confetti Effect */}
      {showConfetti && (
        <div className='fixed inset-0 pointer-events-none z-50'>
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className='absolute animate-ping'
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: '1s'
              }}
            >
              <div
                className='w-2 h-2 rounded-full'
                style={{
                  backgroundColor: ['#F84565', '#22c55e', '#3b82f6', '#f59e0b'][Math.floor(Math.random() * 4)]
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className='max-w-4xl mx-auto'>
        {/* Success Header */}
        <div className='text-center mb-8'>
          <div className='w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce'>
            <CheckCircle className='w-10 h-10 text-green-500' />
          </div>
          <h1 className='text-3xl md:text-4xl font-bold mb-2'>Booking Confirmed!</h1>
          <p className='text-gray-400'>Your tickets have been booked successfully</p>
          <p className='text-primary font-medium mt-2'>Booking ID: {bookingId}</p>
          {paymentId && (
            <p className='text-xs text-gray-500 mt-1'>Payment ID: {paymentId}</p>
          )}
        </div>

        {/* E-Ticket Section */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl font-semibold flex items-center gap-2'>
              <Ticket className='w-6 h-6 text-primary' />
              Your E-Ticket
            </h2>
            <button
              onClick={() => setShowTicket(!showTicket)}
              className='flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition'
            >
              <Eye className='w-4 h-4' />
              {showTicket ? 'Hide Ticket' : 'View Ticket'}
            </button>
          </div>

          {loading ? (
            <div className='flex justify-center py-12'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
            </div>
          ) : ticket ? (
            showTicket ? (
              <TicketCard ticket={ticket} bookingId={bookingId} />
            ) : (
              <div className='bg-white/5 rounded-2xl p-8 text-center'>
                <Ticket className='w-16 h-16 text-gray-600 mx-auto mb-4' />
                <p className='text-gray-400'>Your ticket is ready!</p>
                <button
                  onClick={() => setShowTicket(true)}
                  className='mt-4 px-6 py-2 bg-primary hover:bg-primary-dull rounded-lg transition'
                >
                  View Ticket
                </button>
              </div>
            )
          ) : (
            <div className='bg-white/5 rounded-2xl p-8 text-center'>
              <p className='text-gray-400'>Failed to load ticket</p>
              <button
                onClick={generateTicket}
                className='mt-4 px-6 py-2 bg-primary hover:bg-primary-dull rounded-lg transition'
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className='flex flex-wrap justify-center gap-4 mb-8'>
          <button
            onClick={handleShare}
            className='flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition'
          >
            <Share2 className='w-5 h-5' />
            Share Booking
          </button>
          <button
            onClick={() => navigate('/my-bookings')}
            className='flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition'
          >
            <Ticket className='w-5 h-5' />
            View All Bookings
          </button>
        </div>

        {/* Important Info */}
        <div className='bg-amber-500/10 rounded-xl p-6 mb-8'>
          <h3 className='font-semibold mb-3 flex items-center gap-2'>
            <span className='w-2 h-2 bg-amber-500 rounded-full'></span>
            Important Information
          </h3>
          <ul className='text-sm text-gray-400 space-y-2 ml-4'>
            <li>• Please arrive at least 15 minutes before the show time</li>
            <li>• Carry a valid ID proof along with this ticket</li>
            <li>• Outside food and beverages are not allowed</li>
            <li>• Recording the movie is strictly prohibited</li>
          </ul>
        </div>

        {/* Back to Home */}
        <div className='text-center'>
          <button
            onClick={() => navigate('/')}
            className='inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary-dull rounded-xl font-semibold transition'
          >
            <Home className='w-5 h-5' />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingConfirmation
