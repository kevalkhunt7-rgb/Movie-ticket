import React, { useEffect, useState, useCallback } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { heroAPI } from '../services/api'

const HeroSection = () => {
  const navigate = useNavigate()
  const [heroData, setHeroData] = useState(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHeroSettings()
  }, [])

  const fetchHeroSettings = async () => {
    try {
      const res = await heroAPI.getHeroSettings()
      setHeroData(res.data.settings)
    } catch (error) {
      setHeroData({
        heroSlides: [],
        title: 'Movie Title',
        description: 'Book your favorite movie tickets online.',
        backgroundImage: '/backgroundImage.png',
      })
    } finally {
      setLoading(false)
    }
  }

  const slides = heroData?.heroSlides || []
  const hasMultiple = slides.length > 1

  const nextSlide = useCallback(() => {
    if (!hasMultiple) return
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }, [hasMultiple, slides.length])

  const prevSlide = () => {
    if (!hasMultiple) return
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  useEffect(() => {
    if (!hasMultiple) return

    const timer = setInterval(() => {
      nextSlide()
    }, 3000)

    return () => clearInterval(timer)
  }, [hasMultiple, nextSlide])

  if (loading) {
    return (
      <section className="w-full h-screen bg-black flex items-center justify-center overflow-hidden">
        <p className="text-white">Loading...</p>
      </section>
    )
  }

  const cur = slides[currentSlide] || {}

  const bgImage =
    cur.backgroundImage ||
    heroData?.backgroundImage ||
    '/backgroundImage.png'

  const title = cur.title || heroData?.title || 'Movie Title'
  const subtitle = cur.subtitle || ''
  const description =
    cur.description ||
    heroData?.description ||
    'Book your favorite movie tickets online.'

  const genres = cur.genres || heroData?.genres || ''
  const releaseYear = cur.releaseYear || heroData?.releaseYear || ''
  const duration = cur.duration || heroData?.duration || ''
  const rating = cur.rating || ''
  const buttonText = cur.buttonText || 'Book Now'
  const buttonLink = cur.buttonLink || '/movies'

  const genreList = genres
    ? genres.split('·').map((g) => g.trim()).filter(Boolean)
    : []

  return (
    <section className="relative w-full max-w-full min-h-screen overflow-hidden bg-black">
      {/* Background */}
      <div
        key={currentSlide}
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/65" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto min-h-screen px-4 sm:px-6 lg:px-10 flex items-center">
        <div className="w-full max-w-2xl pt-24 pb-24">
          {hasMultiple && (
            <p className="text-yellow-400 text-xs font-bold tracking-widest mb-3">
              {String(currentSlide + 1).padStart(2, '0')} /{' '}
              {String(slides.length).padStart(2, '0')}
            </p>
          )}

          {genreList.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 max-w-full">
              {genreList.map((genre, index) => (
                <span
                  key={index}
                  className="text-[10px] sm:text-xs border border-yellow-400/40 text-yellow-400 px-2 py-1 rounded uppercase tracking-wide"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-white font-black text-4xl sm:text-5xl lg:text-7xl leading-tight break-words">
            {title}
          </h1>

          {subtitle && (
            <p className="text-yellow-400 mt-2 text-sm sm:text-base italic">
              {subtitle}
            </p>
          )}

          <div className="flex flex-wrap gap-4 mt-4 text-white/70 text-sm">
            {releaseYear && <span>{releaseYear}</span>}
            {duration && <span>{duration}</span>}
            {rating && <span>⭐ {rating}</span>}
          </div>

          {description && (
            <p className="text-white/70 mt-5 text-sm sm:text-base leading-relaxed max-w-xl line-clamp-3">
              {description}
            </p>
          )}

          <button
            onClick={() => navigate(buttonLink)}
            className="mt-7 inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-3 rounded-lg transition"
          >
            {buttonText}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Arrows */}
      {hasMultiple && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-yellow-400 hover:text-black transition"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-yellow-400 hover:text-black transition"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* Dots */}
      {hasMultiple && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 max-w-full overflow-hidden">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                currentSlide === index
                  ? 'w-8 bg-yellow-400'
                  : 'w-2 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default HeroSection