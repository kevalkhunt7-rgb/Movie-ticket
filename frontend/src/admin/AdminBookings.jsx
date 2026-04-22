import React, { useEffect, useState } from 'react'
import { Search, Ticket, CheckCircle, XCircle, Clock, Download } from 'lucide-react'
import { bookingAPI } from '../services/api'
import toast from 'react-hot-toast'

const AdminBookings = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all') // all, confirmed, cancelled, completed
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    confirmedBookings: 0,
    cancelledBookings: 0
  })

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await bookingAPI.getAllBookings({ limit: 100 })
      const allBookings = response.data.bookings || []
      
      setBookings(allBookings)
      
      // Calculate stats
      const totalRevenue = allBookings.reduce((sum, b) => 
        b.paymentStatus === 'completed' ? sum + b.totalAmount : sum, 0
      )
      setStats({
        totalBookings: response.data.total || allBookings.length,
        totalRevenue,
        confirmedBookings: allBookings.filter(b => b.bookingStatus === 'confirmed').length,
        cancelledBookings: allBookings.filter(b => b.bookingStatus === 'cancelled').length
      })
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return
    
    try {
      await bookingAPI.cancelBooking(id)
      toast.success('Booking cancelled')
      fetchBookings()
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast.error('Failed to cancel booking')
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.movie?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.bookingId?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || booking.bookingStatus === filter
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Bookings</h1>
        <p className="text-gray-400 mt-1">Manage all movie bookings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Bookings</p>
          <p className="text-2xl font-bold text-white">{stats.totalBookings}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Revenue</p>
          <p className="text-2xl font-bold text-green-400">₹{stats.totalRevenue}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Confirmed</p>
          <p className="text-2xl font-bold text-blue-400">{stats.confirmedBookings}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Cancelled</p>
          <p className="text-2xl font-bold text-red-400">{stats.cancelledBookings}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by movie, user, or booking ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
        >
          <option value="all">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Bookings Table */}
      {filteredBookings.length > 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium">Booking ID</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium">Movie</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium">User</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium">Seats</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium">Amount</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium">Status</th>
                  <th className="text-right px-6 py-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-700/30 transition">
                    <td className="px-6 py-4">
                      <span className="text-primary font-medium">#{booking.bookingId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={booking.movie?.poster_path}
                          alt=""
                          className="w-10 h-14 object-cover rounded"
                        />
                        <div>
                          <p className="text-white font-medium">{booking.movie?.title}</p>
                          <p className="text-gray-400 text-sm">
                            {new Date(booking.show?.showDateTime).toLocaleDateString()} at{' '}
                            {new Date(booking.show?.showDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white">{booking.user?.name}</p>
                      <p className="text-gray-400 text-sm">{booking.user?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-white">
                      {booking.bookedSeats?.join(', ')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">${booking.totalAmount}</p>
                      <p className="text-gray-400 text-sm">{booking.paymentStatus}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                        booking.bookingStatus === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                        booking.bookingStatus === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {booking.bookingStatus === 'confirmed' && <CheckCircle className="w-4 h-4" />}
                        {booking.bookingStatus === 'completed' && <CheckCircle className="w-4 h-4" />}
                        {booking.bookingStatus === 'cancelled' && <XCircle className="w-4 h-4" />}
                        {booking.bookingStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                          title="Download Ticket"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {booking.bookingStatus === 'confirmed' && (
                          <button
                            onClick={() => handleCancel(booking._id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
                            title="Cancel Booking"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <Ticket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No bookings found</h3>
          <p className="text-gray-400">
            {searchTerm ? 'Try adjusting your search' : 'No bookings have been made yet'}
          </p>
        </div>
      )}
    </div>
  )
}

export default AdminBookings
