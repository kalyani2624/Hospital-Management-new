import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import AccessDenied from './AccessDenied.jsx';

/**
 * Guards staff routes. Unauthenticated users are sent to /login with `?next=`.
 * A role outside the allow-list sees a friendly 403 (and the API enforces the
 * same boundary, so a typed URL cannot reach another role's data).
 */
export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, role } = useApp();
  const location = useLocation();

  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search + location.hash);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (Array.isArray(roles) && roles.length > 0 && !roles.includes(role)) {
    return <AccessDenied message={`You are signed in as ${role}; this page needs ${roles.join(' or ')}.`} />;
  }

  return <Outlet />;
}
