import React, { useState } from 'react';
import { dummyTrailers } from '../assets/assets';
import ReactPlayer from 'react-player/lazy';
import BlurCircle from './BlurCircle';
import { PlayCircleIcon } from 'lucide-react'

const TrailerSection = () => {
    const [currentTrailer, setCurrentTrailer] = useState(dummyTrailers[0]);


    const Player = ReactPlayer.default || ReactPlayer;

    return (
        <div className='px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden'>
            <p className='text-gray-300 font-medium text-lg mx-w-[960px] mx-auto'>
                Trailers
            </p>
            <div className='relative mt-6'>
                <BlurCircle top='-100px' right='-100px' />


                {currentTrailer?.videoUrl ? (
                    <div className='mx-auto w-full max-w-[960px] aspect-video'>
                        <Player
                            url={currentTrailer.videoUrl}
                            controls={false}
                            width="100%"
                            height="100%"
                        />
                    </div>
                ) : (
                    <p className="text-white text-center">No video found</p>
                )}
            </div>
            <div className='group grid grid-cols-4 gap-4 md:gap-8 mt-8 max-w-3xl mx-auto'>
                {
                    dummyTrailers.map((trailer) => (
                        <div
                            onClick={() => setCurrentTrailer(trailer)}
                            key={trailer.image}
                            className='relative cursor-pointer group-hover:not-hover:opacity-50 hover:-translate-y-1 duration-300 transition max-md:h-60'
                        >
                            <img
                                src={trailer.image}
                                alt=""
                                className='rounded-lg w-full h-full object-cover brightness-75'
                            />

                            <PlayCircleIcon
                                strokeWidth={1.6}
                                className='absolute top-1/2 left-1/2 w-5 md:w-8 h-5 md:h-12 -translate-x-1/2 -translate-y-1/2'
                            />
                        </div>
                    ))
                }
            </div>
        </div>
    );
};

export default TrailerSection;