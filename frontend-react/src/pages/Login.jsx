import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { listDoctors, listHospitals } from '../api/client.js';
import { ROLES, useApp } from '../context/AppContext.jsx';
import { Field } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

function BrandPanel() {
  return (
    <div className="auth-brand">
      <div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="emblem" aria-hidden="true"><Icon name="plus" size={24} /></span>
          <div><strong style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>Govt Hospital Hub</strong><div style={{ color: '#C7D2FE', fontSize: 13 }}>One Citizen, One Record, Every Hospital</div></div>
        </div>
        <h2 style={{ fontSize: 'clamp(26px,3vw,36px)', marginTop: 28, color: '#fff' }}>Care continuity starts with one ID.</h2>
        <p style={{ color: '#E0E7FF', maxWidth: 440 }}>One search across every public hospital — appointments, beds, referrals and notes. No more lost transfers.</p>
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8, marginTop: 14 }}>
          {['One search — centralId jumps to full history', 'Live beds — Available / Tight / Full with words', 'Audit-ready — exports + SOAP bridge'].map((t) => (
            <li key={t} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon name="checkCircle" size={18} /> {t}</li>
          ))}
        </ul>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="float-chip"><span className="live-dot" /> Occupancy 72%</span>
          <span className="float-chip">4 referrals pending</span>
          <span className="float-chip">ABHA-linked 12,408</span>
        </div>
        <div className="quote-card">“We stopped losing patients in transfers.” — Duty Officer, District Hospital</div>
      </div>
    </div>
  );
}

export default function Login() {
  const { login, isAuthenticated, pushToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const next = useMemo(() => {
    const q = new URLSearchParams(location.search);
    const n = q.get('next') || '/dashboard';
    return n.startsWith('/') ? n : '/dashboard';
  }, [location.search]);

  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', role: 'Receptionist', hospitalId: '', centralId: '', doctorId: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [showCid, setShowCid] = useState(false);

  useEffect(() => {
    listHospitals().then((r) => setHospitals(Array.isArray(r) ? r : [])).catch(() => {});
    listDoctors().then((r) => setDoctors(Array.isArray(r) ? r : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (isAuthenticated) navigate(next, { replace: true });
  }, [isAuthenticated, navigate, next]);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Display name is required (2+ characters). Try your duty name.';
    else if (form.name.trim().length < 2) e.name = 'Name looks too short.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email or leave it blank.';
    if (!ROLES.includes(form.role)) e.role = 'Pick a valid role.';
    if (form.role !== 'SuperAdmin' && !form.hospitalId) e.hospitalId = 'Non-SuperAdmin roles need a hospital scope.';
    if (form.role === 'Doctor' && !form.doctorId) e.doctorId = 'Pick the seeded doctor you are — the Doctor module uses this identity.';
    if (form.centralId && !/^[A-Za-z0-9-]{4,32}$/.test(form.centralId.trim())) e.centralId = 'centralId may use letters, digits and dashes (4–32 chars). Try MH-2026-000001.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const h = hospitals.find((x) => String(x.id) === String(form.hospitalId));
      const doc = doctors.find((x) => String(x.id) === String(form.doctorId));
      const hospitalId = form.role === 'SuperAdmin' ? '' : form.role === 'Doctor' ? String(doc?.hospital?.id ?? '') : form.hospitalId;
      const session = login({
        name: form.role === 'Doctor' ? form.name.trim() || doc?.name || 'Dr …' : form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        hospitalId,
        hospitalName: doc?.hospital?.name || h?.name || '',
        centralId: form.centralId.trim(),
        ...(form.role === 'Doctor' ? { doctorId: form.doctorId, doctorName: doc?.name || '', specialization: doc?.specialization || '' } : {}),
      });
      pushToast(`Welcome, ${session.name} (${session.role}).`);
      navigate(next, { replace: true });
    } finally {
      setBusy(false);
    }
  }

  function pickDoctor(docId) {
    const doc = doctors.find((x) => String(x.id) === String(docId));
    setForm((f) => ({
      ...f,
      doctorId: docId,
      hospitalId: String(doc?.hospital?.id ?? f.hospitalId),
      name: f.name.trim() || (doc ? `${doc.name} — ${doc.specialization}` : f.name),
    }));
  }

  function quickRole(r) {
    setForm((f) => ({ ...f, role: r, hospitalId: r === 'SuperAdmin' ? '' : f.hospitalId }));
  }

  return (
    <div className="auth-split">
      <a className="skip-link" href="#login-form">Skip to login form</a>
      <BrandPanel />
      <div className="auth-form-col">
        <div className="auth-card auth-narrow">
          <h1 style={{ fontSize: 26 }}>Welcome back</h1>
          <p className="hint" style={{ marginTop: 0 }}>Sign in to Central Command — lands on <code>{next}</code>.</p>
          <hr className="ashoka-v2" aria-hidden="true" />
          <div className="role-quick" role="group" aria-label="Quick role pick">
            {ROLES.map((r) => (
              <button key={r} type="button" className={`chip-btn ${form.role === r ? 'chip-active' : ''}`} aria-pressed={form.role === r} onClick={() => quickRole(r)} style={{ minHeight: 40 }}>{r}</button>
            ))}
          </div>
          <form id="login-form" onSubmit={submit} noValidate>
            <div className="form-grid">
              <Field label="Display name" id="li-name" required error={errors.name} hint="Shown in topbar + profile.">
                <div className="input-wrap"><span className="input-ico"><Icon name="user" size={18} /></span><input id="li-name" className={errors.name ? 'input-error' : ''} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Meera Nair — Front Desk" autoComplete="name" required style={{ minHeight: 48 }} /></div>
              </Field>
              <Field label="Work email (optional)" id="li-email" error={errors.email}>
                <div className="input-wrap"><span className="input-ico"><Icon name="mail" size={18} /></span><input id="li-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@govhospital.in" autoComplete="email" style={{ minHeight: 48 }} /></div>
              </Field>
              <div className="form-grid form-grid-2">
                <Field label="Role" id="li-role" required error={errors.role} hint="SuperAdmin sees all; others are hospital-scoped.">
                  <select id="li-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ minHeight: 48 }}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
                {form.role === 'Doctor' ? (
                  <Field label="Practising identity" id="li-doctor" required error={errors.doctorId} hint="Demo: pick which seeded doctor you are. The Doctor module locks to this identity.">
                    <select id="li-doctor" value={form.doctorId} onChange={(e) => pickDoctor(e.target.value)} style={{ minHeight: 48 }}>
                      <option value="">— choose doctor —</option>
                      {doctors.map((d) => <option key={d.id} value={String(d.id)}>{d.name} · {d.specialization} · {d.hospital?.name ?? `#${d.hospital?.id ?? '?'}`}</option>)}
                    </select>
                  </Field>
                ) : (
                  <Field label="Hospital scope" id="li-hosp" error={errors.hospitalId} hint={form.role === 'SuperAdmin' ? 'SuperAdmin is ministry-wide.' : 'Locked after login.'}>
                    <select id="li-hosp" value={form.hospitalId} onChange={(e) => setForm({ ...form, hospitalId: e.target.value })} disabled={form.role === 'SuperAdmin'} style={{ minHeight: 48 }}>
                      <option value="">{form.role === 'SuperAdmin' ? 'All Hospitals (ministry)' : '— choose hospital —'}</option>
                      {hospitals.map((h) => <option key={h.id} value={String(h.id)}>{h.name} · {h.city}</option>)}
                    </select>
                  </Field>
                )}
              </div>
              {form.role === 'Doctor' && (
                <div className="demo-hint" style={{ marginTop: 6 }}><Icon name="pin" size={16} /> Hospital scope follows the chosen doctor — <strong>{doctors.find((d) => String(d.id) === String(form.doctorId))?.hospital?.name ?? 'pick a doctor to see it'}</strong>.</div>
              )}
              <Field label="Staff centralId (optional)" id="li-cid" error={errors.centralId} hint="Links you to a patient/staff record if you have one.">
                <div className="input-wrap"><span className="input-ico"><Icon name="search" size={18} /></span>
                  <input id="li-cid" type={showCid ? 'text' : 'password'} value={form.centralId} onChange={(e) => setForm({ ...form, centralId: e.target.value })} placeholder="MH-2026-000001" autoComplete="off" style={{ minHeight: 48, paddingRight: 48 }} />
                  <button type="button" onClick={() => setShowCid((v) => !v)} aria-label={showCid ? 'Hide centralId' : 'Show centralId'} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', border: 0, background: 'none', cursor: 'pointer', minWidth: 44, minHeight: 44, color: 'var(--color-muted)' }}><Icon name="eye" size={18} /></button>
                </div>
              </Field>
            </div>
            <button className="btn btn-primary btn-lg" disabled={busy} style={{ width: '100%', marginTop: 6 }}>{busy ? (<><span className="spinner" /> Signing you in…</>) : (<>Sign in <Icon name="arrowRight" size={18} /></>)}</button>
            <div className="demo-hint"><Icon name="shield" size={16} /> <strong>Demo build:</strong> no password. Pick a role to explore. By signing in you agree to PHI-safe use.</div>
            <div className="auth-actions">
              <Link className="btn" to="/signup">New here? Sign up</Link>
              <Link className="btn btn-ghost" to="/forgot">Forgot?</Link>
            </div>
          </form>
          <p className="hint"><Link to="/">← Back to landing</Link> · <Link to="/dashboard">Explore dashboard</Link></p>
        </div>
        <div className="card portal-card" style={{ width: 'min(480px,100%)', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
            <span className="avatar avatar-md" style={{ background: 'linear-gradient(140deg,#0F766E,#0E7490)' }}><Icon name="heart" size={20} /></span>
            <div><strong>Using MediCore as a patient?</strong><div className="hint" style={{ margin: 0 }}>Book, view and manage your appointments.</div></div>
          </div>
          <Link to="/patient/login" className="btn btn-primary" style={{ width: '100%' }}>Open patient portal <Icon name="arrowRight" size={16} /></Link>
          <div className="demo-hint" style={{ marginTop: 10 }}><Icon name="shield" size={16} /> Patient sign-in uses your registered mobile number — no password.</div>
        </div>
      </div>
    </div>
  );
}
