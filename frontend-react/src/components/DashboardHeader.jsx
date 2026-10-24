import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROLE_LABEL } from '../config/navigation.js';
import { useApp } from '../context/AppContext.jsx';
import { Avatar } from './ui.jsx';
import Icon from './icons.jsx';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/admin/hospitals': 'Hospitals',
  '/admin/administrators': 'Hospital Administrators',
  '/admin/doctors': 'Doctors Overview',
  '/admin/beds': 'Bed Availability',
  '/admin/referrals': 'Referrals Overview',
  '/admin/reports': 'Reports & Analytics',
  '/settings': 'Settings',
  '/hospital/departments': 'Departments',
  '/hospital/doctors': 'Doctors',
  '/hospital/patients': 'Patients Overview',
  '/hospital/appointments': 'Appointments Overview',
  '/hospital/beds': 'Bed Management',
  '/hospital/referrals': 'Referrals',
  '/hospital/reports': 'Reports',
  '/doctor/appointments': 'My Appointments',
  '/doctor/patients': 'My Patients',
  '/doctor/history': 'Consultation History',
  '/records': 'Medical Records',
  '/reception/register': 'Register Patient',
  '/reception/patients': 'Patient Directory',
  '/reception/book': 'Book Appointment',
  '/reception/appointments': 'Manage Appointments',
  '/profile': 'Profile',
};

function titleFor(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/patients/')) return 'Patient History';
  if (pathname.startsWith('/patients')) return 'Patient Directory';
  return 'MediCore';
}

/**
 * Minimal shared header: branding, current page title, signed-in user, role
 * and two account actions. No cross-role navigation lives here.
 */
export default function DashboardHeader({ onToggleNav, navOpen }) {
  const { auth, role, logout, pushToast } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const label = ROLE_LABEL[role] || role;
  const hospital = auth?.hospitalName || '';

  function doLogout() {
    const name = auth?.name || label;
    logout();
    pushToast(`Signed out ${name} - demo session cleared.`);
    navigate('/', { replace: true });
  }

  return (
    <header className="mc-header">
      <button
        type="button"
        className="mc-menu-btn"
        onClick={onToggleNav}
        aria-label="Toggle navigation"
        aria-expanded={navOpen}
      >
        <Icon name="menu" size={20} />
      </button>
      <div className="mc-header-title">
        <span className="mc-eyebrow">MediCore</span>
        <h1>{titleFor(location.pathname)}</h1>
      </div>
      <div className="mc-header-user">
        <span className="mc-user-avatar"><Avatar name={auth?.name || label} size="sm" /></span>
        <span className="mc-user-meta">
          <strong>{auth?.name || 'Demo session'}</strong>
          <small>{label}{hospital ? ` · ${hospital}` : ''}</small>
        </span>
        <Link className="btn btn-sm btn-ghost mc-profile-link" to="/profile">
          <Icon name="user" size={15} /> Profile
        </Link>
        <button type="button" className="btn btn-sm mc-logout-btn" onClick={doLogout}>
          <Icon name="logout" size={15} /> Logout
        </button>
      </div>
    </header>
  );
}
