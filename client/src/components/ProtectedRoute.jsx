import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';
export default function ProtectedRoute({ admin = false }) {
  const { user, loading } = useAuth(); const location = useLocation();
  if (loading) return <Spinner label="Checking your session..."/>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (admin && user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <Outlet/>;
}
