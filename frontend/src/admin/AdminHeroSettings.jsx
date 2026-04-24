import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Plus, X, ChevronUp, ChevronDown, Edit2, Eye } from 'lucide-react'
import { heroAPI } from '../services/api'
import toast from 'react-hot-toast'

const AdminHeroSettings = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [editingSlide, setEditingSlide] = useState(null)
  const [showForm, setShowForm] = useState(false)
  
  const [settings, setSettings] = useState({
    enableSlider: true,
    autoRotate: true,
    rotationInterval: 6000,
    heroSlides: []
  })

  const [slideForm, setSlideForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    backgroundImage: '',
    posterImage: '',
    genres: '',
    releaseYear: '',
    duration: '',
    rating: '',
    buttonText: 'Buy Tickets',
    buttonLink: '/movies',
    isActive: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setFetchLoading(true)
      const heroRes = await heroAPI.getHeroSettings()
      
      if (heroRes.data.settings) {
        setSettings({
          enableSlider: heroRes.data.settings.enableSlider ?? true,
          autoRotate: heroRes.data.settings.autoRotate ?? true,
          rotationInterval: heroRes.data.settings.rotationInterval || 6000,
          heroSlides: heroRes.data.settings.heroSlides || []
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load hero settings')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const openAddForm = () => {
    setSlideForm({
      title: '',
      subtitle: '',
      description: '',
      backgroundImage: '',
      posterImage: '',
      genres: '',
      releaseYear: '',
      duration: '',
      rating: '',
      buttonText: 'Buy Tickets',
      buttonLink: '/movies',
      isActive: true
    })
    setEditingSlide(null)
    setShowForm(true)
  }

  const openEditForm = (index) => {
    const slide = settings.heroSlides[index]
    setSlideForm({ ...slide })
    setEditingSlide(index)
    setShowForm(true)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setSlideForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const saveSlide = () => {
    if (!slideForm.title.trim() || !slideForm.description.trim() || !slideForm.backgroundImage.trim()) {
      toast.error('Title, description, and background image are required')
      return
    }

    if (editingSlide !== null) {
      // Update existing slide
      const updatedSlides = [...settings.heroSlides]
      updatedSlides[editingSlide] = { ...slideForm, order: editingSlide }
      setSettings(prev => ({ ...prev, heroSlides: updatedSlides }))
      toast.success('Slide updated')
    } else {
      // Add new slide
      const newSlide = {
        ...slideForm,
        order: settings.heroSlides.length
      }
      setSettings(prev => ({
        ...prev,
        heroSlides: [...prev.heroSlides, newSlide]
      }))
      toast.success('Slide added')
    }
    setShowForm(false)
  }

  const removeSlide = (index) => {
    if (window.confirm('Are you sure you want to remove this slide?')) {
      const updatedSlides = settings.heroSlides.filter((_, i) => i !== index)
      // Reorder
      const reordered = updatedSlides.map((slide, i) => ({ ...slide, order: i }))
      setSettings(prev => ({ ...prev, heroSlides: reordered }))
      toast.success('Slide removed')
    }
  }

  const moveSlide = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= settings.heroSlides.length) return

    const updatedSlides = [...settings.heroSlides]
    ;[updatedSlides[index], updatedSlides[newIndex]] = [updatedSlides[newIndex], updatedSlides[index]]
    
    // Reorder
    const reordered = updatedSlides.map((slide, i) => ({ ...slide, order: i }))
    setSettings(prev => ({ ...prev, heroSlides: reordered }))
  }

  const handleSaveAll = async (e) => {
    e.preventDefault()
    
    if (settings.heroSlides.length === 0) {
      toast.error('Add at least one slide')
      return
    }

    try {
      setLoading(true)
      await heroAPI.updateHeroSettings(settings)
      toast.success('All hero settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Hero Section Manager</h1>
          <p className="text-gray-400 mt-1">Create and manage custom hero slider slides</p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dull rounded-lg text-white font-semibold transition"
        >
          <Plus className="w-5 h-5" />
          Add New Slide
        </button>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Global Settings */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Slider Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="enableSlider"
                checked={settings.enableSlider}
                onChange={handleSettingChange}
                className="w-5 h-5"
              />
              <span className="text-gray-300">Enable Slider</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="autoRotate"
                checked={settings.autoRotate}
                onChange={handleSettingChange}
                className="w-5 h-5"
              />
              <span className="text-gray-300">Auto Rotate</span>
            </label>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Rotation Interval (ms)</label>
              <input
                type="number"
                name="rotationInterval"
                value={settings.rotationInterval}
                onChange={handleSettingChange}
                min="2000"
                max="10000"
                step="1000"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Slides List */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Hero Slides ({settings.heroSlides.length})</h2>
            <p className="text-gray-400 text-sm">Click edit to modify • Drag arrows to reorder</p>
          </div>

          {settings.heroSlides.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-600 text-6xl mb-4">🎬</div>
              <p className="text-gray-400 text-lg mb-4">No slides created yet</p>
              <button
                type="button"
                onClick={openAddForm}
                className="px-6 py-3 bg-primary hover:bg-primary-dull rounded-lg text-white font-semibold transition"
              >
                Create Your First Slide
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {settings.heroSlides.map((slide, index) => (
                <div key={index} className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 hover:border-primary/50 transition">
                  {/* Preview Image */}
                  <div className="relative h-40 bg-gray-800">
                    <img 
                      src={slide.backgroundImage} 
                      alt={slide.title}
                      className="w-full h-full object-cover"
                      onError={(e) => e.target.src = '/backgroundImage.png'}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-bold text-lg truncate">{slide.title}</h3>
                      {slide.genres && (
                        <p className="text-gray-300 text-xs mt-1">{slide.genres}</p>
                      )}
                    </div>
                    
                    {/* Order Badge */}
                    <div className="absolute top-3 left-3 bg-primary text-white px-3 py-1 rounded-full text-sm font-bold">
                      #{index + 1}
                    </div>
                  </div>

                  {/* Slide Info */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {slide.releaseYear && (
                        <div className="text-gray-400">📅 {slide.releaseYear}</div>
                      )}
                      {slide.duration && (
                        <div className="text-gray-400">⏱️ {slide.duration}</div>
                      )}
                      {slide.rating && (
                        <div className="text-gray-400">⭐ {slide.rating}</div>
                      )}
                      {slide.buttonText && (
                        <div className="text-gray-400">🔘 {slide.buttonText}</div>
                      )}
                    </div>

                    {slide.description && (
                      <p className="text-gray-500 text-xs line-clamp-2">{slide.description}</p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
                      <button
                        type="button"
                        onClick={() => moveSlide(index, 'up')}
                        disabled={index === 0}
                        className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded transition"
                        title="Move Up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSlide(index, 'down')}
                        disabled={index === settings.heroSlides.length - 1}
                        className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded transition"
                        title="Move Down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditForm(index)}
                        className="flex-1 p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded transition flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSlide(index)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        {settings.heroSlides.length > 0 && (
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-primary hover:bg-primary-dull disabled:bg-gray-700 rounded-lg text-white font-semibold transition flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save All Slides'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-semibold transition"
            >
              Cancel
            </button>
          </div>
        )}
      </form>

      {/* Add/Edit Slide Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingSlide !== null ? 'Edit Slide' : 'Add New Slide'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Background Image */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Background Image URL *</label>
                <input
                  type="url"
                  name="backgroundImage"
                  value={slideForm.backgroundImage}
                  onChange={handleFormChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                  placeholder="https://example.com/image.jpg"
                />
                {slideForm.backgroundImage && (
                  <img src={slideForm.backgroundImage} alt="Preview" className="mt-3 w-full h-40 object-cover rounded-lg" />
                )}
              </div>

              {/* Poster Image */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Poster Image URL (Optional)</label>
                <input
                  type="url"
                  name="posterImage"
                  value={slideForm.posterImage}
                  onChange={handleFormChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                  placeholder="https://example.com/poster.jpg"
                />
                {slideForm.posterImage && (
                  <img src={slideForm.posterImage} alt="Poster Preview" className="mt-3 w-32 h-48 object-cover rounded-lg" />
                )}
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={slideForm.title}
                    onChange={handleFormChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Subtitle</label>
                  <input
                    type="text"
                    name="subtitle"
                    value={slideForm.subtitle}
                    onChange={handleFormChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Description *</label>
                <textarea
                  name="description"
                  value={slideForm.description}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                  required
                />
              </div>

              {/* Genres, Year, Duration, Rating */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Genres</label>
                  <input
                    type="text"
                    name="genres"
                    value={slideForm.genres}
                    onChange={handleFormChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                    placeholder="Action · Adventure"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Year</label>
                  <input
                    type="text"
                    name="releaseYear"
                    value={slideForm.releaseYear}
                    onChange={handleFormChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                    placeholder="2024"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Duration</label>
                  <input
                    type="text"
                    name="duration"
                    value={slideForm.duration}
                    onChange={handleFormChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                    placeholder="2h 30m"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Rating</label>
                  <input
                    type="text"
                    name="rating"
                    value={slideForm.rating}
                    onChange={handleFormChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                    placeholder="8.5/10"
                  />
                </div>
              </div>

              {/* Button Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Button Text</label>
                  <input
                    type="text"
                    name="buttonText"
                    value={slideForm.buttonText}
                    onChange={handleFormChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Button Link</label>
                  <input
                    type="text"
                    name="buttonLink"
                    value={slideForm.buttonLink}
                    onChange={handleFormChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                    placeholder="/movies or /movies/123"
                  />
                </div>
              </div>

              {/* Save/Cancel */}
              <div className="flex gap-4 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={saveSlide}
                  className="flex-1 py-3 bg-primary hover:bg-primary-dull rounded-lg text-white font-semibold transition"
                >
                  {editingSlide !== null ? 'Update Slide' : 'Add Slide'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminHeroSettings
