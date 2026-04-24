import React, { useState, useRef, useEffect, useCallback } from 'react'
import { movieAPI } from '../services/api'
import ReactPlayer from 'react-player/lazy'
import { Play, Volume2, VolumeX, Maximize2, Loader2 } from 'lucide-react'

const injectStyles = () => {
  if (document.getElementById('trailer-styles')) return
  const style = document.createElement('style')
  style.id = 'trailer-styles'
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Mulish:wght@300;400;500&display=swap');

    :root {
      --ts-red: #e82b2b;
      --ts-red-dim: rgba(232,43,43,0.18);
      --ts-gold: #c9a84c;
      --ts-border: rgba(255,255,255,0.07);
      --ts-surface: rgba(255,255,255,0.04);
    }

    .ts-section {
      position: relative;
      width: 100%;
      overflow-x: clip;
      overflow-y: visible;
      padding: 5rem 0;
      font-family: 'Mulish', sans-serif;
      background: #000;
      box-sizing: border-box;
    }
    .ts-section::after {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.07) 2px,rgba(0,0,0,0.07) 4px);
      pointer-events: none;
      z-index: 0;
    }

    .ts-inner {
      position: relative;
      width: 100%;
      max-width: 1280px;
      padding-left: 1rem;
      padding-right: 1rem;
      margin: 0 auto;
      box-sizing: border-box;
      overflow: hidden;
    }
    @media (min-width: 640px)  { .ts-inner { padding-left: 1.5rem; padding-right: 1.5rem; } }
    @media (min-width: 1024px) { .ts-inner { padding-left: 2.5rem;  padding-right: 2.5rem;  } }

    .ts-glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      pointer-events: none;
      z-index: 0;
      max-width: 100%;
      overflow: hidden;
    }
    .ts-glow-1 { width: min(600px,100%); height: 350px; background: radial-gradient(ellipse,rgba(232,43,43,0.07) 0%,transparent 70%); top: 0; right: 0; }
    .ts-glow-2 { width: min(400px,100%); height: 250px; background: radial-gradient(ellipse,rgba(201,168,76,0.04) 0%,transparent 70%); bottom: 60px; left: 0; }

    .ts-header {
      position: relative; z-index: 2;
      display: flex; align-items: baseline; gap: 1rem;
      max-width: 960px; width: 100%;
      margin: 0 auto 2rem;
      box-sizing: border-box;
    }
    .ts-label { font-family:'Bebas Neue',sans-serif; font-size:clamp(2.2rem,6vw,3.6rem); letter-spacing:0.06em; line-height:1; color:#f0ece4; }
    .ts-label span { color: var(--ts-red); }
    .ts-count { font-size:0.65rem; font-weight:500; letter-spacing:0.3em; text-transform:uppercase; color:rgba(255,255,255,0.3); margin-left:0.25rem; white-space:nowrap; }

    /* ── Stage ── */
    .ts-stage {
      position: relative; z-index: 2;
      max-width: 960px; width: 100%;
      margin: 0 auto;
      box-sizing: border-box;
      overflow: hidden;
    }

    /* ── Frame ── */
    .ts-frame {
      position: relative;
      width: 100%; max-width: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }
    .ts-frame::before,.ts-frame::after,.ts-corner-br,.ts-corner-bl {
      content:''; position:absolute; width:22px; height:22px; z-index:5; pointer-events:none;
    }
    .ts-frame::before { top:-1px; left:-1px;   border-top:2px solid var(--ts-red); border-left:2px solid var(--ts-red); }
    .ts-frame::after  { top:-1px; right:-1px;  border-top:2px solid var(--ts-red); border-right:2px solid var(--ts-red); }
    .ts-corner-br     { bottom:-1px; right:-1px; border-bottom:2px solid var(--ts-red); border-right:2px solid var(--ts-red); }
    .ts-corner-bl     { bottom:-1px; left:-1px;  border-bottom:2px solid var(--ts-red); border-left:2px solid var(--ts-red); }

    /* ── Player wrapper — the key fix ── */
    /*
     * aspect-ratio drives the height. The wrapper is 100% wide.
     * overflow:hidden clips the iframe. position:relative is the
     * containing block for the absolutely-placed ReactPlayer div.
     */
    .ts-player-wrap {
      position: relative;
      display: block;
      width: 100%;
      max-width: 100%;
      /* aspect-ratio sets height = width * 9/16 */
      aspect-ratio: 16 / 9;
      overflow: hidden;
      box-sizing: border-box;
      background: #0e0e0e;
    }

    /*
     * ReactPlayer renders: .ts-player-wrap > div[style] > div > iframe
     * The outer div has inline width/height px values we cannot override
     * with normal selectors reliably. We use JS MutationObserver for that.
     * But we still set CSS as a fallback for every level.
     */
    .ts-player-wrap > div,
    .ts-player-wrap > div > div {
      position: absolute !important;
      top: 0 !important; left: 0 !important;
      width: 100% !important; height: 100% !important;
      max-width: 100% !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }
    .ts-player-wrap iframe,
    .ts-player-wrap video {
      position: absolute !important;
      top: 0 !important; left: 0 !important;
      width: 100% !important; height: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      border: none !important;
      display: block !important;
    }

    .ts-player-overlay {
      position: absolute; bottom:0; left:0; right:0; height:35%;
      background: linear-gradient(to top,rgba(10,10,10,0.85) 0%,transparent 100%);
      z-index: 3; pointer-events: none;
    }

    /* ── Meta ── */
    .ts-meta {
      display:flex; align-items:center; justify-content:space-between;
      margin-top:1rem; gap:0.75rem; flex-wrap:wrap;
      width:100%; max-width:100%; box-sizing:border-box;
    }
    .ts-movie-title {
      font-family:'Bebas Neue',sans-serif;
      font-size:clamp(1.1rem,3vw,1.5rem);
      letter-spacing:0.08em; color:#f0ece4;
      opacity:0; animation:tsSlideIn 0.4s ease forwards;
      min-width:0; word-break:break-word; flex:1 1 0;
    }
    @keyframes tsSlideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
    .ts-meta-right { display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap; flex-shrink:0; }
    .ts-meta-pill {
      font-size:0.6rem; font-weight:500; letter-spacing:0.2em; text-transform:uppercase;
      color:var(--ts-red); border:1px solid var(--ts-red-dim); padding:0.25rem 0.6rem; border-radius:1px;
    }
    .ts-icon-btn {
      background:var(--ts-surface); border:1px solid var(--ts-border);
      color:rgba(255,255,255,0.5); width:32px; height:32px; border-radius:2px;
      cursor:pointer; display:flex; align-items:center; justify-content:center;
      transition:all 0.2s ease; flex-shrink:0;
    }
    .ts-icon-btn:hover { border-color:var(--ts-red); color:var(--ts-red); background:var(--ts-red-dim); }

    /* ── Thumbnail rail ── */
    .ts-rail {
      position:relative; z-index:2;
      display:grid;
      grid-template-columns:repeat(4,minmax(0,1fr));
      gap:0.75rem;
      max-width:960px; width:100%;
      margin:2rem auto 0;
      box-sizing:border-box;
      overflow:hidden;
    }
    .ts-thumb {
      position:relative; cursor:pointer; overflow:hidden;
      border:1px solid transparent; border-radius:2px;
      transition:border-color 0.25s ease,transform 0.25s ease;
      aspect-ratio:16/9; background:#111;
      min-width:0; width:100%; box-sizing:border-box;
    }
    .ts-thumb:hover  { transform:translateY(-3px); border-color:rgba(232,43,43,0.5); }
    .ts-thumb.active { border-color:var(--ts-red); }
    .ts-thumb img { width:100%; height:100%; object-fit:cover; display:block; filter:brightness(0.55) saturate(0.8); transition:filter 0.3s ease; max-width:100%; }
    .ts-thumb:hover img,.ts-thumb.active img { filter:brightness(0.75) saturate(1); }
    .ts-thumb.active::after { content:''; position:absolute; bottom:0; left:0; right:0; height:2px; background:var(--ts-red); }
    .ts-thumb-play { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; transition:opacity 0.25s; }
    .ts-thumb-play-inner {
      width:34px; height:34px; border-radius:50%;
      background:rgba(232,43,43,0.85);
      display:flex; align-items:center; justify-content:center;
      transform:scale(0.85); transition:transform 0.25s ease;
      box-shadow:0 0 20px rgba(232,43,43,0.4);
    }
    .ts-thumb:hover .ts-thumb-play-inner,.ts-thumb.active .ts-thumb-play-inner { transform:scale(1); }
    .ts-thumb-label {
      position:absolute; bottom:0; left:0; right:0;
      padding:0.5rem 0.5rem 0.35rem;
      background:linear-gradient(to top,rgba(0,0,0,0.85) 0%,transparent 100%);
      font-size:0.6rem; font-weight:500; letter-spacing:0.1em; text-transform:uppercase;
      color:rgba(255,255,255,0.7); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; transition:color 0.25s;
    }
    .ts-thumb:hover .ts-thumb-label,.ts-thumb.active .ts-thumb-label { color:#fff; }

    .ts-no-video {
      width:100%; max-width:100%; aspect-ratio:16/9;
      display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.5rem;
      background:#0e0e0e; border:1px solid var(--ts-border);
      color:rgba(255,255,255,0.2); font-size:0.8rem; letter-spacing:0.15em; text-transform:uppercase; box-sizing:border-box;
    }

    @media (max-width: 640px) {
      .ts-section { padding: 3.5rem 0; }
      .ts-inner { padding-left: 0.75rem; padding-right: 0.75rem; }
      .ts-rail { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
      .ts-header { gap: 0.6rem; }
      .ts-count { font-size: 0.55rem; letter-spacing: 0.22em; }
      .ts-thumb-play-inner { width: 26px; height: 26px; }
      .ts-meta { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
      .ts-meta-right { width: 100%; justify-content: flex-end; }
    }
  `
  document.head.appendChild(style)
}

/* ─────────────────────────────────────────────────────────────────────
 * forceFillNode — directly patch inline width/height on a DOM node.
 * ReactPlayer sets style="width:640px;height:360px" as inline styles,
 * which always beat stylesheet rules. We override them in JS.
 * ───────────────────────────────────────────────────────────────────── */
const forceFill = (node) => {
  if (!node || node.nodeType !== 1) return
  // Only touch divs and iframes/videos — leave other elements alone
  const tag = node.tagName?.toLowerCase()
  if (!['div', 'iframe', 'video'].includes(tag)) return
  node.style.setProperty('position', 'absolute', 'important')
  node.style.setProperty('top',      '0',    'important')
  node.style.setProperty('left',     '0',    'important')
  node.style.setProperty('width',    '100%', 'important')
  node.style.setProperty('height',   '100%', 'important')
  node.style.setProperty('max-width','100%', 'important')
  node.style.setProperty('min-width','0',    'important')
  if (tag === 'iframe' || tag === 'video') {
    node.style.setProperty('border', 'none', 'important')
    node.style.setProperty('display','block', 'important')
  }
}

/* ─── Component ───────────────────────────────────────────────────── */
const TrailerSection = () => {
  const [trailers,       setTrailers]       = useState([])
  const [currentTrailer, setCurrentTrailer] = useState(null)
  const [muted,          setMuted]          = useState(false)
  const [titleKey,       setTitleKey]       = useState(0)
  const [loading,        setLoading]        = useState(true)

  const playerRef    = useRef(null)
  const wrapRef      = useRef(null)   // ref on .ts-player-wrap div
  const observerRef  = useRef(null)

  const Player = ReactPlayer.default || ReactPlayer

  /* Attach MutationObserver to the player wrapper.
   * Whenever ReactPlayer adds / mutates a child node we force-fill it. */
  const attachObserver = useCallback((wrapEl) => {
    if (!wrapEl) return
    if (observerRef.current) observerRef.current.disconnect()

    // Immediately fix any already-present children
    wrapEl.querySelectorAll('div, iframe, video').forEach(forceFill)

    const obs = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          forceFill(node)
          // Also fix descendants (ReactPlayer nests div > div > iframe)
          if (node.querySelectorAll) {
            node.querySelectorAll('div, iframe, video').forEach(forceFill)
          }
        })
        // Also react to attribute changes (ReactPlayer updates style attr)
        if (m.type === 'attributes' && m.attributeName === 'style') {
          forceFill(m.target)
        }
      })
    })

    obs.observe(wrapEl, {
      childList:  true,
      subtree:    true,
      attributes: true,
      attributeFilter: ['style'],
    })

    observerRef.current = obs
  }, [])

  // Disconnect observer on unmount
  useEffect(() => () => observerRef.current?.disconnect(), [])

  useEffect(() => {
    injectStyles()
    fetchTrailers()
  }, [])

  const fetchTrailers = async () => {
    try {
      setLoading(true)
      const response = await movieAPI.getAllMovies({ limit: 8, status: 'now_showing' })
      const moviesWithTrailers = response.data.movies
        .filter((m) => m.trailer_url?.trim())
        .map((m) => ({
          _id:          m._id,
          title:        m.title,
          videoUrl:     m.trailer_url,
          image:        m.backdrop_path || m.poster_path || '',
          poster_path:  m.poster_path,
          backdrop_path:m.backdrop_path,
          genres:       m.genres,
          release_date: m.release_date,
        }))
      setTrailers(moviesWithTrailers)
      if (moviesWithTrailers.length > 0) setCurrentTrailer(moviesWithTrailers[0])
    } catch (err) {
      console.error('[TrailerSection] Error fetching trailers:', err)
      setTrailers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (trailer) => {
    setCurrentTrailer(trailer)
    setTitleKey((k) => k + 1)
  }

  const handleFullscreen = () => {
    const el = playerRef.current?.wrapper
    if (el?.requestFullscreen) el.requestFullscreen()
  }

  /* ── Loading ── */
  if (loading) return (
    <div className="ts-section">
      <div className="ts-inner">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-white/50 text-sm">Loading trailers...</p>
          </div>
        </div>
      </div>
    </div>
  )

  /* ── Empty ── */
  if (trailers.length === 0) return (
    <div className="ts-section">
      <div className="ts-inner">
        <div className="ts-glow ts-glow-1" /><div className="ts-glow ts-glow-2" />
        <div className="ts-header"><h2 className="ts-label">Trailer<span>s</span></h2></div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Play className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-lg mb-2">No trailers available</p>
            <p className="text-white/30 text-sm">Check back later for new trailers</p>
          </div>
        </div>
      </div>
    </div>
  )

  /* ── Main ── */
  return (
    <div className="ts-section">
      <div className="ts-inner">
        <div className="ts-glow ts-glow-1" />
        <div className="ts-glow ts-glow-2" />

        <div className="ts-header">
          <h2 className="ts-label">Trailer<span>s</span></h2>
          <span className="ts-count">{trailers.length} films</span>
        </div>

        <div className="ts-stage">
          <div className="ts-frame">
            <div className="ts-corner-br" /><div className="ts-corner-bl" />

            {currentTrailer?.videoUrl ? (
              /* ref={attachObserver} fires when the div mounts/changes */
              <div className="ts-player-wrap" ref={(el) => { wrapRef.current = el; attachObserver(el) }}>
                <Player
                  ref={playerRef}
                  url={currentTrailer.videoUrl}
                  controls
                  muted={muted}
                  width="100%"
                  height="100%"
                  playing={false}
                  config={{ youtube: { playerVars: { modestbranding: 1, rel: 0 } } }}
                />
              </div>
            ) : (
              <div className="ts-no-video">
                <Play size={28} strokeWidth={1.2} /><span>No video available</span>
              </div>
            )}

            <div className="ts-player-overlay" />
          </div>

          <div className="ts-meta">
            <span key={titleKey} className="ts-movie-title">
              {currentTrailer?.title || 'Official Trailer'}
            </span>
            <div className="ts-meta-right">
              {currentTrailer?.genres?.length > 0 && (
                <span className="ts-meta-pill">
                  {currentTrailer.genres.slice(0, 2).map((g) => g.name).join(' • ')}
                </span>
              )}
              <button className="ts-icon-btn" onClick={() => setMuted((m) => !m)} title={muted ? 'Unmute' : 'Mute'}>
                {muted ? <VolumeX size={13} strokeWidth={1.8} /> : <Volume2 size={13} strokeWidth={1.8} />}
              </button>
              <button className="ts-icon-btn" onClick={handleFullscreen} title="Fullscreen">
                <Maximize2 size={13} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </div>

        <div className="ts-rail">
          {trailers.map((trailer) => {
            const isActive = trailer._id === currentTrailer?._id || trailer.videoUrl === currentTrailer?.videoUrl
            return (
              <div
                key={trailer._id || trailer.videoUrl}
                className={`ts-thumb ${isActive ? 'active' : ''}`}
                onClick={() => handleSelect(trailer)}
              >
                <img
                  src={trailer.image || '/backgroundImage.png'}
                  alt={trailer.title || ''}
                  onError={(e) => { e.target.src = '/backgroundImage.png' }}
                />
                <div className="ts-thumb-play">
                  <div className="ts-thumb-play-inner">
                    <Play size={13} fill="white" strokeWidth={0} />
                  </div>
                </div>
                {trailer.title && <div className="ts-thumb-label">{trailer.title}</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default TrailerSection