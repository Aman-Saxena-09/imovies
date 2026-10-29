import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Movies from './pages/Movies';
import MovieDetails from './pages/MovieDetails';
import AuthPage from './pages/AuthPage';
import SeatSelection from './pages/SeatSelection';
import BookingReview from './pages/BookingReview';
import BookingConfirmation from './pages/BookingConfirmation';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminManage from './pages/AdminManage';
import AdminBookings from './pages/AdminBookings';
import NotFound from './pages/NotFound';

function Shell() {
  const location = useLocation(); const isAuth = ['/login', '/register'].includes(location.pathname);
  return <div className={isAuth ? 'app-shell auth-shell' : 'app-shell'}>{!isAuth && <Navbar/>}<div className="route-content"><Routes>
    <Route path="/" element={<Home/>}/><Route path="/movies" element={<Movies/>}/><Route path="/movies/:id" element={<MovieDetails/>}/>
    <Route path="/login" element={<AuthPage mode="login"/>}/><Route path="/register" element={<AuthPage mode="register"/>}/>
    <Route element={<ProtectedRoute/>}><Route path="/profile" element={<Profile/>}/><Route path="/my-bookings" element={<MyBookings/>}/><Route path="/booking/seats/:showtimeId" element={<SeatSelection/>}/><Route path="/booking/review" element={<BookingReview/>}/><Route path="/booking/confirmation/:bookingId" element={<BookingConfirmation/>}/></Route>
    <Route element={<ProtectedRoute admin/>}><Route path="/admin" element={<AdminDashboard/>}/><Route path="/admin/:resource" element={<AdminManage/>}/><Route path="/admin/bookings" element={<AdminBookings/>}/></Route>
    <Route path="*" element={<NotFound/>}/>
  </Routes></div>{!isAuth && <Footer/>}</div>;
}
export default function App() { return <BrowserRouter><ToastProvider><AuthProvider><Shell/></AuthProvider></ToastProvider></BrowserRouter>; }
