import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import DashboardHeader from './DashboardHeader.jsx';
import RoleSidebar from './RoleSidebar.jsx';
import Icon from './icons.jsx';

function readCollapsed() {
  try {
    return JSON.parse(localStorage.getItem('hub.navCollapsed') || 'false');
  } catch {
    return false;
  }
}

/**
 * Staff shell: navy role sidebar + minimal shared header. Replaces the old
 * network-wide command layout so each role only sees its own modules.
 */
export default function AppLayout() {
  const { role, toasts, dismissToast } = useApp();
  const [navOpen, setNavOpen] = useState(false);
  const [rail, setRail] = useState(readCollapsed);
  const location = useLocation();

  useEffect(() => {
    try {
      localStorage.setItem('hub.navCollapsed', JSON.stringify(rail));
    } catch {
      /* ignore */
    }
  }, [rail]);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setNavOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={`mc-shell ${rail ? 'rail' : ''}`}>
      <a className="skip-link" href="#main">Skip to main content</a>
      {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />}
      <RoleSidebar
        role={role}
        open={navOpen}
        rail={rail}
        onToggleRail={() => setRail((v) => !v)}
        onClose={() => setNavOpen(false)}
      />
      <div className="mc-main">
        <DashboardHeader onToggleNav={() => setNavOpen((v) => !v)} navOpen={navOpen} />
        <div className="mc-demo-strip" role="note">
          <Icon name="shield" size={14} />
          <span>Demo mode: mock sign-in and synthetic data. Role limits are enforced by the API, not production-grade auth.</span>
        </div>
        <main id="main" className="mc-page" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="mc-footer">
          <span>MediCore · One citizen, one record</span>
          <span>Emergency? Call <strong>108</strong></span>
        </footer>
      </div>

      <div className="toast-region" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast" role="alert">
            <Icon name="checkCircle" size={18} />
            <span style={{ flex: 1 }}>{t.message}</span>
            {t.actionLabel && (
              <button type="button" onClick={() => { t.onAction?.(); dismissToast(t.id); }}>
                {t.actionLabel}
              </button>
            )}
            <button type="button" onClick={() => dismissToast(t.id)} aria-label="Dismiss notification">
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
