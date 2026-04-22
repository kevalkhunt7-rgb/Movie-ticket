import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, X, Clock } from 'lucide-react'
import { showAPI, movieAPI } from '../services/api'
import toast from 'react-hot-toast'

const ShowForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState({
    movie: '',
    showDateTime: '',
    showPrice: 150,
    theater: {
      name: 'Cineplex Downtown',
      screen: 'Screen 1',
      address: ''
    },
    totalSeats: 80
  })
  
  // For multiple shows
  const [showTimes, setShowTimes] = useState([
    { id: 1, showDateTime: '', showPrice: 150 }
  ])
  const [isMultipleMode, setIsMultipleMode] = useState(false)
  const [addMoreShows, setAddMoreShows] = useState(false)
  
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)

  useEffect(() => {
    fetchMovies()
    if (isEdit) {
      fetchShow()
    }
  }, [id])

  const fetchMovies = async () => {
    try {
      const response = await movieAPI.getAllMovies({ status: 'now_showing' })
      setMovies(response.data.movies)
    } catch (error) {
      console.error('Error fetching movies:', error)
    }
  }

  const fetchShow = async () => {
    try {
      setFetchLoading(true)
      const response = await showAPI.getShow(id)
      const show = response.data.show
      setFormData({
        movie: show.movie._id || show.movie,
        showDateTime: new Date(show.showDateTime).toISOString().slice(0, 16),
        showPrice: show.showPrice,
        theater: show.theater,
        totalSeats: show.totalSeats
      })
    } catch (error) {
      console.error('Error fetching show:', error)
      toast.error('Failed to load show')
      navigate('/admin/shows')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    if (name.startsWith('theater.')) {
      const theaterField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        theater: {
          ...prev.theater,
          [theaterField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value
      }))
    }
  }

  // Multiple show times handlers
  const addShowTime = () => {
    setShowTimes(prev => [
      ...prev,
      { 
        id: Date.now(), 
        showDateTime: '', 
        showPrice: formData.showPrice 
      }
    ])
  }

  const removeShowTime = (id) => {
    if (showTimes.length === 1) {
      toast.error('At least one show time is required')
      return
    }
    setShowTimes(prev => prev.filter(st => st.id !== id))
  }

  const updateShowTime = (id, field, value) => {
    setShowTimes(prev => prev.map(st => 
      st.id === id ? { ...st, [field]: value } : st
    ))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.movie) {
      toast.error('Please select a movie')
      return
    }

    try {
      setLoading(true)
      
      if (isEdit) {
        // Update existing show
        if (!formData.showDateTime) {
          toast.error('Please fill in all required fields')
          setLoading(false)
          return
        }
        await showAPI.updateShow(id, formData)
        toast.success('Show updated successfully')
        
        // Also create additional shows if enabled
        if (addMoreShows) {
          const validShows = showTimes.filter(st => st.showDateTime)
          if (validShows.length > 0) {
            let successCount = 0
            let errorCount = 0

            for (const showTime of validShows) {
              try {
                await showAPI.createShow({
                  movie: formData.movie,
                  showDateTime: showTime.showDateTime,
                  showPrice: showTime.showPrice,
                  theater: formData.theater,
                  totalSeats: formData.totalSeats
                })
                successCount++
              } catch (error) {
                console.error('Error creating show:', error)
                errorCount++
              }
            }

            if (successCount > 0) {
              toast.success(`${successCount} additional shows scheduled!`)
            }
            if (errorCount > 0) {
              toast.error(`${errorCount} additional shows failed`)
            }
          }
        }
        
        navigate('/admin/shows')
      } else {
        // Create multiple shows
        if (isMultipleMode) {
          // Validate all show times
          const validShows = showTimes.filter(st => st.showDateTime)
          if (validShows.length === 0) {
            toast.error('Please add at least one show time')
            setLoading(false)
            return
          }

          let successCount = 0
          let errorCount = 0

          for (const showTime of validShows) {
            try {
              await showAPI.createShow({
                movie: formData.movie,
                showDateTime: showTime.showDateTime,
                showPrice: showTime.showPrice,
                theater: formData.theater,
                totalSeats: formData.totalSeats
              })
              successCount++
            } catch (error) {
              console.error('Error creating show:', error)
              errorCount++
            }
          }

          if (successCount > 0) {
            toast.success(`${successCount} shows scheduled successfully!`)
          }
          if (errorCount > 0) {
            toast.error(`${errorCount} shows failed to schedule`)
          }
          
          navigate('/admin/shows')
        } else {
          // Single show
          if (!formData.showDateTime) {
            toast.error('Please fill in all required fields')
            setLoading(false)
            return
          }
          await showAPI.createShow(formData)
          toast.success('Show scheduled successfully')
          navigate('/admin/shows')
        }
      }
    } catch (error) {
      console.error('Error saving show:', error)
      toast.error(error.response?.data?.message || 'Failed to save show')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/admin/shows')}
          className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold text-white">
          {isEdit ? 'Edit Show' : 'Schedule New Show'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Movie Selection */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Movie</h2>
          <div>
            <label className="block text-gray-400 text-sm mb-2">Select Movie *</label>
            <select
              name="movie"
              value={formData.movie}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
              required
            >
              <option value="">Choose a movie...</option>
              {movies.map(movie => (
                <option key={movie._id} value={movie._id}>{movie.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Show Details */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Show Details</h2>
            {!isEdit && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  {isMultipleMode ? 'Multiple Shows' : 'Single Show'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsMultipleMode(!isMultipleMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    isMultipleMode ? 'bg-primary' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      isMultipleMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )}
          </div>

          {/* Single Show Mode */}
          {(!isMultipleMode || isEdit) && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Date & Time *</label>
                  <input
                    type="datetime-local"
                    name="showDateTime"
                    value={formData.showDateTime}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Ticket Price (₹) *</label>
                  <input
                    type="number"
                    name="showPrice"
                    value={formData.showPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Total Seats</label>
                  <input
                    type="number"
                    name="totalSeats"
                    value={formData.totalSeats}
                    onChange={handleChange}
                    min="1"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Add More Shows Toggle (Edit Mode Only) */}
              {isEdit && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Add More Shows</h3>
                      <p className="text-sm text-gray-400">Schedule additional show times for this movie</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddMoreShows(!addMoreShows)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        addMoreShows ? 'bg-primary' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          addMoreShows ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Multiple Shows Mode */}
          {(isMultipleMode && !isEdit) || (isEdit && addMoreShows) && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400 mb-4">
                Add multiple show times for the same movie. Each show will be created with the same theater and seat configuration.
              </p>
              
              {showTimes.map((showTime, index) => (
                <div 
                  key={showTime.id}
                  className="bg-gray-900 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Show {index + 1}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeShowTime(showTime.id)}
                      className="p-1 hover:bg-red-500/20 text-red-400 rounded transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={showTime.showDateTime}
                        onChange={(e) => updateShowTime(showTime.id, 'showDateTime', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Ticket Price (₹) *</label>
                      <input
                        type="number"
                        value={showTime.showPrice}
                        onChange={(e) => updateShowTime(showTime.id, 'showPrice', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addShowTime}
                className="w-full py-3 border-2 border-dashed border-gray-600 hover:border-primary text-gray-400 hover:text-primary rounded-lg transition flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Another Show Time
              </button>

              {/* Common settings for multiple shows */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-700">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Total Seats (for all shows)</label>
                  <input
                    type="number"
                    name="totalSeats"
                    value={formData.totalSeats}
                    onChange={handleChange}
                    min="1"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Default Price</label>
                  <input
                    type="number"
                    value={formData.showPrice}
                    onChange={(e) => {
                      const price = parseFloat(e.target.value) || 0
                      setFormData(prev => ({ ...prev, showPrice: price }))
                      setShowTimes(prev => prev.map(st => ({ ...st, showPrice: price })))
                    }}
                    min="0"
                    step="0.01"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Theater Info */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Theater Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Theater Name</label>
              <input
                type="text"
                name="theater.name"
                value={formData.theater.name}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Screen</label>
              <input
                type="text"
                name="theater.screen"
                value={formData.theater.screen}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-400 text-sm mb-2">Address</label>
              <input
                type="text"
                name="theater.address"
                value={formData.theater.address}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-4 bg-primary hover:bg-primary-dull disabled:bg-gray-700 rounded-lg text-white font-semibold transition"
          >
            {loading 
              ? (isMultipleMode && !isEdit) || (isEdit && addMoreShows)
                ? 'Scheduling Shows...' 
                : 'Saving...'
              : isEdit 
                ? addMoreShows && showTimes.some(st => st.showDateTime)
                  ? `Update & Add ${showTimes.filter(st => st.showDateTime).length} Shows`
                  : 'Update Show'
                : isMultipleMode 
                  ? `Schedule ${showTimes.filter(st => st.showDateTime).length} Shows`
                  : 'Schedule Show'
            }
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/shows')}
            className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-semibold transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default ShowForm
