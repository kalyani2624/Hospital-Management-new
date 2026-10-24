import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import Icon from './icons.jsx';

function applyFontSize(dir) {
  try {
    const cur = Number(localStorage.getItem('hub.fontScale') || '100');
    const next = dir === 'up' ? Math.min(125, cur + 12) : dir === 'down' ? Math.max(87, cur - 12) : 100;
    localStorage.setItem('hub.fontScale', String(next));
    document.documentElement.style.fontSize = `${(16 * next) / 100}px`;
  } catch { /* ignore */ }
}

function toggleContrast() {
  try {
    const on = localStorage.getItem('hub.highContrast') === '1';
    localStorage.setItem('hub.highContrast', on ? '0' : '1');
    document.documentElement.classList.toggle('hc', !on);
  } catch { /* ignore */ }
}

export function EmergencyStrip() {
  const { pushToast } = useApp();
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('hub.lang') || 'EN'; } catch { return 'EN'; }
  });
  function setL(l) {
    setLang(l);
    try { localStorage.setItem('hub.lang', l); } catch { /* ignore */ }
    if (l !== 'EN') pushToast(`${l === 'HI' ? 'हिन्दी' : 'मराठी'} support — key actions stay in English for safety. Full translation soon.`);
  }
  useEffect(() => {
    try {
      const fs = Number(localStorage.getItem('hub.fontScale') || '100');
      if (fs !== 100) document.documentElement.style.fontSize = `${(16 * fs) / 100}px`;
      if (localStorage.getItem('hub.highContrast') === '1') document.documentElement.classList.add('hc');
    } catch { /* ignore */ }
  }, []);
  return (
    <div className="emg-strip" role="alert" aria-label="Emergency helplines">
      <div className="emg-inner">
        <span className="emg-left">
          <span className="emg-flash" aria-hidden="true"><Icon name="alert" size={14} /></span>
          <strong>Emergency</strong>
          <a href="tel:108">108</a><span aria-hidden="true">·</span>
          <span>Ambulance <a href="tel:102">102</a></span><span aria-hidden="true">·</span>
          <span>Ayushman <a href="tel:14555">14555</a></span>
          <a className="emg-call" href="tel:108"><Icon name="phone" size={14} /> Call now</a>
          <a className="emg-wa" href="https://wa.me/911022489877" target="_blank" rel="noreferrer"><Icon name="chat" size={14} /> WhatsApp</a>
        </span>
        <span className="emg-right">
          <span className="emg-langs" role="group" aria-label="Language">
            {[['EN', 'EN'], ['HI', 'हिं'], ['MR', 'मराठी']].map(([v, l]) => (
              <button key={v} type="button" className={lang === v ? 'on' : ''} aria-pressed={lang === v} onClick={() => setL(v)}>{l}</button>
            ))}
          </span>
          <span className="emg-a11y" role="group" aria-label="Text size and contrast">
            <button type="button" onClick={() => applyFontSize('down')} aria-label="Decrease text size">A-</button>
            <button type="button" onClick={() => applyFontSize('reset')} aria-label="Reset text size">A</button>
            <button type="button" onClick={() => applyFontSize('up')} aria-label="Increase text size">A+</button>
            <button type="button" onClick={toggleContrast} aria-label="Toggle high contrast"><Icon name="eye" size={14} /></button>
          </span>
        </span>
      </div>
    </div>
  );
}

export function GovStrip() {
  return (
    <div className="pub-gov" role="note" aria-label="Government banner">
      <span><strong>Ministry of Health &amp; Family Welfare</strong> · ABDM-compliant · ABHA-ready</span>
      <span className="pub-gov-links">
        <a href="https://healthid.abdm.gov.in/" target="_blank" rel="noreferrer">ABHA login</a>
        <span aria-hidden="true">·</span>
        <Link to="/patient/login">Patient portal</Link>
        <span aria-hidden="true">·</span>
        <Link to="/login">Staff login</Link>
        <span aria-hidden="true">·</span>
        <Link to="/help">Help &amp; FAQ</Link>
      </span>
    </div>
  );
}

const PUB_NAV = [
  { to: '/hospitals', label: 'Hospitals' },
  { to: '/doctors', label: 'Doctors' },
  { to: '/appointments', label: 'Appointments' },
  { to: '/schemes', label: 'Schemes' },
  { to: '/reports', label: 'Reports' },
  { to: '/help', label: 'Help' },
];

export function PublicHeader() {
  const { isAuthenticated, role, auth, logout, pushToast } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  function doLogout() {
    logout();
    pushToast('Signed out — session cleared.');
    navigate('/', { replace: true });
  }
  return (
    <header className="pub-header" role="banner">
      <div className="pub-header-inner">
        <Link to="/" className="pub-brand" aria-label="Govt Hospital Hub — home">
          <span className="emblem pub-emblem" aria-hidden="true"><Icon name="plus" size={22} /></span>
          <span><span className="pub-brand-name">Govt Hospital Hub</span><br /><span className="pub-brand-sub">Care near you, without the queue</span></span>
        </Link>
        <nav className={`pub-nav ${open ? 'open' : ''}`} aria-label="Primary">
          {PUB_NAV.map((n) => (
            <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'active' : undefined)}>{n.label}</NavLink>
          ))}
          <Link to="/emergency" className="pub-nav-emg" onClick={() => setOpen(false)}><Icon name="alert" size={14} /> Emergency</Link>
        </nav>
        <div className="pub-header-cta">
          {isAuthenticated ? (
            <>
              <Link className="btn btn-sm" to="/dashboard"><Icon name="dashboard" size={14} /> {role} console</Link>
              <button type="button" className="btn btn-sm btn-ghost" onClick={doLogout} title={auth?.name || role}>Logout</button>
            </>
          ) : (
            <>
              <Link className="btn btn-sm btn-ghost pub-login" to="/patient/login">Patient portal</Link>
              <Link className="btn btn-sm btn-ghost pub-login" to="/login">Staff login</Link>
            </>
          )}
          <Link className="btn btn-saffron pub-book" to="/appointments"><Icon name="calendar" size={16} /> Book Appointment</Link>
          <button type="button" className="pub-burger" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={open}><Icon name="menu" size={20} /></button>
        </div>
      </div>
    </header>
  );
}

export function MegaFooter() {
  return (
    <footer className="pub-footer" role="contentinfo">
      <div className="pub-footer-inner">
        <div className="pub-foot-brand">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="emblem" aria-hidden="true" style={{ width: 38, height: 38 }}><Icon name="plus" size={20} /></span>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 17 }}>Govt Hospital Hub</strong>
          </div>
          <p className="pub-foot-note">Book OPD in about 2 minutes across public hospitals. SMS confirmation · Free cancellation · Hindi / Marathi support at desk.</p>
          <p className="pub-foot-helplines">
            <a href="tel:108"><Icon name="phone" size={14} /> 108 Emergency</a>
            <a href="tel:102">102 Ambulance</a>
            <a href="tel:14555">14555 Ayushman</a>
          </p>
          <p className="pub-foot-badges"><span className="pill pill-completed"><Icon name="shield" size={12} /> NABH-aligned</span> <span className="pill pill-info"><Icon name="heart" size={12} /> ABDM · ABHA-ready</span> <span className="pill"><Icon name="checkCircle" size={12} /> 4.6★ citizen rated</span></p>
        </div>
        <nav aria-label="Network"><strong>Network</strong><Link to="/hospitals">Find hospital</Link><Link to="/doctors">Find doctor</Link><Link to="/appointments">Book appointment</Link><Link to="/reports">Lab &amp; blood</Link><Link to="/emergency">Emergency &amp; casualty</Link></nav>
        <nav aria-label="Patients"><strong>Patients</strong><Link to="/patient/login">Patient portal</Link><Link to="/appointments">Book / reschedule</Link><Link to="/reports">Lab reports</Link><Link to="/reports">Blood availability</Link><a href="https://healthid.abdm.gov.in/" target="_blank" rel="noreferrer">Create ABHA</a><Link to="/schemes">AB-PMJAY help</Link></nav>
        <nav aria-label="Schemes"><strong>Schemes</strong><Link to="/schemes">Ayushman Bharat PM-JAY</Link><a href="https://beneficiary.nha.gov.in/" target="_blank" rel="noreferrer">Check eligibility (NHA)</a><a href="https://ors.gov.in/" target="_blank" rel="noreferrer">ORS portal</a><a href="https://www.cowin.gov.in/" target="_blank" rel="noreferrer">CoWIN vaccination</a><Link to="/help">ABHA &amp; records</Link></nav>
        <nav aria-label="Compliance"><strong>Compliance</strong><span className="pub-foot-note">PHI-safe · DPDP-aware · Every staff action is audit-logged.</span><Link to="/help">Help &amp; runbook</Link><Link to="/login">Staff login</Link><Link to="/">Public home</Link></nav>
      </div>
      <div className="pub-foot-bottom">
        <span>Synthetic demo data only — no real patient information.</span>
        <span>For technical runbook (API / WSDL / CORS) see <Link to="/help">Help → Runbook for IT cell</Link>.</span>
      </div>
      <div className="ashoka-foot" aria-hidden="true" />
    </footer>
  );
}

export default function PublicLayout() {
  return (
    <div className="pub-shell">
      <a className="skip-link" href="#pub-main">Skip to content</a>
      <EmergencyStrip />
      <GovStrip />
      <PublicHeader />
      <main id="pub-main" className="pub-main" tabIndex={-1}>
        <Outlet />
      </main>
      <MegaFooter />
      <Link className="pub-sticky-book" to="/appointments"><Icon name="calendar" size={18} /> Book Appointment</Link>
      <a className="pub-wa-float" href="https://wa.me/911022489877" target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp for appointment help"><Icon name="chat" size={22} /></a>
    </div>
  );
}
