import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

/** Patient portal guard: only an active patient session may pass. */
export default function PatientRoute() {
  const { isPatient } = useApp();
  const loc = useLocation();
  if (!isPatient) {
    return <Navigate to={`/patient/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  }
  return <Outlet />;
}