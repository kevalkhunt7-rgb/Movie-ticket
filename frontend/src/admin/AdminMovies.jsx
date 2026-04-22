import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Edit2, Trash2, Film, Star, Clock, Globe } from 'lucide-react'
import { movieAPI } from '../services/api'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  now_showing: { label: 'Now Showing', color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' },
  coming_soon:  { label: 'Coming Soon', color: '#6366f1', bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.3)' },
  ended:        { label: 'Ended',       color: '#64748b', bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.3)' },
}

const FILTERS = [
  { value: 'all',         label: 'All' },
  { value: 'now_showing', label: 'Now Showing' },
  { value: 'coming_soon', label: 'Coming Soon' },
  { value: 'ended',       label: 'Ended' },
]

const AdminMovies = () => {
  const [movies, setMovies]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter]       = useState('all')
  const [hoveredId, setHoveredId] = useState(null)

  useEffect(() => { fetchMovies() }, [])

  const fetchMovies = async () => {
    try {
      setLoading(true)
      const response = await movieAPI.getAllMovies({ limit: 100 })
      setMovies(response.data.movies)
    } catch {
      toast.error('Failed to load movies')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this movie?')) return
    try {
      await movieAPI.deleteMovie(id)
      toast.success('Movie deleted successfully')
      fetchMovies()
    } catch {
      toast.error('Failed to delete movie')
    }
  }

  const filteredMovies = movies.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || m.status === filter
    return matchesSearch && matchesFilter
  })

  const counts = {
    all: movies.length,
    now_showing: movies.filter(m => m.status === 'now_showing').length,
    coming_soon: movies.filter(m => m.status === 'coming_soon').length,
    ended: movies.filter(m => m.status === 'ended').length,
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        border: '3px solid rgba(245,158,11,0.15)',
        borderTopColor: '#f59e0b',
        animation: 'spin .75s linear infinite'
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", color: '#fff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .movie-card { animation: fadeUp .3s ease both; transition: transform .25s, box-shadow .25s; }
        .movie-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .overlay { opacity: 0; transition: opacity .2s; }
        .movie-card:hover .overlay { opacity: 1; }
        .filter-pill { transition: all .2s; cursor: pointer; }
        .del-btn:hover { background: #ef4444 !important; }
        .edit-btn:hover { background: rgba(245,158,11,0.9) !important; }
        input:focus { outline: none; border-color: rgba(245,158,11,0.6) !important; box-shadow: 0 0 0 3px rgba(245,158,11,0.08) !important; }
        * { box-sizing: border-box; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
            <Film size={26} color="#f59e0b" />
            <h1 style={{ margin: 0, fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
              Movie Catalog
            </h1>
          </div>
          <p style={{ margin: 0, color: '#64647a', fontSize: 14 }}>
            {movies.length} total movies in your library
          </p>
        </div>
        <Link to="/admin/movies/add" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#f59e0b', color: '#000', fontWeight: 700, fontSize: 14,
          padding: '11px 22px', borderRadius: 10, textDecoration: 'none',
          transition: 'all .2s', boxShadow: '0 4px 18px rgba(245,158,11,0.35)'
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#fbbf24'}
          onMouseLeave={e => e.currentTarget.style.background = '#f59e0b'}
        >
          <Plus size={17} strokeWidth={2.5} />
          Add Movie
        </Link>
      </div>

      {/* ── Search + Filter Row ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 0 }}>
          <Search size={16} color="#64647a" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search movies…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, padding: '11px 14px 11px 40px',
              color: '#fff', fontSize: 14, transition: 'all .2s'
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map(f => {
            const active = filter === f.value
            const cfg = STATUS_CONFIG[f.value]
            return (
              <button key={f.value} className="filter-pill" onClick={() => setFilter(f.value)} style={{
                background: active ? (cfg ? cfg.bg : 'rgba(245,158,11,0.15)') : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? (cfg ? cfg.border : 'rgba(245,158,11,0.4)') : 'rgba(255,255,255,0.1)'}`,
                color: active ? (cfg ? cfg.color : '#f59e0b') : '#64647a',
                borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                {f.label}
                <span style={{
                  background: active ? (cfg ? cfg.color : '#f59e0b') : 'rgba(255,255,255,0.1)',
                  color: active ? '#000' : '#64647a',
                  borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 700
                }}>
                  {counts[f.value]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Grid ── */}
      {filteredMovies.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 20
        }}>
          {filteredMovies.map((movie, idx) => {
            const cfg = STATUS_CONFIG[movie.status] || STATUS_CONFIG.ended
            return (
              <div
                key={movie._id}
                className="movie-card"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  animationDelay: `${idx * 40}ms`
                }}
                onMouseEnter={() => setHoveredId(movie._id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Poster */}
                <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden' }}>
                  <img
                    src={movie.poster_path}
                    alt={movie.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                      transition: 'transform .35s', transform: hoveredId === movie._id ? 'scale(1.06)' : 'scale(1)' }}
                  />

                  {/* Gradient overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)',
                    pointerEvents: 'none'
                  }} />

                  {/* Status badge */}
                  <div style={{
                    position: 'absolute', top: 10, left: 10,
                    background: cfg.bg, border: `1px solid ${cfg.border}`,
                    color: cfg.color, fontSize: 11, fontWeight: 700,
                    padding: '3px 9px', borderRadius: 99,
                    backdropFilter: 'blur(6px)'
                  }}>
                    {cfg.label}
                  </div>

                  {/* Rating badge */}
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: 8, padding: '4px 8px', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}>
                    <Star size={11} color="#f59e0b" fill="#f59e0b" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>
                      {movie.vote_average?.toFixed(1)}
                    </span>
                  </div>

                  {/* Action buttons overlay */}
                  <div className="overlay" style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.55)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    backdropFilter: 'blur(2px)'
                  }}>
                    <Link to={`/admin/movies/edit/${movie._id}`}
                      className="edit-btn"
                      style={{
                        background: '#f59e0b', borderRadius: 10, padding: '10px 14px',
                        display: 'flex', alignItems: 'center', gap: 6,
                        textDecoration: 'none', color: '#000', fontWeight: 700, fontSize: 13,
                        transition: 'background .15s'
                      }}>
                      <Edit2 size={14} /> Edit
                    </Link>
                    <button className="del-btn"
                      onClick={() => handleDelete(movie._id)}
                      style={{
                        background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)',
                        borderRadius: 10, padding: '10px 14px',
                        display: 'flex', alignItems: 'center', gap: 6,
                        color: '#ef4444', fontWeight: 700, fontSize: 13,
                        cursor: 'pointer', transition: 'background .15s', color: '#fff'
                      }}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: '14px 14px 16px' }}>
                  <h3 style={{
                    margin: '0 0 6px', fontWeight: 700, fontSize: 15,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {movie.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#64647a' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Globe size={11} />{movie.lang}
                    </span>
                    <span style={{ width: 3, height: 3, background: '#64647a', borderRadius: '50%' }} />
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} />{movie.runtime} min
                    </span>
                    <span style={{ width: 3, height: 3, background: '#64647a', borderRadius: '50%' }} />
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                  </div>
                  <div style={{ marginTop: 10, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
                    <div style={{
                      height: '100%', borderRadius: 99, background: '#f59e0b',
                      width: `${Math.min((movie.vote_average / 10) * 100, 100)}%`,
                      transition: 'width .6s ease'
                    }} />
                  </div>
                  <p style={{ margin: '5px 0 0', fontSize: 11, color: '#64647a' }}>
                    {movie.vote_count?.toLocaleString()} votes
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 18, padding: '64px 24px', textAlign: 'center'
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px'
          }}>
            <Film size={32} color="rgba(245,158,11,0.5)" />
          </div>
          <h3 style={{ margin: '0 0 8px', fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800 }}>
            No movies found
          </h3>
          <p style={{ margin: '0 0 24px', color: '#64647a', fontSize: 14 }}>
            {searchTerm ? 'Try a different search term or filter' : 'Start building your catalog'}
          </p>
          {!searchTerm && (
            <Link to="/admin/movies/add" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#f59e0b', color: '#000', fontWeight: 700, fontSize: 14,
              padding: '11px 22px', borderRadius: 10, textDecoration: 'none'
            }}>
              <Plus size={17} /> Add First Movie
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminMovies