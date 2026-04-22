import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Edit2, Trash2, Calendar, Film } from 'lucide-react'
import { showAPI, movieAPI } from '../services/api'
import toast from 'react-hot-toast'

const AdminShows = () => {
  const [shows, setShows] = useState([])
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMovie, setSelectedMovie] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [showsRes, moviesRes] = await Promise.all([
        showAPI.getAllShows({ limit: 100 }),
        movieAPI.getAllMovies({ limit: 100 })
      ])
      setShows(showsRes.data.shows)
      setMovies(moviesRes.data.movies)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load shows')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this show?')) return
    
    try {
      await showAPI.deleteShow(id)
      toast.success('Show deleted successfully')
      fetchData()
    } catch (error) {
      console.error('Error deleting show:', error)
      toast.error('Failed to delete show')
    }
  }

  const getMovieTitle = (movieId) => {
    const movie = movies.find(m => m._id === movieId)
    return movie?.title || 'Unknown Movie'
  }

  const filteredShows = shows.filter(show => {
    const movieTitle = getMovieTitle(show.movie).toLowerCase()
    const matchesSearch = movieTitle.includes(searchTerm.toLowerCase())
    const matchesMovie = !selectedMovie || show.movie === selectedMovie
    return matchesSearch && matchesMovie
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Shows</h1>
          <p className="text-gray-400 mt-1">Manage movie show times</p>
        </div>
        <Link
          to="/admin/shows/add"
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dull rounded-lg transition text-white font-medium"
        >
          <Plus className="w-5 h-5" />
          Schedule Show
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by movie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={selectedMovie}
          onChange={(e) => setSelectedMovie(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
        >
          <option value="">All Movies</option>
          {movies.map(movie => (
            <option key={movie._id} value={movie._id}>{movie.title}</option>
          ))}
        </select>
      </div>

      {/* Shows Table */}
      {filteredShows.length > 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium">Movie</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium">Date & Time</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium">Theater</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium">Price</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium">Seats</th>
                  <th className="text-right px-6 py-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredShows.map((show) => (
                  <tr key={show._id} className="hover:bg-gray-700/30 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={show.movie?.poster_path || '/default-movie.png'}
                          alt=""
                          className="w-10 h-14 object-cover rounded"
                        />
                        <span className="text-white font-medium">
                          {show.movie?.title || getMovieTitle(show.movie)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white">
                        {new Date(show.showDateTime).toLocaleDateString()}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {new Date(show.showDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white">
                      {show.theater?.name}
                      <div className="text-gray-400 text-sm">{show.theater?.screen}</div>
                    </td>
                    <td className="px-6 py-4 text-white">
                      ${show.showPrice}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white">
                        {show.totalSeats - Object.keys(show.occupiedSeats || {}).length} / {show.totalSeats} available
                      </div>
                      <div className="w-24 h-2 bg-gray-700 rounded-full mt-1">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${(Object.keys(show.occupiedSeats || {}).length / show.totalSeats) * 100}%`
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/shows/edit/${show._id}`}
                          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(show._id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No shows found</h3>
          <p className="text-gray-400 mb-6">
            {searchTerm ? 'Try adjusting your search' : 'Start by scheduling your first show'}
          </p>
          {!searchTerm && (
            <Link
              to="/admin/shows/add"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dull rounded-lg transition text-white font-medium"
            >
              <Plus className="w-5 h-5" />
              Schedule Show
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminShows
