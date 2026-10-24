import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import Icon from './icons.jsx';
import { Avatar } from './ui.jsx';

const NAV = [
  { to: '/patient', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/patient/book', label: 'Book Appointment', icon: 'calendar', end: false },
  { to: '/patient/appointments', label: 'My Appointments', icon: 'clock', end: false },
  { to: '/patient/profile', label: 'My Profile', icon: 'user', end: false },
];

export default function PatientLayout() {
  const { patient, logout, pushToast } = useApp();
  const navigate = useNavigate();

  const doLogout = () => {
    logout();
    pushToast('Signed out of the patient portal.');
    navigate('/patient/login');
  };

  return (
    <div className="portal-shell">
      <aside className="portal-side" aria-label="Patient portal navigation">
        <div className="brand">
          <Avatar name={patient?.name} size="lg" ring />
          <div>
            <strong style={{ color: '#fff', fontSize: 16 }}>MediCore</strong>
            <small>Patient portal</small>
          </div>
        </div>
        <nav className="portal-nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icon name={n.icon} size={18} /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="portal-extra">
          <div style={{ flex: 1 }} />
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#A5B4FC', textDecoration: 'none', padding: '11px 12px', borderRadius: 12, fontWeight: 700, fontSize: 14.5 }}>
            <Icon name="globe" size={18} /> Public site
          </NavLink>
          <a href="#/emergency" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#FCA5A5', textDecoration: 'none', padding: '11px 12px', borderRadius: 12, fontWeight: 700, fontSize: 14.5 }}>
            <Icon name="heart" size={18} /> Emergency 108
          </a>
          <button type="button" onClick={doLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'rgba(255,255,255,.08)', color: '#E0E7FF', border: 0, borderRadius: 12, padding: '11px 12px', fontWeight: 800, fontSize: 14.5, cursor: 'pointer', marginTop: 8 }}>
            <Icon name="logout" size={18} /> Sign out
          </button>
        </div>
      </aside>

      <main className="portal-main">
        <div className="portal-top">
          <div className="portal-who">
            <Avatar name={patient?.name} size="lg" ring />
            <div>
              <strong style={{ fontSize: 17 }}>{patient?.name}</strong>
              <div className="hint" style={{ margin: 0 }}>{patient?.centralId} · Mobile {patient?.phone}</div>
            </div>
          </div>
          <span className="badge-demo"><Icon name="shield" size={14} /> Demo log-in — mobile #, no password</span>
        </div>
        <Outlet />
      </main>
    </div>
  );
}