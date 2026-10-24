import { Link, useLocation } from 'react-router-dom';

const LABELS = {
  dashboard: 'Dashboard',
  hospitals: 'Hospitals',
  doctors: 'Doctors',
  patients: 'Patients',
  appointments: 'Appointments',
  referrals: 'Referrals',
  beds: 'Beds',
  records: 'Records',
  reports: 'Reports',
  profile: 'Profile',
  settings: 'Settings',
  help: 'Help',
  login: 'Login',
  signup: 'Sign up',
  forgot: 'Reset password',
};

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;
  let acc = '';
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <Link to="/dashboard">Home</Link>
      {parts.map((p, i) => {
        acc += `/${p}`;
        const last = i === parts.length - 1;
        const label = LABELS[p] || (/^\d+$/.test(p) ? `#${p}` : decodeURIComponent(p));
        return (
          <span key={acc} className="crumb-sep">
            <span aria-hidden="true"> / </span>
            {last ? (
              <span aria-current="page" className="crumb-current">{label}</span>
            ) : (
              <Link to={acc}>{label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
