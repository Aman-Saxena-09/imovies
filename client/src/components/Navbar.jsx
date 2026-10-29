import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Clapperboard, Ticket, LogOut, Menu, X, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
export default function Navbar() {
  const { user, logout } = useAuth(); const toast = useToast(); const navigate = useNavigate(); const [open, setOpen] = useState(false);
  const handleLogout = async () => { await logout(); toast('You have been logged out.'); setOpen(false); navigate('/'); };
  const close = () => setOpen(false);
  return <header className="site-header"><div className="nav-inner container-wide">
    <Link className="brand" to="/" onClick={close}><span className="brand-icon"><Clapperboard size={21}/></span><span>i<span className="brand-accent">Movies</span><small>YOUR NEXT GREAT STORY</small></span></Link>
    <button className="mobile-menu" onClick={() => setOpen(v => !v)} aria-label="Toggle navigation">{open ? <X/> : <Menu/>}</button>
    <nav className={`nav-links ${open ? 'nav-open' : ''}`}>
      <NavLink to="/movies" onClick={close}>Explore films</NavLink>
      {user && <NavLink to="/my-bookings" onClick={close}><Ticket size={16}/> My bookings</NavLink>}
      {user?.role === 'ADMIN' && <NavLink to="/admin" onClick={close}><ShieldCheck size={16}/> Admin</NavLink>}
      {user ? <div className="nav-user"><span className="avatar-small">{user.name?.slice(0, 1).toUpperCase()}</span><Link className="user-name" to="/profile" onClick={close}>{user.name?.split(' ')[0]}</Link><button className="icon-button" title="Log out" onClick={handleLogout}><LogOut size={17}/></button></div> : <><Link className="nav-login" to="/login" onClick={close}>Sign in</Link><Link className="btn btn-accent btn-nav" to="/register" onClick={close}>Get started <span>↗</span></Link></>}
    </nav>
  </div></header>;
}
