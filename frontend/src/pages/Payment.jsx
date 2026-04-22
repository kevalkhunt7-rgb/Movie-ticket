import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/react'
import { paymentAPI } from '../services/api'
import { socketService } from '../services/socket'
import BlurCircle from '../Component/BlurCircle'
import Loading from '../Component/Loading'
import { ChevronLeft, ShieldCheck, Ticket, MapPin, Clock, Timer, CreditCard, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'

const Payment = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { userId } = useAuth()
  const { user } = useUser()
  const { movie, selectedSeats, showTime, showId, date, ticketPrice, totalAmount, lockExpiry } = location.state || {}

  const [isProcessing, setIsProcessing] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = () => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => setRazorpayLoaded(true)
      script.onerror = () => toast.error('Failed to load payment gateway')
      document.body.appendChild(script)
    }

    if (!window.Razorpay) {
      loadRazorpay()
    } else {
      setRazorpayLoaded(true)
    }
  }, [])

  // Calculate time remaining for lock
  useEffect(() => {
    if (!lockExpiry || Object.keys(lockExpiry).length === 0) return
    
    const minExpiry = Math.min(...Object.values(lockExpiry))
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((minExpiry - Date.now()) / 1000))
      setTimeRemaining(remaining)
      
      if (remaining === 0) {
        clearInterval(interval)
        toast.error('Your seat reservation has expired. Please select seats again.')
        navigate(`/movies`)
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [lockExpiry, navigate])

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Redirect if no booking data
  if (!movie || !selectedSeats || selectedSeats.length === 0) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold mb-4'>No Booking Found</h2>
          <p className='text-gray-400 mb-6'>Please select seats first</p>
          <button
            onClick={() => navigate('/movies')}
            className='px-6 py-3 bg-primary hover:bg-primary-dull rounded-lg font-medium transition'
          >
            Browse Movies
          </button>
        </div>
      </div>
    )
  }

  const handlePayment = async () => {
    if (!razorpayLoaded || !window.Razorpay) {
      toast.error('Payment gateway is loading. Please try again.')
      return
    }

    setIsProcessing(true)

    try {
      // Create order on backend
      const orderRes = await paymentAPI.createOrder({
        showId,
        seats: selectedSeats,
        amount: finalTotal
      })

      const { orderId, amount, currency, keyId } = orderRes.data

      // Razorpay options
      const options = {
        key: keyId,
        amount: amount * 100, // Amount in paise
        currency: currency,
        name: 'ShowFlix',
        description: `Tickets for ${movie.title}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyRes = await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              showId,
              seats: selectedSeats
            })

            const booking = verifyRes.data.booking

            // Notify socket that booking is completed
            if (showId && userId) {
              socketService.connect()
              socketService.bookingCompleted(showId, selectedSeats, userId)
            }

            toast.success('Payment successful!')
            navigate('/booking-confirmation', {
              state: {
                movie,
                selectedSeats,
                showTime,
                date,
                totalAmount,
                bookingId: booking.bookingId,
                bookingDate: booking.createdAt,
                paymentId: response.razorpay_payment_id
              }
            })
          } catch (error) {
            console.error('Payment verification error:', error)
            toast.error(error.response?.data?.message || 'Payment verification failed')
          }
        },
        prefill: {
          name: user?.fullName || '',
          email: user?.primaryEmailAddress?.emailAddress || '',
          contact: user?.primaryPhoneNumber?.phoneNumber || ''
        },
        notes: {
          movie: movie.title,
          seats: selectedSeats.join(', '),
          showId: showId
        },
        theme: {
          color: '#E50914'
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false)
            toast.info('Payment cancelled. Your seats are still reserved.')
          }
        }
      }

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options)
      rzp.open()

      rzp.on('payment.failed', function (response) {
        setIsProcessing(false)
        toast.error(`Payment failed: ${response.error.description}`)
      })

    } catch (error) {
      setIsProcessing(false)
      console.error('Payment error:', error)
      console.error('Error response:', error.response?.data)
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to initiate payment'
      toast.error(errorMsg)
    }
  }

  const formatTime = (timeValue) => {
    // Handle both string dates and Date objects
    const date = new Date(timeValue)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateValue) => {
    const d = new Date(dateValue)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Get show time - compatible with both old and new data shapes
  const showDateTime = showTime?.showDateTime || showTime?.time || date

  const convenienceFee = 2
  const finalTotal = totalAmount + convenienceFee

  return (
    <div className='min-h-screen pt-24 pb-12 px-4 md:px-8 lg:px-16'>
      <BlurCircle top='100px' right='-100px' color='bg-green-500/20' size={300} />
      <BlurCircle bottom='100px' left='-100px' color='bg-primary/20' size={250} />

      <div className='max-w-6xl mx-auto'>
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className='flex items-center gap-2 text-gray-400 hover:text-white transition mb-6'
        >
          <ChevronLeft className='w-5 h-5' />
          Back to Seat Selection
        </button>

        <div className='grid lg:grid-cols-5 gap-8'>
          {/* Payment Section */}
          <div className='lg:col-span-3'>
            <div className='bg-white/5 rounded-2xl p-6 md:p-8'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center'>
                  <Wallet className='w-6 h-6 text-primary' />
                </div>
                <div>
                  <h2 className='text-xl font-semibold'>Secure Payment</h2>
                  <p className='text-gray-400 text-sm'>Pay with Razorpay</p>
                </div>
              </div>

              {/* Security Badge */}
              <div className='flex items-center gap-2 mb-6 p-3 bg-green-500/10 rounded-lg'>
                <ShieldCheck className='w-5 h-5 text-green-500' />
                <span className='text-sm text-green-400'>Your payment is secured with 256-bit SSL encryption</span>
              </div>

              {/* Timer Warning */}
              {timeRemaining > 0 && (
                <div className='flex items-center gap-2 mb-6 p-3 bg-amber-500/10 rounded-lg'>
                  <Timer className='w-5 h-5 text-amber-500' />
                  <div>
                    <span className='text-sm text-amber-400'>Complete payment within </span>
                    <span className='text-sm font-bold text-amber-400'>{formatCountdown(timeRemaining)}</span>
                    <span className='text-sm text-amber-400'> to secure your seats</span>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div className='bg-white/5 rounded-xl p-6 mb-6'>
                <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
                  <CreditCard className='w-5 h-5 text-primary' />
                  Payment Summary
                </h3>
                
                <div className='space-y-3'>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Movie</span>
                    <span className='font-medium'>{movie.title}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Seats</span>
                    <span className='font-medium'>{selectedSeats.join(', ')}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Show Time</span>
                    <span className='font-medium'>{formatTime(showDateTime)}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Date</span>
                    <span className='font-medium'>{formatDate(showDateTime)}</span>
                  </div>
                  <div className='border-t border-white/10 pt-3 mt-3'>
                    <div className='flex justify-between text-lg font-semibold'>
                      <span>Total Amount</span>
                      <span className='text-primary'>₹{finalTotal}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={isProcessing || !razorpayLoaded}
                className='w-full py-4 bg-primary hover:bg-primary-dull disabled:bg-gray-700 rounded-xl font-semibold transition flex items-center justify-center gap-2'
              >
                {isProcessing ? (
                  <>
                    <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className='w-5 h-5' />
                    Pay ₹{finalTotal} with Razorpay
                  </>
                )}
              </button>

              {!razorpayLoaded && (
                <p className='text-center text-sm text-gray-400 mt-4'>
                  Loading payment gateway...
                </p>
              )}

              {/* Supported Methods */}
              <div className='mt-8 pt-6 border-t border-white/10'>
                <p className='text-sm text-gray-400 mb-4'>Supported payment methods</p>
                <div className='flex flex-wrap gap-3'>
                  <span className='px-3 py-1 bg-white/10 rounded text-xs'>UPI</span>
                  <span className='px-3 py-1 bg-white/10 rounded text-xs'>Credit Card</span>
                  <span className='px-3 py-1 bg-white/10 rounded text-xs'>Debit Card</span>
                  <span className='px-3 py-1 bg-white/10 rounded text-xs'>Net Banking</span>
                  <span className='px-3 py-1 bg-white/10 rounded text-xs'>Wallets</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className='lg:col-span-2'>
            <div className='bg-white/5 rounded-2xl p-6 sticky top-24'>
              <h3 className='text-lg font-semibold mb-4'>Order Summary</h3>

              {/* Movie Info */}
              <div className='flex gap-4 mb-6 pb-6 border-b border-white/10'>
                <img
                  src={movie.poster_path}
                  alt={movie.title}
                  className='w-20 h-28 object-cover rounded-lg'
                />
                <div>
                  <h4 className='font-medium line-clamp-2'>{movie.title}</h4>
                  <p className='text-sm text-gray-400 mt-1'>{movie.lang}</p>
                  <div className='flex items-center gap-2 mt-2 text-sm text-gray-400'>
                    <Clock className='w-4 h-4' />
                    {formatTime(showDateTime)}
                  </div>
                  <div className='flex items-center gap-2 mt-1 text-sm text-gray-400'>
                    <MapPin className='w-4 h-4' />
                    {showTime?.theater?.name || 'Cineplex Downtown'}
                  </div>
                </div>
              </div>

              {/* Seats */}
              <div className='mb-6 pb-6 border-b border-white/10'>
                <div className='flex items-center gap-2 mb-2'>
                  <Ticket className='w-4 h-4 text-primary' />
                  <span className='text-sm text-gray-400'>Selected Seats ({selectedSeats.length})</span>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {selectedSeats.sort().map(seat => (
                    <span key={seat} className='px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium'>
                      {seat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className='space-y-2 mb-6'>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-400'>Tickets ({selectedSeats.length}x ₹{ticketPrice})</span>
                  <span>₹{totalAmount}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-400'>Convenience Fee</span>
                  <span>₹{convenienceFee}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-400'>GST</span>
                  <span>Included</span>
                </div>
              </div>

              {/* Total */}
              <div className='flex justify-between items-center pt-4 border-t border-white/10'>
                <span className='text-lg font-semibold'>Total</span>
                <span className='text-2xl font-bold text-primary'>₹{finalTotal}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Payment
