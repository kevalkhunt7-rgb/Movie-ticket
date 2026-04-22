import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { movieAPI } from '../services/api'
import toast from 'react-hot-toast'

const MovieForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState({
    title: '',
    overview: '',
    poster_path: '',
    backdrop_path: '',
    trailer_url: '',
    genres: [],
    casts: [],
    release_date: '',
    original_language: 'en',
    lang: 'English',
    tagline: '',
    vote_average: 0,
    vote_count: 0,
    runtime: 0,
    status: 'coming_soon'
  })

  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)
  const [genreInput, setGenreInput] = useState('')
  const [castInput, setCastInput] = useState({
    name: '',
    profile_path: ''
  })

  useEffect(() => {
    if (isEdit) {
      fetchMovie()
    }
  }, [id])

  const fetchMovie = async () => {
    try {
      setFetchLoading(true)
      const response = await movieAPI.getMovie(id)
      const movie = response.data.movie

      setFormData({
        title: movie.title || '',
        overview: movie.overview || '',
        poster_path: movie.poster_path || '',
        backdrop_path: movie.backdrop_path || '',
        trailer_url: movie.trailer_url || '',
        genres: movie.genres || [],
        casts: movie.casts || [],
        release_date: movie.release_date?.split('T')[0] || '',
        original_language: movie.original_language || 'en',
        lang: movie.lang || 'English',
        tagline: movie.tagline || '',
        vote_average: movie.vote_average || 0,
        vote_count: movie.vote_count || 0,
        runtime: movie.runtime || 0,
        status: movie.status || 'coming_soon'
      })
    } catch (error) {
      console.error('Error fetching movie:', error)
      toast.error('Failed to load movie')
      navigate('/admin/movies')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'number'
          ? value === ''
            ? ''
            : Number(value)
          : value
    }))
  }

  const addGenre = () => {
    const trimmedGenre = genreInput.trim()
    if (!trimmedGenre) return

    const alreadyExists = formData.genres.some(
      (genre) => genre.name.toLowerCase() === trimmedGenre.toLowerCase()
    )

    if (alreadyExists) {
      toast.error('Genre already added')
      return
    }

    const newGenre = {
      id: Date.now(),
      name: trimmedGenre
    }

    setFormData((prev) => ({
      ...prev,
      genres: [...prev.genres, newGenre]
    }))

    setGenreInput('')
  }

  const removeGenre = (index) => {
    setFormData((prev) => ({
      ...prev,
      genres: prev.genres.filter((_, i) => i !== index)
    }))
  }

  const addCast = () => {
    const trimmedName = castInput.name.trim()
    if (!trimmedName) return

    setFormData((prev) => ({
      ...prev,
      casts: [
        ...prev.casts,
        {
          id: Date.now(),
          name: trimmedName,
          profile_path: castInput.profile_path.trim()
        }
      ]
    }))

    setCastInput({ name: '', profile_path: '' })
  }

  const removeCast = (index) => {
    setFormData((prev) => ({
      ...prev,
      casts: prev.casts.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (loading) return

    if (!formData.title.trim() || !formData.overview.trim() || !formData.poster_path.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)

      const payload = {
        ...formData,
        title: formData.title.trim(),
        overview: formData.overview.trim(),
        poster_path: formData.poster_path.trim(),
        backdrop_path: formData.backdrop_path.trim(),
        trailer_url: formData.trailer_url.trim(),
        tagline: formData.tagline.trim(),
        lang: formData.lang.trim(),
        original_language: formData.original_language.trim(),
        vote_average: Number(formData.vote_average) || 0,
        vote_count: Number(formData.vote_count) || 0,
        runtime: Number(formData.runtime) || 0
      }

      if (isEdit) {
        await movieAPI.updateMovie(id, payload)
        toast.success('Movie updated successfully')
      } else {
        await movieAPI.createMovie(payload)
        toast.success('Movie created successfully')
      }

      navigate('/admin/movies')
    } catch (error) {
      console.error('Error saving movie:', error)
      toast.error(error.response?.data?.message || 'Failed to save movie')
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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => navigate('/admin/movies')}
          className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-3xl font-bold text-white">
          {isEdit ? 'Edit Movie' : 'Add New Movie'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-gray-400 text-sm mb-2">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-400 text-sm mb-2">Overview *</label>
              <textarea
                name="overview"
                value={formData.overview}
                onChange={handleChange}
                rows={4}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Tagline</label>
              <input
                type="text"
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
              >
                <option value="now_showing">Now Showing</option>
                <option value="coming_soon">Coming Soon</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Images</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Poster URL *</label>
              <input
                type="url"
                name="poster_path"
                value={formData.poster_path}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                required
              />
              {formData.poster_path && (
                <img
                  src={formData.poster_path}
                  alt="Poster preview"
                  className="mt-3 w-32 h-48 object-cover rounded-lg"
                />
              )}
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Backdrop URL</label>
              <input
                type="url"
                name="backdrop_path"
                value={formData.backdrop_path}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
              />
              {formData.backdrop_path && (
                <img
                  src={formData.backdrop_path}
                  alt="Backdrop preview"
                  className="mt-3 w-full h-32 object-cover rounded-lg"
                />
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Release Date</label>
              <input
                type="date"
                name="release_date"
                value={formData.release_date}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Runtime (minutes)</label>
              <input
                type="number"
                name="runtime"
                value={formData.runtime}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Language</label>
              <input
                type="text"
                name="lang"
                value={formData.lang}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Rating</label>
              <input
                type="number"
                name="vote_average"
                value={formData.vote_average}
                onChange={handleChange}
                min="0"
                max="10"
                step="0.1"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Vote Count</label>
              <input
                type="number"
                name="vote_count"
                value={formData.vote_count}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Trailer URL</label>
              <input
                type="url"
                name="trailer_url"
                value={formData.trailer_url}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Genres */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Genres</h2>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={genreInput}
              onChange={(e) => setGenreInput(e.target.value)}
              placeholder="Add genre..."
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addGenre()
                }
              }}
            />
            <button
              type="button"
              onClick={addGenre}
              className="px-4 py-3 bg-primary hover:bg-primary-dull rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.genres.map((genre, index) => (
              <span
                key={genre.id || index}
                className="inline-flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-full text-sm"
              >
                {genre.name}
                <button
                  type="button"
                  onClick={() => removeGenre(index)}
                  className="hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Cast */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Cast</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              value={castInput.name}
              onChange={(e) =>
                setCastInput((prev) => ({
                  ...prev,
                  name: e.target.value
                }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCast()
                }
              }}
              placeholder="Actor name..."
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
            />

            <div className="flex gap-2">
              <input
                type="url"
                value={castInput.profile_path}
                onChange={(e) =>
                  setCastInput((prev) => ({
                    ...prev,
                    profile_path: e.target.value
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCast()
                  }
                }}
                placeholder="Photo URL..."
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
              />

              <button
                type="button"
                onClick={addCast}
                className="px-4 py-3 bg-primary hover:bg-primary-dull rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formData.casts.map((cast, index) => (
              <div
                key={cast.id || index}
                className="bg-gray-700 rounded-lg p-3 relative group"
              >
                <img
                  src={cast.profile_path || '/default-avatar.png'}
                  alt={cast.name}
                  className="w-full h-24 object-cover rounded-lg mb-2"
                />
                <p className="text-sm text-white truncate">{cast.name}</p>

                <button
                  type="button"
                  onClick={() => removeCast(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-4 bg-primary hover:bg-primary-dull disabled:bg-gray-700 rounded-lg text-white font-semibold transition"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Movie' : 'Create Movie'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/movies')}
            className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-semibold transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default MovieForm