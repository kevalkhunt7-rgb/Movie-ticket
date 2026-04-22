import { ArrowRight } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MovieCard from './MovieCard'
import BlurCircle from './BlurCircle'
import { movieAPI } from '../services/api'
import Loading from './Loading'
import toast from 'react-hot-toast'

const FeturedSection = () => {
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
                limit: 4 
            })
            setMovies(response.data.movies)
        } catch (error) {
            console.error('Error fetching movies:', error)
            toast.error('Failed to load movies')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className='px-6 md:px-16 lg:px-24 xl:px-44 py-20'>
                <div className='flex justify-center'>
                    <Loading />
                </div>
            </div>
        )
    }

    return (
        <div className='px-6 md:px-16 lg:px-24 xl:px-44 overflow-hidden'>
            <div className='relative flex items-center justify-between pt-20 pb-10'>
                <BlurCircle top='0' right='0' />
                <p className='text-gray-300 font-medium text-lg'>Now Showing</p>
                <button onClick={()=>navigate('/movies')} className='group flex items-center gap-2 text-sm text-gray-300 cursor-pointer'>
                    View All <ArrowRight className='group-hover:translate-x-0.5 transition w-4.5 h-4.5 ' />
                </button>
            </div>
            
            {movies.length > 0 ? (
                <>
                    <div className='grid grid-cols-4 max-sm:justify-center gap-9.5 mt-8'>
                        {movies.map((movie) => (
                            <MovieCard key={movie._id} movie={movie} />
                        ))}
                    </div>
                    <div className='flex justify-center mt-20'>
                        <button 
                            onClick={()=>{navigate('/movies');scrollTo(0,0)}} 
                            className='px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer'
                        >
                            Show More
                        </button>
                    </div>
                </>
            ) : (
                <div className='text-center py-20'>
                    <p className='text-gray-400'>No movies currently showing</p>
                    <button 
                        onClick={()=>navigate('/movies')} 
                        className='mt-4 px-6 py-2 bg-primary hover:bg-primary-dull transition rounded-md text-sm'
                    >
                        Browse All Movies
                    </button>
                </div>
            )}
        </div>
    )
}

export default FeturedSection