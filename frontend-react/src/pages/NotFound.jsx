import { Link, useLocation } from 'react-router-dom';
import Icon from '../components/icons.jsx';

export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <div className="auth-split">
      <div className="auth-brand">
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span className="emblem" aria-hidden="true"><Icon name="plus" size={24} /></span>
            <div><strong style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>Govt Hospital Hub</strong><div style={{ color: '#C7D2FE', fontSize: 13 }}>Lost &amp; found</div></div>
          </div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', marginTop: 28, color: '#fff' }}>Even the best hospitals have a wrong turn.</h2>
          <p style={{ color: '#E0E7FF' }}>The ward you asked for does not exist — but Central Command is one click away.</p>
        </div>
        <div className="quote-card">Tip: press <kbd style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}>/</kbd> anywhere to search any centralId.</div>
      </div>
      <div className="auth-form-col">
        <div className="auth-card notfound">
          <div className="nf-art" aria-hidden="true"><Icon name="building" size={52} /></div>
          <p className="eyebrow" style={{ color: 'var(--color-primary)' }}>Error 404 · Ward not found</p>
          <h1 style={{ fontSize: 'clamp(48px,6vw,72px)', lineHeight: 1 }}>404</h1>
          <h2>This ward does not exist</h2>
          <hr className="ashoka-v2" aria-hidden="true" />
          <p className="hint">No page at <code>{pathname}</code>. The link may be old, or the section moved when the landing page took over <code>#/</code>.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            <Link className="btn btn-primary btn-lg" to="/"><Icon name="globe" size={16} /> Back to landing</Link>
            <Link className="btn btn-lg" to="/dashboard"><Icon name="dashboard" size={16} /> Open dashboard</Link>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); const v = new FormData(e.target).get('q'); if (v) window.location.hash = `#/patients/${encodeURIComponent(v)}`; }} role="search" aria-label="Search CentralId" style={{ marginTop: 14 }}>
            <label className="field-label" htmlFor="nf-q">Search CentralId instead</label>
            <div style={{ display: 'flex', gap: 8 }}><input id="nf-q" name="q" placeholder="MH-2026-004213" style={{ fontFamily: 'var(--font-mono)' }} /><button className="btn btn-primary">Go</button></div>
          </form>
          <p className="hint" style={{ marginTop: 12 }}>Shortcuts: <Link to="/patients">Patients</Link> · <Link to="/appointments">Appointments</Link> · <Link to="/beds">Beds</Link> · <Link to="/help">Help</Link></p>
        </div>
      </div>
    </div>
  );
}
