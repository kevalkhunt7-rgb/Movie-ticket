import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Film,
  Calendar,
  Ticket,
  Users,
  Activity,
  ArrowUpRight,
  ArrowRight,
  Clapperboard
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { movieAPI, bookingAPI, authAPI } from '../services/api'
import toast from 'react-hot-toast'

// ─── helpers ────────────────────────────────────────────────────────────────

const groupByMonth = (bookings) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const map = {}
  months.forEach(m => { map[m] = { revenue: 0, bookings: 0 } })
  bookings.forEach(b => {
    const d = new Date(b.createdAt || b.show?.showDateTime)
    if (isNaN(d)) return
    const m = months[d.getMonth()]
    if (b.paymentStatus === 'completed') map[m].revenue += b.totalAmount || 0
    map[m].bookings += 1
  })
  // return only months that have any data or the last 6
  const result = months.map(name => ({ name, ...map[name] }))
  const nonZero = result.findLastIndex(r => r.revenue > 0 || r.bookings > 0)
  return nonZero < 5 ? result.slice(0, 6) : result.slice(0, nonZero + 1)
}

const COLORS = ['#f59e0b', '#10b981', '#6366f1', '#ef4444']

// ─── custom tooltip ──────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(15,15,25,0.95)',
      border: '1px solid rgba(245,158,11,0.3)',
      borderRadius: 10,
      padding: '10px 16px',
      fontSize: 13,
      color: '#fff',
      backdropFilter: 'blur(8px)'
    }}>
      <p style={{ color: '#f59e0b', fontWeight: 700, marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color || '#fff' }}>
          {p.name === 'revenue' ? `₹${p.value.toLocaleString()}` : `${p.value} bookings`}
        </p>
      ))}
    </div>
  )
}

// ─── main component ──────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalMovies: 0,
    totalShows: 0,
    totalBookings: 0,
    totalUsers: 0,
    totalRevenue: 0,
    recentBookings: [],
    allBookings: []
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('revenue')

  useEffect(() => { fetchDashboardData() }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [moviesRes, bookingsRes, usersRes] = await Promise.all([
        movieAPI.getAllMovies(),
        bookingAPI.getAllBookings({ limit: 100 }),
        authAPI.getAllUsers()
      ])
      const movies   = moviesRes.data.movies   || []
      const bookings = bookingsRes.data.bookings || []
      const users    = usersRes.data.users      || []
      const totalRevenue = bookings.reduce(
        (sum, b) => b.paymentStatus === 'completed' ? sum + b.totalAmount : sum, 0
      )
      setStats({
        totalMovies: movies.length,
        totalShows: 0,
        totalBookings: bookingsRes.data.total || bookings.length,
        totalUsers: users.length,
        totalRevenue,
        recentBookings: bookings.slice(0, 6),
        allBookings: bookings
      })
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const chartData   = groupByMonth(stats.allBookings)
  const statusPie   = [
    { name: 'Completed', value: stats.allBookings.filter(b => b.paymentStatus === 'completed').length },
    { name: 'Pending',   value: stats.allBookings.filter(b => b.paymentStatus === 'pending').length },
    { name: 'Failed',    value: stats.allBookings.filter(b => b.paymentStatus === 'failed').length },
  ].filter(d => d.value > 0)

  const statCards = [
    { label: 'Movies',   value: stats.totalMovies,   icon: Film,     accent: '#6366f1', link: '/admin/movies'   },
    { label: 'Shows',    value: stats.totalShows,    icon: Calendar, accent: '#10b981', link: '/admin/shows'    },
    { label: 'Bookings', value: stats.totalBookings, icon: Ticket,   accent: '#f59e0b', link: '/admin/bookings' },
    { label: 'Users',    value: stats.totalUsers,    icon: Users,    accent: '#ef4444', link: '/admin/users'    },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '3px solid transparent',
        borderTopColor: '#f59e0b',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: '#fff', padding: '8px 0' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        .stat-card:hover { transform: translateY(-3px); border-color: var(--accent) !important; }
        .stat-card:hover .stat-icon { transform: scale(1.12); }
        .action-card:hover { transform: translateY(-2px); border-color: var(--a) !important; }
        .booking-row:hover { background: rgba(255,255,255,0.04); }
        .tab-btn { transition: all .2s; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #0f0f18; }
        ::-webkit-scrollbar-thumb { background: #2a2a3d; border-radius: 99px; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Clapperboard size={28} color="#f59e0b" />
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
              Dashboard
            </h1>
          </div>
          <p style={{ margin: 0, color: '#64647a', fontSize: 14 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 12, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: '#f59e0b'
        }}>
          Admin Panel
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {statCards.map(s => {
          const Icon = s.icon
          return (
            <Link key={s.label} to={s.link} style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{
                '--accent': s.accent,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16,
                padding: '22px 20px',
                transition: 'all .25s',
                cursor: 'pointer'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, color: '#64647a', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 34, fontWeight: 700, lineHeight: 1, fontFamily: "'Syne', sans-serif" }}>{s.value}</p>
                  </div>
                  <div className="stat-icon" style={{
                    background: `${s.accent}18`,
                    border: `1px solid ${s.accent}30`,
                    borderRadius: 10, padding: 10, transition: 'transform .25s'
                  }}>
                    <Icon size={20} color={s.accent} />
                  </div>
                </div>
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: s.accent }}>
                  <ArrowRight size={13} /> <span>View all</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* ── Revenue Banner ── */}
      <div style={{
        background: 'linear-gradient(120deg, #92400e 0%, #78350f 40%, #1c1c2e 100%)',
        borderRadius: 18, padding: '28px 32px', marginBottom: 24,
        border: '1px solid rgba(245,158,11,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', right: -40, top: -40,
          width: 220, height: 220,
          background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />
        <div>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>TOTAL REVENUE</p>
          <p style={{ margin: '8px 0 4px', fontFamily: "'Syne', sans-serif", fontSize: 42, fontWeight: 800, lineHeight: 1 }}>
            ₹{stats.totalRevenue.toLocaleString()}
          </p>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>From all completed bookings</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{
            background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.35)',
            borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6
          }}>
            <ArrowUpRight size={16} color="#f59e0b" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>Live Stats</span>
          </div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 24 }}>

        {/* Area / Bar chart */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 18, padding: '24px 24px 16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700 }}>Revenue & Bookings</h2>
            <div style={{ display: 'flex', gap: 6 }}>
              {['revenue', 'bookings'].map(t => (
                <button key={t} className="tab-btn" onClick={() => setActiveTab(t)} style={{
                  background: activeTab === t ? 'rgba(245,158,11,0.15)' : 'transparent',
                  border: `1px solid ${activeTab === t ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  color: activeTab === t ? '#f59e0b' : '#64647a',
                  borderRadius: 8, padding: '5px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize'
                }}>{t}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            {activeTab === 'revenue' ? (
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#64647a', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64647a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000)+'k' : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="revenue" stroke="#f59e0b" strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: '#f59e0b', r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#64647a', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64647a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="bookings" name="bookings" fill="#6366f1" radius={[5, 5, 0, 0]} maxBarSize={36} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 18, padding: '24px'
        }}>
          <h2 style={{ margin: '0 0 20px', fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700 }}>Payment Status</h2>
          {statusPie.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusPie} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                    paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {statusPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                {statusPie.map((entry, i) => (
                  <div key={entry.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length] }} />
                      <span style={{ fontSize: 13, color: '#a0a0b0' }}>{entry.name}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#64647a', fontSize: 14 }}>
              No booking data yet
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { to: '/admin/movies/add', icon: Film,     color: '#6366f1', label: 'Add New Movie',    sub: 'Create a movie entry' },
          { to: '/admin/shows/add',  icon: Calendar, color: '#10b981', label: 'Schedule Show',    sub: 'Add a new show time'   },
          { to: '/admin/bookings',   icon: Activity, color: '#f59e0b', label: 'View Bookings',    sub: 'Check recent activity' },
        ].map(a => {
          const Icon = a.icon
          return (
            <Link key={a.to} to={a.to} style={{ textDecoration: 'none' }}>
              <div className="action-card" style={{
                '--a': a.color,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '18px 20px',
                display: 'flex', alignItems: 'center', gap: 14,
                transition: 'all .22s', cursor: 'pointer'
              }}>
                <div style={{ background: `${a.color}18`, border: `1px solid ${a.color}30`, borderRadius: 10, padding: 10, flexShrink: 0 }}>
                  <Icon size={20} color={a.color} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{a.label}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64647a' }}>{a.sub}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* ── Recent Bookings ── */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 18, overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <h2 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700 }}>Recent Bookings</h2>
          <Link to="/admin/bookings" style={{
            fontSize: 13, color: '#f59e0b', textDecoration: 'none', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 4
          }}>
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {stats.recentBookings.length > 0 ? (
          <div>
            {/* Table Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 110px',
              padding: '10px 24px', fontSize: 11, fontWeight: 600,
              color: '#64647a', textTransform: 'uppercase', letterSpacing: '0.07em',
              borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
              <span>Movie</span>
              <span>Seats</span>
              <span>Date</span>
              <span style={{ textAlign: 'right' }}>Amount</span>
            </div>
            {stats.recentBookings.map((b, idx) => (
              <div key={b._id} className="booking-row" style={{
                display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 110px',
                padding: '14px 24px', alignItems: 'center',
                borderBottom: idx < stats.recentBookings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                transition: 'background .15s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: 8, padding: 7, flexShrink: 0
                  }}>
                    <Ticket size={14} color="#f59e0b" />
                  </div>
                  <span style={{ fontWeight: 500, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {b.movie?.title || '—'}
                  </span>
                </div>
                <span style={{ fontSize: 13, color: '#a0a0b0' }}>{b.bookedSeats?.join(', ') || '—'}</span>
                <span style={{ fontSize: 13, color: '#a0a0b0' }}>
                  {b.show?.showDateTime ? new Date(b.show.showDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                </span>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>₹{b.totalAmount?.toLocaleString()}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                    background: b.paymentStatus === 'completed' ? 'rgba(16,185,129,0.15)' : b.paymentStatus === 'pending' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                    color: b.paymentStatus === 'completed' ? '#10b981' : b.paymentStatus === 'pending' ? '#f59e0b' : '#ef4444'
                  }}>
                    {b.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 48, textAlign: 'center', color: '#64647a' }}>
            <Ticket size={40} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            <p style={{ margin: 0 }}>No recent bookings</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard