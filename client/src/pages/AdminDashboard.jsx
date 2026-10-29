import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, Clapperboard, Film, MapPin, Ticket, Users, Wallet } from 'lucide-react';
import { api, getData } from '../services/api';
import Spinner from '../components/Spinner';
const sections = [
  { to: '/admin/movies', icon: Film, title: 'Movies', text: 'Add films, manage details, languages and release status.' },
  { to: '/admin/cinemas', icon: MapPin, title: 'Cinemas', text: 'Manage cinema locations, facilities and screens.' },
  { to: '/admin/showtimes', icon: CalendarClock, title: 'Showtimes', text: 'Schedule screenings and configure seat inventory.' },
  { to: '/admin/bookings', icon: Ticket, title: 'Bookings', text: 'Review bookings and handle eligible cancellations.' }
];
export default function AdminDashboard() {
  const [stats, setStats] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.get('/admin/dashboard').then(r => setStats(getData(r).stats)).catch(e => setError(e.userMessage || 'Could not load dashboard.')); }, []);
  return <main className="page-shell container-wide admin-shell"><div className="page-kicker"><span className="eyebrow"><span className="eyebrow-dot"/> IMOVIES / MANAGEMENT</span><span>ADMIN DASHBOARD</span></div><div className="page-title-row"><div><h1>Behind the <em>big screen.</em></h1><p>Manage your cinema catalogue and keep every booking running smoothly.</p></div><span className="admin-badge"><span className="live-dot"/> ADMIN ACCESS</span></div>
    {error && <div className="notice-error">{error}</div>}{!stats && !error ? <Spinner label="Loading your dashboard..."/> : stats && <div className="stats-grid"><div className="stat-card"><span><Users size={19}/></span><small>REGISTERED USERS</small><strong>{stats.users}</strong><p>Member accounts</p></div><div className="stat-card"><span><Film size={19}/></span><small>MOVIES</small><strong>{stats.movies}</strong><p>In the catalogue</p></div><div className="stat-card"><span><CalendarClock size={19}/></span><small>UPCOMING SHOWTIMES</small><strong>{stats.upcomingShowtimes}</strong><p>Ready to book</p></div><div className="stat-card"><span><Ticket size={19}/></span><small>CONFIRMED BOOKINGS</small><strong>{stats.confirmed}</strong><p>{stats.cancelled} cancelled</p></div><div className="stat-card stat-highlight"><span><Wallet size={19}/></span><small>DEMO BOOKING VALUE</small><strong>₹{stats.demoRevenue.toLocaleString('en-IN')}</strong><p>Not actual payment revenue</p></div></div>}
    <div className="admin-section-heading"><div><h2>Manage your platform</h2><p>Choose an area to view or update.</p></div><Clapperboard size={24}/></div><div className="admin-links-grid">{sections.map(s => <Link to={s.to} className="admin-link-card" key={s.to}><span className="admin-link-icon"><s.icon size={21}/></span><h3>{s.title}</h3><p>{s.text}</p><span className="admin-link-action">Open management <ArrowRight size={15}/></span></Link>)}</div>
  </main>;
}
