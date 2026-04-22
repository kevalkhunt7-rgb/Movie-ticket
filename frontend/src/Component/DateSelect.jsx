import React, { useState } from 'react'
import BlurCircle from './BlurCircle'
import { ChevronLeftIcon, ChevronRightIcon, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const DateSelect = ({ dateTime }) => {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedShowId, setSelectedShowId] = useState(null)

  const formatTime = (timeString) => {
    const date = new Date(timeString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const onBookhandler = () => {
    if (!selectedShowId) {
      return toast('Please select a show time')
    }
    navigate(`/seat-layout/${selectedShowId}`)
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setSelectedShowId(null)
  }

  const handleTimeSelect = (showId) => {
    setSelectedShowId(showId)
  }

  const sortedDates = dateTime ? Object.keys(dateTime).sort() : []

  return (
    <div id="dateSelect" className="pt-30 px-4">
      <div className="relative p-6 md:p-8 bg-primary/10 border border-primary/20 rounded-2xl overflow-hidden">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle top="100px" left="0px" />

        <p className="text-lg md:text-xl font-semibold mb-6">Choose Date & Time</p>

        {/* Date Selection */}
        <div className="flex items-center justify-center gap-4 md:gap-6 flex-wrap mb-6">
          <button
            type="button"
            className="p-2 rounded-full border border-primary/30 hover:bg-primary/20 transition"
          >
            <ChevronLeftIcon width={24} />
          </button>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:flex md:flex-wrap gap-4">
            {sortedDates.map((date) => (
              <button
                type="button"
                onClick={() => handleDateSelect(date)}
                key={date}
                className={`flex flex-col items-center justify-center h-16 w-16 rounded-lg cursor-pointer transition-all ${
                  selectedDate === date
                    ? 'bg-primary text-white shadow-lg scale-105'
                    : 'border border-primary/70 hover:bg-primary/10'
                }`}
              >
                <span className="text-sm font-semibold">
                  {new Date(date).getDate()}
                </span>
                <span className="text-xs">
                  {new Date(date).toLocaleDateString('en-US', {
                    month: 'short',
                  })}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="p-2 rounded-full border border-primary/30 hover:bg-primary/20 transition"
          >
            <ChevronRightIcon width={24} />
          </button>
        </div>

        {/* Time Selection */}
        {selectedDate && dateTime[selectedDate] && (
          <div className="border-t border-primary/20 pt-6">
            <p className="text-sm font-medium mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Available Shows on {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <div className="flex flex-wrap gap-3">
              {dateTime[selectedDate].map((show) => (
                <button
                  type="button"
                  key={show._id}
                  onClick={() => handleTimeSelect(show._id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedShowId === show._id
                      ? 'bg-primary text-white shadow-lg scale-105'
                      : 'bg-white/5 border border-primary/30 hover:bg-primary/20 text-white'
                  }`}
                >
                  <span className="text-sm">{formatTime(show.time)}</span>
                  <span className="text-xs ml-2 opacity-70">₹{show.showPrice}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onBookhandler}
        disabled={!selectedShowId}
        className={`px-8 py-3 mt-6 rounded-lg font-medium transition-all cursor-pointer ${
          selectedShowId
            ? 'bg-primary text-white hover:bg-primary/90'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
        }`}
      >
        Book Now
      </button>
    </div>
  )
}

export default DateSelect