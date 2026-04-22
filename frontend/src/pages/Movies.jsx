import React, { useEffect, useState } from 'react'
import { movieAPI } from '../services/api'
import MovieCard from '../Component/MovieCard'
import BlurCircle from '../Component/BlurCircle'
import Loading from '../Component/Loading'
import toast from 'react-hot-toast'

const Movies = () => {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMovies()
  }, [])

  const fetchMovies = async () => {
    try {
      setLoading(true)
      const response = await movieAPI.getAllMovies({ status: 'now_showing' })
      setMovies(response.data.movies)
    } catch (error) {
      console.error('Error fetching movies:', error)
      toast.error('Failed to load movies')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading />

  return movies.length > 0 ? (
    <div className='relative my-30 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]'>
      <BlurCircle top='150px' left='0px' />
      <BlurCircle bottom='50px' right='50px' />
      <h1 className='text-lg font-medium my-4'>Now Showing</h1>
      <div className='grid grid-cols-3 max-sm:justify-center gap-8'>
        {
          movies.map((movie) => (
            <MovieCard movie={movie} key={movie._id} />
          ))
        }
      </div>
    </div>
  ) : (
    <div className='flex flex-col items-center justify-center h-screen'>
      <h1 className='text-3xl font-bold text-center'>No Movie Available</h1>
    </div>
  )
}

export default Movies