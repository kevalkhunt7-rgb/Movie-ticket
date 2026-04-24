import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@clerk/react'
import { showAPI } from '../services/api'
import { socketService } from '../services/socket'
import Loading from '../Component/Loading'
import { Armchair, Check, Info, X, Lock, Clock, ChevronLeft, Wifi, WifiOff } from 'lucide-react'
import toast from 'react-hot-toast'

const SeatLayout = () => {
  const { showId } = useParams()
  const navigate = useNavigate()
  const { userId, isSignedIn } = useAuth()

  const [show, setShow] = useState(null)
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [occupiedSeats, setOccupiedSeats] = useState([])
  const [lockedSeats, setLockedSeats] = useState({})
  const [myLockedSeats, setMyLockedSeats] = useState([])
  const [lockExpiry, setLockExpiry] = useState({})
  const [countdowns, setCountdowns] = useState({})
  const [socketConnected, setSocketConnected] = useState(false)

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const seatsPerRow = 10

  const myLockedSeatsRef = useRef(myLockedSeats)
  const showIdRef = useRef(showId)
  const userIdRef = useRef(userId)

  useEffect(() => { myLockedSeatsRef.current = myLockedSeats }, [myLockedSeats])
  useEffect(() => { showIdRef.current = showId }, [showId])
  useEffect(() => { userIdRef.current = userId }, [userId])

  const resetSeatState = useCallback(() => {
    setSelectedSeats([])
    setOccupiedSeats([])
    setLockedSeats({})
    setMyLockedSeats([])
    setLockExpiry({})
    setCountdowns({})
  }, [])

  const fetchShowData = useCallback(async () => {
    if (!showId) return
    try {
      setLoading(true)
      resetSeatState()
      const response = await showAPI.getShow(showId)
      const showData = response.data.show
      if (!showData) { toast.error('Show not found'); navigate('/movies'); return }
      setShow(showData)
      setMovie(showData.movie)
      const occupied = Object.keys(showData.occupiedSeats || {})
      setOccupiedSeats(occupied)
      const serverLocked = showData.lockedSeats || {}
      const otherLocked = {}
      Object.entries(serverLocked).forEach(([seat, lockData]) => {
        if (lockData.userId !== userId) otherLocked[seat] = lockData
      })
      setLockedSeats(otherLocked)
    } catch (error) {
      toast.error('Failed to load show data')
      navigate('/movies')
    } finally {
      setLoading(false)
    }
  }, [showId, userId, navigate, resetSeatState])

  useEffect(() => {
    if (!isSignedIn || !userId) { toast.error('Please sign in to book seats'); navigate('/'); return }
    fetchShowData()
  }, [showId, isSignedIn, userId, navigate, fetchShowData])

  useEffect(() => {
    if (!isSignedIn || !userId || !showId) return
    const socket = socketService.connect()
    setSocketConnected(socket.connected)
    socket.on('connect', () => setSocketConnected(true))
    socket.on('disconnect', () => setSocketConnected(false))
    socketService.onSeatStatus((data) => {
      setOccupiedSeats(Object.keys(data.occupiedSeats || {}))
      setLockedSeats(data.lockedSeats || {})
    })
    socketService.onSeatsLocked((data) => {
      if (data.success) {
        setMyLockedSeats(prev => [...new Set([...prev, ...data.lockedSeats])])
        setLockExpiry(prev => {
          const newExpiry = { ...prev }
          data.lockedSeats.forEach(seat => { newExpiry[seat] = new Date(data.expiresAt[seat]).getTime() })
          return newExpiry
        })
        if (data.failedSeats?.length > 0) {
          data.failedSeats.forEach(failed => toast.error(`Seat ${failed.seatNumber} is ${failed.reason === 'already_booked' ? 'already booked' : 'locked by another user'}`))
        }
      }
    })
    socketService.onSeatsLockedByOther((data) => {
      setLockedSeats(prev => ({ ...prev, ...data.seats.reduce((acc, seat) => { acc[seat] = { expiresAt: data.expiresAt[seat] }; return acc }, {}) }))
    })
    socketService.onSeatsUnlocked((data) => {
      if (data.success) {
        setMyLockedSeats(prev => prev.filter(s => !data.unlockedSeats.includes(s)))
        setSelectedSeats(prev => prev.filter(s => !data.unlockedSeats.includes(s)))
        setLockExpiry(prev => { const u = { ...prev }; data.unlockedSeats.forEach(seat => delete u[seat]); return u })
      }
    })
    socketService.onSeatsUnlockedByOther((data) => {
      setLockedSeats(prev => { const u = { ...prev }; data.seats.forEach(seat => delete u[seat]); return u })
    })
    socketService.onSeatsBooked((data) => {
      setOccupiedSeats(prev => [...new Set([...prev, ...data.seats])])
      setLockedSeats(prev => { const u = { ...prev }; data.seats.forEach(seat => delete u[seat]); return u })
      setMyLockedSeats(prev => prev.filter(s => !data.seats.includes(s)))
      setSelectedSeats(prev => prev.filter(s => !data.seats.includes(s)))
    })
    socketService.onError((error) => toast.error(error.message || 'An error occurred'))
    return () => {
      const currentLocked = myLockedSeatsRef.current
      if (currentLocked.length > 0 && showIdRef.current && userIdRef.current) {
        socketService.unlockSeats(showIdRef.current, currentLocked, userIdRef.current)
      }
      socketService.disconnect()
    }
  }, [isSignedIn, userId, showId])

  useEffect(() => {
    if (showId && userId) socketService.joinShow(showId, userId)
  }, [showId, userId])

  useEffect(() => {
    if (Object.keys(lockExpiry).length === 0) return
    const interval = setInterval(() => {
      const now = Date.now()
      const newCountdowns = {}
      Object.entries(lockExpiry).forEach(([seat, expiry]) => {
        const remaining = Math.max(0, Math.ceil((expiry - now) / 1000))
        newCountdowns[seat] = remaining
        if (remaining === 0) {
          setMyLockedSeats(prev => prev.filter(s => s !== seat))
          setSelectedSeats(prev => prev.filter(s => s !== seat))
          setLockExpiry(prev => { const u = { ...prev }; delete u[seat]; return u })
        }
      })
      setCountdowns(newCountdowns)
    }, 1000)
    return () => clearInterval(interval)
  }, [lockExpiry])

  const handleSeatClick = (seatId) => {
    if (occupiedSeats.includes(seatId)) { toast.error('This seat is already booked'); return }
    if (lockedSeats[seatId] && !myLockedSeats.includes(seatId)) { toast.error('This seat is being held by another user'); return }
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(seat => seat !== seatId))
      if (myLockedSeats.includes(seatId) && showId && userId) socketService.unlockSeats(showId, [seatId], userId)
    } else {
      if (selectedSeats.length >= 8) { toast.error('You can only book up to 8 seats at a time'); return }
      setSelectedSeats(prev => [...prev, seatId])
      if (showId && userId) socketService.lockSeats(showId, [seatId], userId)
    }
  }

  const getSeatStatus = (seatId) => {
    if (occupiedSeats.includes(seatId)) return 'occupied'
    if (selectedSeats.includes(seatId)) return 'selected'
    if (lockedSeats[seatId]) {
      if (myLockedSeats.includes(seatId)) return 'selected'
      return 'locked'
    }
    return 'available'
  }

  const getSeatStyle = (status) => {
    switch (status) {
      case 'occupied': return 'bg-red-900/60 border border-red-800/50 cursor-not-allowed text-red-700'
      case 'selected': return 'bg-primary border border-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)] cursor-pointer text-white scale-105'
      case 'locked':   return 'bg-amber-900/40 border border-amber-700/50 cursor-not-allowed text-amber-700'
      default:         return 'bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-primary/10 hover:text-white cursor-pointer text-white/40 transition-all duration-150'
    }
  }

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleProceedToPayment = () => {
    if (selectedSeats.length === 0) { toast.error('Please select at least one seat'); return }
    if (!show || !showId) { toast.error('Show data not loaded'); return }
    const notLocked = selectedSeats.filter(seat => !myLockedSeats.includes(seat))
    if (notLocked.length > 0) {
      toast.error(`Seats ${notLocked.join(', ')} are no longer held. Please reselect.`)
      setSelectedSeats(prev => prev.filter(s => !notLocked.includes(s)))
      return
    }
    const ticketPrice = show.showPrice || 150
    const totalAmount = selectedSeats.length * ticketPrice
    navigate('/payment', {
      state: { movie, selectedSeats, showTime: show, showId, date: show.showDateTime, ticketPrice, totalAmount: totalAmount + 2, lockExpiry }
    })
  }

  const formatTime  = (t) => new Date(t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const formatDate  = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  if (loading || !movie || !show) return <Loading />

  const ticketPrice      = show.showPrice || 150
  const totalAmount      = selectedSeats.length * ticketPrice
  const minCountdown     = Object.values(countdowns).filter(v => v > 0)
  const countdownDisplay = minCountdown.length > 0 ? Math.min(...minCountdown) : null

  return (
    /*
     * FIX 1: Remove overflow-hidden from root — it can trap sticky children.
     *         Use overflow-x-clip instead to cut horizontal bleed only.
     */
    <div className="min-h-screen pt-20 pb-16 px-4 md:px-8 lg:px-12 relative overflow-x-clip">

      {/* Background atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[350px] bg-amber-600/5 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-1.5 text-white/30 hover:text-white/80 transition-colors duration-200 mb-3 text-sm"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back
            </button>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white truncate">{movie.title}</h1>
            <p className="text-white/40 text-sm mt-1 truncate">
              {movie.lang}
              {movie.genres && <span className="mx-1.5 text-white/20">·</span>}
              {movie.genres?.map(g => g.name).join(', ')}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs font-medium text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                {formatDate(show.showDateTime)} · {formatTime(show.showDateTime)}
              </span>
              <span className="text-xs text-white/30 truncate">{show.theater?.name} · {show.theater?.screen}</span>
            </div>
          </div>

          {/* Live indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium self-start sm:self-auto shrink-0 ${
            socketConnected
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
              : 'bg-red-500/10 border-red-500/25 text-red-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            {socketConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {socketConnected ? 'Live' : 'Offline'}
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Seat Map ── */}
          <div className="lg:col-span-2">
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 md:p-8 backdrop-blur-sm">

              {/* ── Screen ── */}
              <div className="mb-10 select-none">
                <div className="relative flex flex-col items-center">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-6 bg-primary/20 blur-xl rounded-full" />
                  <div className="relative w-full max-w-[540px] mx-auto">
                    <div className="h-[3px] w-full rounded-t-sm bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
                    <div className="h-10 w-full bg-gradient-to-b from-primary/15 via-primary/5 to-transparent rounded-b-xl flex items-center justify-center">
                      <div className="flex gap-6 opacity-20">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="w-px h-5 bg-primary/60 blur-[1px]" />
                        ))}
                      </div>
                    </div>
                    <div className="absolute -bottom-4 left-6 w-[2px] h-4 bg-white/10 rounded" />
                    <div className="absolute -bottom-4 right-6 w-[2px] h-4 bg-white/10 rounded" />
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-20 h-[2px] bg-white/10 rounded-full" />
                  </div>
                  <p className="mt-6 text-[10px] font-semibold tracking-[0.3em] uppercase text-white/20">Screen</p>
                  <div className="mt-1 w-full max-w-[500px] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              </div>

              {/*
               * FIX 2: Seat grid wrapper.
               *
               * OLD: overflow-x-auto  ← creates a scroll container; the wide
               *      row content causes the *page* to shift right on mobile
               *      because the scroll container itself is wider than the
               *      viewport before the user scrolls it.
               *
               * NEW: overflow-x-auto is kept so the seats stay scrollable
               *      within their card, BUT we add w-full + box-border so the
               *      wrapper never exceeds its parent card width.
               *      The key addition is the inner centering div that uses
               *      min-w-max so the row content determines the scroll width
               *      naturally without blowing out the card.
               *
               * Additionally: seat buttons use a CSS clamp size so they shrink
               * gracefully on small viewports instead of forcing a fixed 36px.
               */}
              <div className="w-full overflow-x-auto pb-2 -mx-1 px-1">
                <div className="flex flex-col items-center gap-2 min-w-max mx-auto">
                  {rows.map((row, rowIdx) => (
                    <div key={row} className="flex items-center gap-2" style={{ animationDelay: `${rowIdx * 0.04}s` }}>
                      {/* Row label left */}
                      <span className="w-5 text-center text-[11px] font-medium text-white/25 shrink-0">{row}</span>

                      {/* Seats */}
                      <div className="flex gap-1.5">
                        {Array.from({ length: seatsPerRow }, (_, i) => {
                          const seatNum  = i + 1
                          const seatId   = `${row}${seatNum}`
                          const status   = getSeatStatus(seatId)
                          const isLockedByMe = myLockedSeats.includes(seatId)
                          const countdown    = countdowns[seatId]

                          return (
                            <button
                              key={seatId}
                              onClick={() => handleSeatClick(seatId)}
                              disabled={status === 'occupied' || status === 'locked'}
                              title={seatId}
                              /*
                               * FIX 3: Seat size.
                               * Replace fixed w-7/w-9 with a single responsive
                               * size using CSS clamp via inline style so the
                               * grid can be as compact as needed on small
                               * screens without overflowing its wrapper.
                               */
                              style={{ width: 'clamp(26px, 6vw, 36px)', height: 'clamp(26px, 6vw, 36px)' }}
                              className={`relative rounded-md text-[10px] font-semibold flex items-center justify-center transition-all duration-200 shrink-0 ${getSeatStyle(status)}`}
                            >
                              {status === 'locked'
                                ? <Lock className="w-3 h-3" />
                                : <span>{seatNum}</span>
                              }

                              {/* Countdown badge */}
                              {isLockedByMe && countdown > 0 && (
                                <span className="absolute -top-2 -right-2 bg-primary text-white text-[7px] font-bold px-1 py-0.5 rounded-full leading-none min-w-[26px] text-center shadow-lg">
                                  {formatCountdown(countdown)}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {/* Row label right */}
                      <span className="w-5 text-center text-[11px] font-medium text-white/25 shrink-0">{row}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Legend ── */}
              <div className="mt-8 pt-6 border-t border-white/[0.07] flex flex-wrap justify-center gap-x-6 gap-y-3">
                {[
                  { color: 'bg-white/5 border border-white/10', label: 'Available' },
                  { color: 'bg-primary border border-primary',  label: 'Selected'  },
                  { color: 'bg-amber-900/40 border border-amber-700/50', label: 'Held'   },
                  { color: 'bg-red-900/60 border border-red-800/50',     label: 'Booked' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-md ${color}`} />
                    <span className="text-xs text-white/40">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Booking Summary ── */}
          <div className="lg:col-span-1">
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 md:p-6 sticky top-24 backdrop-blur-sm">

              <div className="flex items-center gap-2 mb-5">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Armchair className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-semibold text-white text-base">Booking Summary</h2>
              </div>

              {/* Movie Info */}
              <div className="flex gap-3 mb-5 pb-5 border-b border-white/[0.07]">
                <img
                  src={movie.poster_path}
                  alt={movie.title}
                  className="w-16 h-22 object-cover rounded-xl shrink-0 shadow-lg"
                />
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-sm line-clamp-2 leading-snug">{movie.title}</h3>
                  <p className="text-white/40 text-xs mt-1">{movie.lang}</p>
                  <p className="text-white/40 text-xs">{formatDate(show.showDateTime)}</p>
                  <p className="text-primary text-xs font-medium mt-1">{formatTime(show.showDateTime)}</p>
                  <p className="text-white/30 text-xs truncate">{show.theater?.name}</p>
                </div>
              </div>

              {/* Selected Seats */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-white/40 uppercase tracking-wider">Selected Seats</p>
                  <span className="text-xs font-semibold text-primary">{selectedSeats.length} / 8</span>
                </div>
                {selectedSeats.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSeats.sort().map(seat => (
                      <span
                        key={seat}
                        onClick={() => handleSeatClick(seat)}
                        className="px-2.5 py-1 bg-primary/15 border border-primary/25 text-primary rounded-lg text-xs font-semibold cursor-pointer hover:bg-primary/25 transition-colors"
                      >
                        {seat}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/20 text-xs italic">Click seats on the map to select</p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 mb-5 pb-5 border-b border-white/[0.07]">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">₹{ticketPrice} × {selectedSeats.length} seats</span>
                  <span className="text-white/70">₹{totalAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Convenience fee</span>
                  <span className="text-white/70">₹{selectedSeats.length > 0 ? 2 : 0}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center mb-5">
                <span className="text-sm font-medium text-white/60">Total Payable</span>
                <span className="text-xl font-bold text-white">₹{selectedSeats.length > 0 ? totalAmount + 2 : 0}</span>
              </div>

              {/* Countdown */}
              {countdownDisplay !== null && selectedSeats.length > 0 && (
                <div className="mb-4 p-3.5 bg-primary/8 border border-primary/15 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/50">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs uppercase tracking-wider">Seats held for</span>
                    </div>
                    <span className="text-lg font-bold text-primary tabular-nums">{formatCountdown(countdownDisplay)}</span>
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000"
                      style={{ width: `${(countdownDisplay / 300) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Info note */}
              <div className="flex items-start gap-2 mb-5 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                <Info className="w-3.5 h-3.5 text-amber-500/70 shrink-0 mt-0.5" />
                <p className="text-[11px] text-white/35 leading-relaxed">Up to 8 seats per booking. Held for 5 minutes.</p>
              </div>

              {/* CTA */}
              <button
                onClick={handleProceedToPayment}
                disabled={selectedSeats.length === 0}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                  selectedSeats.length > 0
                    ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5'
                    : 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                {selectedSeats.length > 0 ? `Pay ₹${totalAmount + 2}` : 'Select Seats'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default SeatLayout