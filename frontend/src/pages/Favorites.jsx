import React, { useEffect, useState } from 'react'
import { movieAPI } from '../services/api'
import MovieCard from '../Component/MovieCard'
import BlurCircle from '../Component/BlurCircle'
import Loading from '../Component/Loading'
import toast from 'react-hot-toast'

const Favorites = () => {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const response = await movieAPI.getMyFavorites()
      setFavorites(response.data.favorites)
    } catch (error) {
      console.error('Error fetching favorites:', error)
      toast.error('Please login to view favorites')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading />

  return favorites.length > 0 ? (
    <div className='relative my-30 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]'>
      <BlurCircle top='150px' left='0px' />
      <BlurCircle bottom='50px' right='50px' />
      <h1 className='text-lg font-medium my-4'>Your Favourite Movies</h1>
      <div className='flex flex-wrap max-sm:justify-center gap-8'>
        {
          favorites.map((movie) => (
            <MovieCard movie={movie} key={movie._id} />
          ))
        }
      </div>
    </div>
  ) : (
    <div className='flex flex-col items-center justify-center h-screen'>
      <h1 className='text-3xl font-bold text-center'>No Favorite Movies Yet</h1>
      <p className='text-gray-400 mt-2'>Start adding movies to your favorites!</p>
    </div>
  )
}

export default Favorites