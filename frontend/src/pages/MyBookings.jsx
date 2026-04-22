import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingAPI, ticketAPI } from '../services/api'
import BlurCircle from '../Component/BlurCircle'
import Loading from '../Component/Loading'
import TicketCard from '../Component/TicketCard'
import { Calendar, Clock, MapPin, Ticket, Download, Star, Trash2, Eye, X } from 'lucide-react'
import toast from 'react-hot-toast'

const MyBookings = () => {
  const navigate = useNavigate()
  const [upcomingBookings, setUpcomingBookings] = useState([])
  const [pastBookings, setPastBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [stats, setStats] = useState({ totalBookings: 0, totalSpent: 0 })
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [ticketLoading, setTicketLoading] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await bookingAPI.getMyBookings()
      setUpcomingBookings(response.data.upcoming)
      setPastBookings(response.data.past)
      
      // Calculate stats
      const allBookings = [...response.data.upcoming, ...response.data.past]
      const totalSpent = allBookings.reduce((sum, b) => sum + b.totalAmount, 0)
      setStats({
        totalBookings: allBookings.length,
        totalSpent
      })
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Please login to view bookings')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isUpcoming = (showDateTime) => {
    return new Date(showDateTime) > new Date()
  }

  const getFilteredBookings = () => {
    return activeTab === 'upcoming' ? upcomingBookings : pastBookings
  }

  const handleCancelBooking = async (bookingId) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingAPI.cancelBooking(bookingId)
        toast.success('Booking cancelled successfully')
        fetchBookings() // Refresh bookings
      } catch (error) {
        console.error('Error cancelling booking:', error)
        toast.error('Failed to cancel booking')
      }
    }
  }

  const handleViewTicket = async (booking) => {
    try {
      setTicketLoading(true)
      const response = await ticketAPI.getTicket(booking.bookingId)
      setSelectedTicket(response.data.ticket)
      setShowTicketModal(true)
    } catch (error) {
      console.error('Error fetching ticket:', error)
      toast.error('Failed to load ticket')
    } finally {
      setTicketLoading(false)
    }
  }

  const handleDownloadTicket = (booking) => {
    handleViewTicket(booking)
  }

  if (loading) return <Loading />

  return (
    <div className='min-h-screen pt-24 pb-12 px-4 md:px-8 lg:px-16'>
      <BlurCircle top='100px' left='-100px' color='bg-primary/20' size={300} />
      <BlurCircle bottom='100px' right='-100px' color='bg-blue-600/20' size={250} />

      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl md:text-4xl font-bold mb-2'>My Bookings</h1>
          <p className='text-gray-400'>Manage your movie tickets and bookings</p>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
          <div className='bg-white/5 rounded-xl p-4'>
            <p className='text-gray-400 text-sm'>Total Bookings</p>
            <p className='text-2xl font-bold'>{stats.totalBookings}</p>
          </div>
          <div className='bg-white/5 rounded-xl p-4'>
            <p className='text-gray-400 text-sm'>Upcoming</p>
            <p className='text-2xl font-bold text-primary'>
              {upcomingBookings.length}
            </p>
          </div>
          <div className='bg-white/5 rounded-xl p-4'>
            <p className='text-gray-400 text-sm'>Completed</p>
            <p className='text-2xl font-bold text-green-500'>
              {pastBookings.filter(b => b.bookingStatus === 'completed').length}
            </p>
          </div>
          <div className='bg-white/5 rounded-xl p-4'>
            <p className='text-gray-400 text-sm'>Total Spent</p>
            <p className='text-2xl font-bold'>
              ${stats.totalSpent}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className='flex gap-4 mb-6 border-b border-white/10'>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`pb-4 px-2 font-medium transition relative ${
              activeTab === 'upcoming' ? 'text-primary' : 'text-gray-400 hover:text-white'
            }`}
          >
            Upcoming Shows
            {activeTab === 'upcoming' && (
              <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-primary'></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`pb-4 px-2 font-medium transition relative ${
              activeTab === 'past' ? 'text-primary' : 'text-gray-400 hover:text-white'
            }`}
          >
            Past Shows
            {activeTab === 'past' && (
              <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-primary'></div>
            )}
          </button>
        </div>

        {/* Bookings List */}
        {getFilteredBookings().length > 0 ? (
          <div className='space-y-4'>
            {getFilteredBookings().map((booking) => (
              <div 
                key={booking._id}
                className='bg-white/5 rounded-2xl p-4 md:p-6 hover:bg-white/10 transition group'
              >
                <div className='flex flex-col md:flex-row gap-6'>
                  {/* Movie Poster */}
                  <div className='flex-shrink-0'>
                    <img 
                      src={booking.movie?.poster_path}
                      alt={booking.movie?.title}
                      className='w-32 h-48 object-cover rounded-xl shadow-lg'
                    />
                  </div>

                  {/* Booking Details */}
                  <div className='flex-grow'>
                    <div className='flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4'>
                      <div>
                        <h2 className='text-xl font-semibold mb-1'>{booking.movie?.title}</h2>
                        <p className='text-gray-400 text-sm'>{booking.movie?.lang} • {booking.movie?.genres?.map(g => g.name).join(', ')}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        booking.bookingStatus === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                        booking.bookingStatus === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {booking.bookingStatus?.charAt(0).toUpperCase() + booking.bookingStatus?.slice(1)}
                      </span>
                    </div>

                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
                      <div className='flex items-center gap-2'>
                        <Calendar className='w-4 h-4 text-primary' />
                        <span className='text-sm'>{formatDate(booking.show?.showDateTime)}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Clock className='w-4 h-4 text-primary' />
                        <span className='text-sm'>{formatTime(booking.show?.showDateTime)}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <MapPin className='w-4 h-4 text-primary' />
                        <span className='text-sm'>{booking.show?.theater?.name}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Ticket className='w-4 h-4 text-primary' />
                        <span className='text-sm'>{booking.bookedSeats?.join(', ')}</span>
                      </div>
                    </div>

                    <div className='flex items-center justify-between pt-4 border-t border-white/10'>
                      <div>
                        <span className='text-gray-400 text-sm'>Total Paid: </span>
                        <span className='text-xl font-bold text-primary'>${booking.totalAmount}</span>
                      </div>

                      <div className='flex gap-3'>
                        {activeTab === 'upcoming' && booking.bookingStatus !== 'cancelled' && (
                          <>
                            <button
                              onClick={() => handleViewTicket(booking)}
                              className='flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-sm'
                            >
                              <Eye className='w-4 h-4' />
                              View Ticket
                            </button>
                            <button
                              onClick={() => handleCancelBooking(booking._id)}
                              className='flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition text-sm'
                            >
                              <Trash2 className='w-4 h-4' />
                              Cancel
                            </button>
                          </>
                        )}
                        {activeTab === 'past' && (
                          <button
                            onClick={() => navigate(`/movies/${booking.movie?._id}`)}
                            className='flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dull rounded-lg transition text-sm'
                          >
                            <Star className='w-4 h-4' />
                            Rate Movie
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center py-20'>
            <div className='w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Ticket className='w-12 h-12 text-gray-500' />
            </div>
            <h3 className='text-xl font-semibold mb-2'>
              {activeTab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
            </h3>
            <p className='text-gray-400 mb-6'>
              {activeTab === 'upcoming' 
                ? 'You don\'t have any upcoming movie bookings.' 
                : 'You haven\'t watched any movies yet.'}
            </p>
            <button
              onClick={() => navigate('/movies')}
              className='px-6 py-3 bg-primary hover:bg-primary-dull rounded-lg font-medium transition'
            >
              Browse Movies
            </button>
          </div>
        )}

        {/* Ticket Modal */}
        {showTicketModal && (
          <div className='fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
            <div className='relative max-w-md w-full max-h-[90vh] overflow-y-auto'>
              <button
                onClick={() => setShowTicketModal(false)}
                className='absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full transition'
              >
                <X className='w-6 h-6' />
              </button>
              
              {ticketLoading ? (
                <div className='flex justify-center py-12'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
                </div>
              ) : selectedTicket ? (
                <TicketCard 
                  ticket={selectedTicket} 
                  bookingId={selectedTicket.bookingId}
                />
              ) : (
                <div className='text-center py-12 bg-white/5 rounded-2xl'>
                  <p className='text-gray-400'>Failed to load ticket</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyBookings