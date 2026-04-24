import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { movieAPI, showAPI } from '../services/api'
import BlurCircle from '../Component/BlurCircle'
import { Heart, PlayCircle, StarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import TimeFormate from '../lib/TimeFormate'
import DateSelect from '../Component/DateSelect'
import MovieCard from '../Component/MovieCard'
import Loading from '../Component/Loading'
import toast from 'react-hot-toast'

const MovieDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [show, setShow] = useState(null)
  const [relatedMovies, setRelatedMovies] = useState([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [castSliderPos, setCastSliderPos] = useState(0)
  const [relatedSliderPos, setRelatedSliderPos] = useState(0)

  const getShow = async () => {
    try {
      // Fetch movie details
      const movieRes = await movieAPI.getMovie(id)
      const movie = movieRes.data.movie

      // Fetch shows for this movie
      const showsRes = await showAPI.getShowsByMovie(id)
      const showsByDate = showsRes.data.showsByDate

      setShow({
        movie: movie,
        dateTime: showsByDate
      })

      // Fetch related movies
      const relatedRes = await movieAPI.getAllMovies({ limit: 4 })
      setRelatedMovies(relatedRes.data.movies.filter(m => m._id !== id).slice(0, 4))
    } catch (error) {
      console.error('Error fetching movie:', error)
      toast.error('Failed to load movie details')
    }
  }

  const handleToggleFavorite = async () => {
    try {
      await movieAPI.toggleFavorite(id)
      setIsFavorite(!isFavorite)
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites')
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast.error('Please login to add favorites')
    }
  }

  useEffect(() => {
    getShow()
  }, [id])

  return show ?  (
    <div className='px-6 md:px-16 lg:px-40 pt-30 md:pt-50' >
      <div className='flex flex-col md:flex-row gap-8 max-w-6xl max-auto'>
        <img src={show.movie.poster_path} alt="movie poster" className='max-md:mx-auto rounded-xl h-104 max-w-70 object-cover'/>
        <div className='relative flex flex-col gap-3 '>
          <BlurCircle top='100px' left='100px'  />
          <p className='text-primary'>{show.movie.lang}</p>
          <h1 className='text-4xl  font-semibold max-w-96 text-balance '>{show.movie.title}</h1>
          <div className='flex items-center gap-2 text-gray-300'>
            <StarIcon className='w-5 h-5 text-primary fill-primary'/>
            {show.movie.vote_average.toFixed(1)} User Rating
          </div>
          <p className='text-gray-400 mt-2 text-sm leading-tight max-w-xl'>{show.movie.overview}</p>
          <p>{TimeFormate(show.movie.runtime)} ⦿ {show.movie.genres.map(genre => genre.name).join(", ")} ⦿   {show.movie.release_date.split("-")[0]}</p>
          <div className='flex items-center flex-warap gap-4 mt-4 '>
            <button className='flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-900 transition rounded-md font-medium cursor-pointer active:scale-110' >
              <PlayCircle />
              Watch Trailer</button>
            <a href="#dateSelect">Buy Ticket</a>
            <button 
              onClick={handleToggleFavorite}
              className='bg-gray-700 p-2.5 rounded-full transition cursor-pointer active:scale-110 hover:bg-primary/20'
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
            </button>
          </div>
        </div>
      </div>

 <p className='font-medium text-sm mt-3'>Your Favorite Cast</p>
 {show.movie.casts.length > 0 && (
   <div className='relative mt-8'>
     {/* Cast Slider */}
     <div className='overflow-hidden'>
       <div 
         className='flex items-center gap-4 transition-transform duration-500 ease-in-out'
         style={{ transform: `translateX(-${castSliderPos * 100}px)` }}
       >
         {show.movie.casts.slice(0, 12).map((cast, index) => (
           <div key={index} className='flex flex-col items-center text-center flex-shrink-0 w-24'>
             <img src={cast.profile_path} alt={cast.name} className='rounded-full h-20 md:h-20 aspect-square object-cover' />
             <p className='text-sm mt-2 line-clamp-2'>{cast.name}</p>
           </div>
         ))}
       </div>
     </div>

     {/* Cast Slider Navigation */}
     {show.movie.casts.length > 5 && (
       <div className='flex justify-center gap-2 mt-4'>
         <button 
           onClick={() => setCastSliderPos(Math.max(0, castSliderPos - 1))}
           disabled={castSliderPos === 0}
           className='p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition'
         >
           <ChevronLeft className='w-5 h-5' />
         </button>
         <button 
           onClick={() => setCastSliderPos(Math.min(show.movie.casts.length - 5, castSliderPos + 1))}
           disabled={castSliderPos >= show.movie.casts.length - 5}
           className='p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition'
         >
           <ChevronRight className='w-5 h-5' />
         </button>
       </div>
     )}
   </div>
 )}
   <DateSelect dateTime={show.dateTime} />
   {relatedMovies.length > 0 && (
     <>
       <p className='text-lg font-medium mt-20 mb-8'>You may also Like</p>
       <div className='relative'>
         {/* Related Movies Slider */}
         <div className='overflow-hidden'>
           <div 
             className='grid grid-cols-4 gap-8 transition-transform duration-500 ease-in-out'
             style={{ transform: `translateX(-${relatedSliderPos * 100}%)` }}
           >
             {relatedMovies.map((movie) => (
               <MovieCard key={movie._id} movie={movie}/>
             ))}
           </div>
         </div>

         {/* Related Movies Slider Navigation */}
         {relatedMovies.length > 4 && (
           <div className='flex justify-center gap-2 mt-6'>
             <button 
               onClick={() => setRelatedSliderPos(Math.max(0, relatedSliderPos - 1))}
               disabled={relatedSliderPos === 0}
               className='p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition'
             >
               <ChevronLeft className='w-5 h-5' />
             </button>
             <button 
               onClick={() => setRelatedSliderPos(Math.min(Math.ceil(relatedMovies.length / 4) - 1, relatedSliderPos + 1))}
               disabled={relatedSliderPos >= Math.ceil(relatedMovies.length / 4) - 1}
               className='p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition'
             >
               <ChevronRight className='w-5 h-5' />
             </button>
           </div>
         )}
       </div>
     </>
   )}
   <div className='flex justify-center mt-20'>
      <button onClick={()=>{navigate('/movies'); scrollTo(0,0)}} className='px-10 py-3 text-sm  bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer'>Show More</button>
   </div>
    </div>
  ) : <Loading/>
}

export default MovieDetails