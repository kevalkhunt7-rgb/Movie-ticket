import { ArrowRight } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MovieCard from './MovieCard'
import { movieAPI } from '../services/api'
import Loading from './Loading'
import toast from 'react-hot-toast'

const FeaturedSection = () => {
  const navigate = useNavigate()
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMovies()
  }, [])

  const fetchMovies = async () => {
    try {
      setLoading(true)
      const response = await movieAPI.getAllMovies({
        status: 'now_showing',
        limit: 4,
      })
      setMovies(response.data.movies || [])
    } catch (error) {
      console.error('Error fetching movies:', error)
      toast.error('Failed to load movies')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="w-full overflow-hidden bg-black px-4 py-16">
        <div className="flex justify-center">
          <Loading />
        </div>
      </section>
    )
  }

  return (
    <section className="w-full max-w-full overflow-hidden bg-black px-4 sm:px-6 lg:px-10 py-14">
      <div className="w-full max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10 pb-6 border-b border-yellow-400/20">
          <div>
            <p className="text-yellow-400 text-[10px] uppercase tracking-[0.3em] mb-2">
              In theatres now
            </p>

            <h2 className="text-white text-3xl sm:text-4xl font-serif">
              Now <span className="text-yellow-400 italic">Showing</span>
            </h2>
          </div>

          <button
            onClick={() => navigate('/movies')}
            className="w-fit flex items-center gap-2 border border-yellow-400/30 text-white/70 hover:text-yellow-400 hover:border-yellow-400 px-4 py-2 text-xs uppercase tracking-widest transition"
          >
            View All <ArrowRight size={14} />
          </button>
        </div>

        {/* Movies */}
        {movies.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {movies.map((movie) => (
                <div key={movie._id} className="w-full min-w-0">
                  <MovieCard movie={movie} />
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-10">
              <button
                onClick={() => {
                  navigate('/movies')
                  scrollTo(0, 0)
                }}
                className="border border-yellow-400/50 text-yellow-400 hover:bg-yellow-400 hover:text-black px-6 py-3 text-xs uppercase tracking-widest transition"
              >
                Explore All Films
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-white/50 mb-5">No films currently in theatres</p>

            <button
              onClick={() => navigate('/movies')}
              className="border border-yellow-400/50 text-yellow-400 px-6 py-3 text-xs uppercase tracking-widest"
            >
              Browse Catalogue
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default FeaturedSection