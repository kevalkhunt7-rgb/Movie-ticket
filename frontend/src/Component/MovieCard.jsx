import { StarIcon, Clock, Calendar, Ticket } from 'lucide-react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TimeFormate from '../lib/TimeFormate'

const MovieCard = ({ movie }) => {
    const navigate = useNavigate()

    return (
        <div
            className='relative ml-4  group overflow-hidden rounded-2xl   cursor-pointer w-70 bg-gradient-to-b from-zinc-900 to-zinc-950 shadow-xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 ease-out border border-white/5 hover:border-white/10 hover:shadow-2xl'
            onClick={() => { navigate(`/movies/${movie._id}`); scrollTo(0, 0) }}
        >
            {/* Poster */}
            <div className='relative overflow-hidden h-72'>
                <img
                    src={movie.backdrop_path}
                    alt={movie.title}
                    className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out'
                />

                {/* Base gradient */}
                <div className='absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent' />

                {/* Hover overlay */}
                <div className='absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center'>
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/movies/${movie._id}`); scrollTo(0, 0) }}
                        className='flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold tracking-wide translate-y-3 group-hover:translate-y-0 transition-transform duration-500 ease-out shadow-lg shadow-red-900/50 cursor-pointer'
                    >
                        <Ticket size={13} />
                        Buy Ticket
                    </button>
                </div>

                {/* Rating badge */}
                <div className='absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10'>
                    <StarIcon size={10} className='text-yellow-400 fill-yellow-400' />
                    <span className='text-yellow-400 text-xs font-bold tracking-wide'>
                        {movie.vote_average?.toFixed(1)}
                    </span>
                </div>
            </div>

            {/* Info */}
            <div className='p-3.5 -mt-1'>
                <h3 className='truncate text-sm font-bold text-white/90 tracking-tight leading-snug mb-2'>
                    {movie.title}
                </h3>

                {/* Genre pills */}
                <div className='flex flex-wrap gap-1 mb-3'>
                    {movie.genres?.slice(0, 2).map(genre => (
                        <span
                            key={genre.name}
                            className='text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-white/40 uppercase tracking-widest'
                        >
                            {genre.name}
                        </span>
                    ))}
                </div>

                {/* Meta row */}
                <div className='flex items-center gap-3 text-[11px] text-white/30 font-medium'>
                    <span className='flex items-center gap-1'>
                        <Calendar size={10} />
                        {new Date(movie.release_date).getFullYear()}
                    </span>
                    <span className='text-white/10'>•</span>
                    <span className='flex items-center gap-1'>
                        <Clock size={10} />
                        {TimeFormate(movie.runtime)}
                    </span>
                </div>
            </div>
        </div>
    )
}

export default MovieCard