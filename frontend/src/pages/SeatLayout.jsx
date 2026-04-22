import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@clerk/react'
import { showAPI } from '../services/api'
import { socketService } from '../services/socket'
import BlurCircle from '../Component/BlurCircle'
import Loading from '../Component/Loading'
import { Armchair, Check, Info, Monitor, X, Lock, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const SeatLayout = () => {
  const { showId } = useParams()
  const navigate = useNavigate()
  const { userId, isSignedIn } = useAuth()

  // Core data states
  const [show, setShow] = useState(null)
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)

  // Seat selection states
  const [selectedSeats, setSelectedSeats] = useState([])
  const [occupiedSeats, setOccupiedSeats] = useState([])
  const [lockedSeats, setLockedSeats] = useState({})
  const [myLockedSeats, setMyLockedSeats] = useState([])
  const [lockExpiry, setLockExpiry] = useState({})
  const [countdowns, setCountdowns] = useState({})

  // UI states
  const [socketConnected, setSocketConnected] = useState(false)

  // Constants
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const seatsPerRow = 10
  const LOCK_DURATION = 5 * 60 // 5 minutes in seconds

  // Use refs for cleanup to avoid stale closures
  const myLockedSeatsRef = useRef(myLockedSeats)
  const showIdRef = useRef(showId)
  const userIdRef = useRef(userId)

  // Keep refs in sync
  useEffect(() => { myLockedSeatsRef.current = myLockedSeats }, [myLockedSeats])
  useEffect(() => { showIdRef.current = showId }, [showId])
  useEffect(() => { userIdRef.current = userId }, [userId])

  // Reset all seat-related state when showId changes
  const resetSeatState = useCallback(() => {
    setSelectedSeats([])
    setOccupiedSeats([])
    setLockedSeats({})
    setMyLockedSeats([])
    setLockExpiry({})
    setCountdowns({})
  }, [])

  // Fetch show data by showId
  const fetchShowData = useCallback(async () => {
    if (!showId) return

    try {
      setLoading(true)
      resetSeatState()

      const response = await showAPI.getShow(showId)
      const showData = response.data.show

      if (!showData) {
        toast.error('Show not found')
        navigate('/movies')
        return
      }

      setShow(showData)
      setMovie(showData.movie)

      // Set occupied seats from show data
      const occupied = Object.keys(showData.occupiedSeats || {})
      setOccupiedSeats(occupied)

      // Set locked seats from show data (excluding current user's locks)
      const serverLocked = showData.lockedSeats || {}
      const otherLocked = {}
      Object.entries(serverLocked).forEach(([seat, lockData]) => {
        if (lockData.userId !== userId) {
          otherLocked[seat] = lockData
        }
      })
      setLockedSeats(otherLocked)

    } catch (error) {
      console.error('Error fetching show data:', error)
      toast.error('Failed to load show data')
      navigate('/movies')
    } finally {
      setLoading(false)
    }
  }, [showId, userId, navigate, resetSeatState])

  // Initial data fetch - runs when showId changes
  useEffect(() => {
    if (!isSignedIn || !userId) {
      toast.error('Please sign in to book seats')
      navigate('/')
      return
    }

    fetchShowData()
  }, [showId, isSignedIn, userId, navigate, fetchShowData])

  // Socket.IO connection and event handlers
  useEffect(() => {
    if (!isSignedIn || !userId || !showId) return

    // Connect to socket
    const socket = socketService.connect()
    setSocketConnected(socket.connected)

    socket.on('connect', () => setSocketConnected(true))
    socket.on('disconnect', () => setSocketConnected(false))

    // Listen for seat status updates
    socketService.onSeatStatus((data) => {
      setOccupiedSeats(Object.keys(data.occupiedSeats || {}))
      setLockedSeats(data.lockedSeats || {})
    })

    // Listen for seats locked by current user
    socketService.onSeatsLocked((data) => {
      if (data.success) {
        setMyLockedSeats(prev => [...new Set([...prev, ...data.lockedSeats])])

        // Update lock expiry times
        setLockExpiry(prev => {
          const newExpiry = { ...prev }
          data.lockedSeats.forEach(seat => {
            newExpiry[seat] = new Date(data.expiresAt[seat]).getTime()
          })
          return newExpiry
        })

        if (data.failedSeats?.length > 0) {
          data.failedSeats.forEach(failed => {
            toast.error(`Seat ${failed.seatNumber} is ${failed.reason === 'already_booked' ? 'already booked' : 'locked by another user'}`)
          })
        }
      }
    })

    // Listen for seats locked by other users
    socketService.onSeatsLockedByOther((data) => {
      setLockedSeats(prev => ({
        ...prev,
        ...data.seats.reduce((acc, seat) => {
          acc[seat] = { expiresAt: data.expiresAt[seat] }
          return acc
        }, {})
      }))
    })

    // Listen for seats unlocked by current user
    socketService.onSeatsUnlocked((data) => {
      if (data.success) {
        setMyLockedSeats(prev => prev.filter(s => !data.unlockedSeats.includes(s)))
        setSelectedSeats(prev => prev.filter(s => !data.unlockedSeats.includes(s)))

        // Remove expiry times
        setLockExpiry(prev => {
          const updated = { ...prev }
          data.unlockedSeats.forEach(seat => delete updated[seat])
          return updated
        })
      }
    })

    // Listen for seats unlocked by other users
    socketService.onSeatsUnlockedByOther((data) => {
      setLockedSeats(prev => {
        const updated = { ...prev }
        data.seats.forEach(seat => delete updated[seat])
        return updated
      })
    })

    // Listen for completed bookings
    socketService.onSeatsBooked((data) => {
      setOccupiedSeats(prev => [...new Set([...prev, ...data.seats])])
      setLockedSeats(prev => {
        const updated = { ...prev }
        data.seats.forEach(seat => delete updated[seat])
        return updated
      })
      setMyLockedSeats(prev => prev.filter(s => !data.seats.includes(s)))
      setSelectedSeats(prev => prev.filter(s => !data.seats.includes(s)))
    })

    socketService.onError((error) => {
      toast.error(error.message || 'An error occurred')
    })

    return () => {
      // Unlock all seats when leaving - use refs to get latest values
      const currentLocked = myLockedSeatsRef.current
      const currentShowId = showIdRef.current
      const currentUserId = userIdRef.current

      if (currentLocked.length > 0 && currentShowId && currentUserId) {
        socketService.unlockSeats(currentShowId, currentLocked, currentUserId)
      }
      socketService.disconnect()
    }
  }, [isSignedIn, userId, showId])

  // Join show room when showId changes
  useEffect(() => {
    if (showId && userId) {
      socketService.joinShow(showId, userId)
    }
  }, [showId, userId])

  // Countdown timer for locked seats
  useEffect(() => {
    if (Object.keys(lockExpiry).length === 0) return

    const interval = setInterval(() => {
      const now = Date.now()
      const newCountdowns = {}

      Object.entries(lockExpiry).forEach(([seat, expiry]) => {
        const remaining = Math.max(0, Math.ceil((expiry - now) / 1000))
        newCountdowns[seat] = remaining

        // Auto-remove expired locks
        if (remaining === 0) {
          setMyLockedSeats(prev => prev.filter(s => s !== seat))
          setSelectedSeats(prev => prev.filter(s => s !== seat))
          setLockExpiry(prev => {
            const updated = { ...prev }
            delete updated[seat]
            return updated
          })
        }
      })

      setCountdowns(newCountdowns)
    }, 1000)

    return () => clearInterval(interval)
  }, [lockExpiry])

  const handleSeatClick = (seatId) => {
    // Check if seat is occupied (booked)
    if (occupiedSeats.includes(seatId)) {
      toast.error('This seat is already booked')
      return
    }

    // Check if seat is locked by another user
    if (lockedSeats[seatId] && !myLockedSeats.includes(seatId)) {
      toast.error('This seat is being held by another user')
      return
    }

    if (selectedSeats.includes(seatId)) {
      // Deselect and unlock
      const newSelected = selectedSeats.filter(seat => seat !== seatId)
      setSelectedSeats(newSelected)

      // Unlock the seat via socket
      if (myLockedSeats.includes(seatId) && showId && userId) {
        socketService.unlockSeats(showId, [seatId], userId)
      }
    } else {
      if (selectedSeats.length >= 8) {
        toast.error('You can only book up to 8 seats at a time')
        return
      }

      // Select and lock via socket
      setSelectedSeats(prev => [...prev, seatId])
      if (showId && userId) {
        socketService.lockSeats(showId, [seatId], userId)
      }
    }
  }

  const getSeatStatus = (seatId) => {
    if (occupiedSeats.includes(seatId)) return 'occupied'
    if (selectedSeats.includes(seatId)) return 'selected'
    if (lockedSeats[seatId]) {
      // Check if it's locked by current user
      if (myLockedSeats.includes(seatId)) return 'selected'
      return 'locked'
    }
    return 'available'
  }

  const getSeatColor = (status) => {
    switch (status) {
      case 'occupied':
        return 'bg-red-600 cursor-not-allowed text-white'
      case 'selected':
        return 'bg-primary text-white shadow-lg shadow-primary/50'
      case 'locked':
        return 'bg-amber-500 cursor-not-allowed text-white'
      default:
        return 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white cursor-pointer'
    }
  }

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleProceedToPayment = () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat')
      return
    }
    if (!show || !showId) {
      toast.error('Show data not loaded')
      return
    }

    // Verify all selected seats are still locked by current user
    const notLocked = selectedSeats.filter(seat => !myLockedSeats.includes(seat))
    if (notLocked.length > 0) {
      toast.error(`Seats ${notLocked.join(', ')} are no longer held. Please reselect.`)
      setSelectedSeats(prev => prev.filter(s => !notLocked.includes(s)))
      return
    }

    const ticketPrice = show.showPrice || 150
    const totalAmount = selectedSeats.length * ticketPrice

    // Navigate to payment page with booking details
    navigate('/payment', {
      state: {
        movie,
        selectedSeats,
        showTime: show,
        showId,
        date: show.showDateTime,
        ticketPrice,
        totalAmount: totalAmount + 2,
        lockExpiry
      }
    })
  }

  const formatTime = (timeString) => {
    const date = new Date(timeString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading || !movie || !show) return <Loading />

  const ticketPrice = show.showPrice || 150
  const totalAmount = selectedSeats.length * ticketPrice

  return (
    <div className='min-h-screen pt-24 pb-12 px-4 md:px-8 lg:px-16'>
      <BlurCircle top='100px' right='-100px' color='bg-primary/20' size={300} />
      <BlurCircle bottom='100px' left='-100px' color='bg-amber-600/20' size={250} />

      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8'>
          <div>
            <button
              onClick={() => navigate(-1)}
              className='flex items-center gap-2 text-gray-400 hover:text-white transition mb-2'
            >
              <X className='w-5 h-5' />
              Back
            </button>
            <h1 className='text-2xl md:text-3xl font-bold'>{movie.title}</h1>
            <p className='text-gray-400 mt-1'>{movie.lang} {movie.genres && `• ${movie.genres.map(g => g.name).join(', ')}`}</p>
            <p className='text-sm text-primary mt-1'>
              {formatDate(show.showDateTime)} at {formatTime(show.showDateTime)}
            </p>
            <p className='text-sm text-gray-500'>
              {show.theater?.name} • {show.theater?.screen}
            </p>
          </div>

          {/* Connection Status */}
          <div className='flex items-center gap-4'>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
              socketConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              {socketConnected ? 'Live' : 'Offline'}
            </div>
          </div>
        </div>

        <div className='grid lg:grid-cols-3 gap-8'>
          {/* Seat Layout */}
          <div className='lg:col-span-2'>
            <div className='bg-white/5 rounded-2xl p-6 md:p-8'>
              {/* Monitor */}
              <div className='mb-10'>
                <div className='relative'>
                  <div className='h-2 bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full mb-2'></div>
                  <div className='h-16 bg-gradient-to-b from-primary/10 to-transparent rounded-t-3xl mx-8'></div>
                  <p className='text-center text-gray-400 text-sm mt-2 flex items-center justify-center gap-2'>
                    <Monitor className='w-4 h-4' />
                    Monitor
                  </p>
                </div>
              </div>

              {/* Seats */}
              <div className='flex flex-col items-center gap-3'>
                {rows.map((row) => (
                  <div key={row} className='flex items-center gap-2'>
                    <span className='w-6 text-gray-400 font-medium'>{row}</span>
                    <div className='flex gap-2'>
                      {Array.from({ length: seatsPerRow }, (_, i) => {
                        const seatNum = i + 1
                        const seatId = `${row}${seatNum}`
                        const status = getSeatStatus(seatId)
                        const isLockedByMe = myLockedSeats.includes(seatId)
                        const countdown = countdowns[seatId]

                        return (
                          <button
                            key={seatId}
                            onClick={() => handleSeatClick(seatId)}
                            disabled={status === 'occupied' || status === 'locked'}
                            className={`relative w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-200 ${getSeatColor(status)}`}
                            title={seatId}
                          >
                            {/* Seat Number */}
                            <span className={countdown && isLockedByMe ? 'text-[10px]' : ''}>
                              {seatNum}
                            </span>

                            {/* Lock Icon for locked seats by others */}
                            {status === 'locked' && (
                              <Lock className='absolute w-3 h-3 text-white/80' />
                            )}

                            {/* Countdown Timer for my locked seats */}
                            {isLockedByMe && countdown > 0 && (
                              <span className='absolute -top-2 -right-2 bg-primary text-white text-[8px] px-1 py-0.5 rounded-full min-w-[28px]'>
                                {formatCountdown(countdown)}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                    <span className='w-6 text-gray-400 font-medium'>{row}</span>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className='flex flex-wrap justify-center gap-4 md:gap-6 mt-8 pt-6 border-t border-white/10'>
                <div className='flex items-center gap-2'>
                  <div className='w-6 h-6 rounded bg-white/10'></div>
                  <span className='text-sm text-gray-400'>Available</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-6 h-6 rounded bg-primary'></div>
                  <span className='text-sm text-gray-400'>Selected</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-6 h-6 rounded bg-amber-500'></div>
                  <span className='text-sm text-gray-400'>Locked</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-6 h-6 rounded bg-red-600'></div>
                  <span className='text-sm text-gray-400'>Booked</span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Summary */}
          <div className='lg:col-span-1'>
            <div className='bg-white/5 rounded-2xl p-6 sticky top-24'>
              <h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
                <Armchair className='w-5 h-5 text-primary' />
                Booking Summary
              </h2>

              {/* Movie Info */}
              <div className='flex gap-4 mb-6 pb-6 border-b border-white/10'>
                <img
                  src={movie.poster_path}
                  alt={movie.title}
                  className='w-20 h-28 object-cover rounded-lg'
                />
                <div>
                  <h3 className='font-medium line-clamp-2'>{movie.title}</h3>
                  <p className='text-sm text-gray-400 mt-1'>{movie.lang}</p>
                  <p className='text-sm text-gray-400'>{formatDate(show.showDateTime)}</p>
                  <p className='text-sm text-primary mt-1'>{formatTime(show.showDateTime)}</p>
                  <p className='text-xs text-gray-500 mt-1'>{show.theater?.name}</p>
                </div>
              </div>

              {/* Selected Seats */}
              <div className='mb-6'>
                <p className='text-sm text-gray-400 mb-2'>Selected Seats ({selectedSeats.length})</p>
                {selectedSeats.length > 0 ? (
                  <div className='flex flex-wrap gap-2'>
                    {selectedSeats.sort().map(seat => (
                      <span key={seat} className='px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium'>
                        {seat}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className='text-gray-500 text-sm'>No seats selected</p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className='space-y-2 mb-6 pb-6 border-b border-white/10'>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-400'>Ticket Price</span>
                  <span>₹{ticketPrice} x {selectedSeats.length}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-400'>Convenience Fee</span>
                  <span>₹{selectedSeats.length > 0 ? 2 : 0}</span>
                </div>
              </div>

              {/* Total */}
              <div className='flex justify-between items-center mb-6'>
                <span className='text-lg font-semibold'>Total</span>
                <span className='text-2xl font-bold text-primary'>
                  ₹{selectedSeats.length > 0 ? totalAmount + 2 : 0}
                </span>
              </div>

              {/* Info */}
              <div className='flex items-start gap-2 mb-6 p-3 bg-amber-500/10 rounded-lg'>
                <Info className='w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5' />
                <p className='text-xs text-gray-400'>You can select up to 8 seats. Seats will be held for 5 minutes.</p>
              </div>

              {/* Countdown for selected seats */}
              {selectedSeats.length > 0 && Object.keys(countdowns).length > 0 && (
                <div className='mb-6 p-3 bg-primary/10 rounded-lg'>
                  <div className='flex items-center gap-2 text-primary'>
                    <Clock className='w-4 h-4' />
                    <span className='text-sm font-medium'>Time Remaining</span>
                  </div>
                  <p className='text-2xl font-bold text-primary mt-1'>
                    {formatCountdown(Math.min(...Object.values(countdowns).filter(v => v > 0)))}
                  </p>
                  <p className='text-xs text-gray-400 mt-1'>Complete your booking before time runs out</p>
                </div>
              )}

              {/* Proceed Button */}
              <button
                onClick={handleProceedToPayment}
                disabled={selectedSeats.length === 0}
                className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
                  selectedSeats.length > 0
                    ? 'bg-primary hover:bg-primary-dull text-white cursor-pointer'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Check className='w-5 h-5' />
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SeatLayout
