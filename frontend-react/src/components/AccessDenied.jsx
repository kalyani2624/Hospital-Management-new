import { Link } from 'react-router-dom';
import { ROLE_LABEL, homeFor } from '../config/navigation.js';
import { useApp } from '../context/AppContext.jsx';
import Icon from './icons.jsx';

/**
 * Friendly 403 shown instead of a blank screen when a role opens a route that
 * is outside its responsibilities. The backend enforces the same boundary.
 */
export default function AccessDenied({ message }) {
  const { role } = useApp();
  return (
    <div className="card denied-card" role="alert">
      <span className="denied-icon" aria-hidden="true"><Icon name="shield" size={28} /></span>
      <h2>This area is not part of your role</h2>
      <p className="hint">
        {message || `Signed in as ${ROLE_LABEL[role] || role}. This page belongs to another role in the demo.`}
      </p>
      <div className="denied-actions">
        <Link className="btn btn-primary" to={homeFor(role)}>Back to my dashboard</Link>
        <Link className="btn btn-ghost" to="/profile">My profile</Link>
      </div>
      <p className="hint demo-honesty">
        Demo note: role checks are enforced on the API too, but the demo identity travels in
        client headers and is not production-grade security.
      </p>
    </div>
  );
}
