import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Loader from '../components/common/Loader';

export default function ProtectedRoute() {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  if (loading) return <Loader fullPage label="Verification de la session…" />;
  if (!isAuthenticated) return <Navigate to="/connexion" replace state={{ from: location }} />;
  if (user?.must_change_password && location.pathname !== '/premiere-connexion') return <Navigate to="/premiere-connexion" replace />;
  return <Outlet />;
}
