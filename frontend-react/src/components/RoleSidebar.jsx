import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ROLE_BLURB, ROLE_LABEL, ROLE_NAV, homeFor } from '../config/navigation.js';
import { useApp } from '../context/AppContext.jsx';
import Icon from './icons.jsx';

/**
 * Role-only sidebar. The item list is derived from navigation.js so no role can
 * see another role's modules; ProtectedRoute and the backend enforce the same
 * boundary if a URL is typed by hand.
 */
export default function RoleSidebar({ role, open, rail, onToggleRail, onClose }) {
  const { auth, logout, pushToast } = useApp();
  const navigate = useNavigate();
  const groups = ROLE_NAV[role] || [];
  const label = ROLE_LABEL[role] || role;

  function doLogout() {
    const name = auth?.name || label;
    logout();
    pushToast(`Signed out ${name} - demo session cleared.`);
    navigate('/', { replace: true });
  }

  return (
    <aside className={`mc-sidebar ${open ? 'open' : ''} ${rail ? 'rail' : ''}`} aria-label="Role navigation">
      <div className="mc-brand">
        <Link to={homeFor(role)} className="mc-brand-link" onClick={onClose}>
          <span className="mc-emblem" aria-hidden="true"><Icon name="plus" size={22} /></span>
          <span className="mc-brand-text">
            <strong>MediCore</strong>
            <small>{ROLE_BLURB[role] || 'Hospital management'}</small>
          </span>
        </Link>
        <button
          type="button"
          className="mc-rail-btn"
          onClick={onToggleRail}
          aria-label={rail ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-pressed={rail}
          title="Collapse to icons"
        >
          <Icon name={rail ? 'chevronRight' : 'chevronLeft'} size={14} />
        </button>
      </div>

      <div className="mc-role-chip">
        <span aria-hidden="true"><Icon name="shield" size={14} /></span>
        <span>{label}</span>
      </div>

      <nav className="mc-nav" aria-label="Modules">
        {groups.map((group) => (
          <div key={group.label} className="mc-nav-group">
            <div className="mc-nav-label">{group.label}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) => `mc-nav-link ${isActive ? 'active' : ''}`}
                title={rail ? item.label : undefined}
              >
                <span className="mc-nav-icon" aria-hidden="true"><Icon name={item.icon} size={19} /></span>
                <span className="mc-nav-text">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="mc-sidebar-foot">
        <Link to="/profile" className="mc-side-user" onClick={onClose} title={rail ? 'Profile' : undefined}>
          <span className="mc-side-avatar" aria-hidden="true">
            {String(auth?.name || label).split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
          </span>
          <span className="mc-side-meta">
            <strong>{auth?.name || 'Demo session'}</strong>
            <small>{label}</small>
          </span>
        </Link>
        <button type="button" className="mc-side-logout" onClick={doLogout} title={rail ? 'Logout' : undefined}>
          <Icon name="logout" size={17} />
          <span>Logout</span>
        </button>
        <p className="mc-demo-note">Demo build · synthetic data only</p>
      </div>
    </aside>
  );
}
