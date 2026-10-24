import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getPatientByCentralId, toApiError } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { Field } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

const DEMO_ACCOUNTS = [
  { label: 'Asha Patil', id: '9876500001' },
  { label: 'Ravi Kumar', id: '9876500002' },
  { label: 'Meera Nair', id: '9876500003' },
  { label: 'Karan Mehta', id: '9876500008' },
];

export default function PatientLogin() {
  const { isPatient, loginPatient, pushToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const next = useMemo(() => {
    const q = new URLSearchParams(location.search);
    const n = q.get('next') || '/patient';
    return n.startsWith('/') ? n : '/patient';
  }, [location.search]);

  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isPatient) navigate(next, { replace: true });
  }, [isPatient, navigate, next]);

  async function submit(e) {
    e.preventDefault();
    const id = identifier.trim();
    if (!id) { setError('Enter your registered mobile number or Central Patient ID.'); return; }
    setBusy(true);
    setError('');
    try {
      const p = await getPatientByCentralId(id);
      loginPatient(p);
      pushToast(`Welcome, ${p.name}. Your central ID is ${p.centralId}.`);
      navigate(next, { replace: true });
    } catch (err) {
      const ae = toApiError(err);
      setError(
        ae.status === 404
          ? `No patient found for “${id}”. Have you registered yet? You can register instantly below.`
          : 'Could not sign in right now. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-split">
      <a className="skip-link" href="#patient-login-form">Skip to patient login</a>
      <div className="auth-brand" style={{ background: 'linear-gradient(160deg,#1E1B4B 0%,#312E81 45%,#0E7490 100%)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="emblem" aria-hidden="true"><Icon name="heart" size={24} /></span>
          <div>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>MediCore — Patient Portal</strong>
            <div style={{ color: '#99F6E4', fontSize: 13 }}>Book, view and manage your appointments</div>
          </div>
        </div>
        <h2 style={{ fontSize: 'clamp(24px,3vw,34px)', marginTop: 28, color: '#fff' }}>Your appointments, one number away.</h2>
        <p style={{ color: '#E0E7FF', maxWidth: 460 }}>Sign in with your registered mobile number or Central Patient ID to see visits and book appointments at connected hospitals.</p>
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8, marginTop: 14 }}>
          {['Book an appointment in under a minute', 'Cancel eligible appointments yourself', 'One Central Patient ID across all hospitals'].map((t) => (
            <li key={t} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon name="checkCircle" size={18} /> {t}</li>
          ))}
        </ul>
        <Link to="/patient/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#fff', textDecoration: 'underline', marginTop: 12, fontWeight: 700 }}>
          New patient? Create your account <Icon name="arrowRight" size={16} />
        </Link>
      </div>

      <div className="auth-form-col">
        <div className="auth-card auth-narrow">
          <h1 style={{ fontSize: 26 }}>Patient sign-in</h1>
          <p className="hint" style={{ marginTop: 0 }}>Use your <strong>mobile number</strong> (or Central Patient ID like <code>CENT-001</code>).</p>
          <hr className="ashoka-v2" aria-hidden="true" />
          <form id="patient-login-form" onSubmit={submit} noValidate>
            <Field label="Mobile number or Central Patient ID" id="pi-id" required error={error}>
              <div className="input-wrap"><span className="input-ico"><Icon name="phone" size={18} /></span>
                <input id="pi-id" value={identifier} onChange={(e) => { setIdentifier(e.target.value); setError(''); }} placeholder="9876500001" autoComplete="username" required style={{ minHeight: 48 }} />
              </div>
            </Field>
            <button className="btn btn-primary btn-lg" disabled={busy} style={{ width: '100%', marginTop: 6 }}>
              {busy ? (<><span className="spinner" /> Verifying…</>) : (<>Sign in to my portal <Icon name="arrowRight" size={18} /></>)}
            </button>
            <div className="demo-hint"><Icon name="shield" size={16} /> <strong>Development / demo sign-in:</strong> no OTP, password or government verification — enter your demo mobile.</div>
          </form>

          <div style={{ marginTop: 18 }}>
            <p className="hint" style={{ margin: '0 0 8px' }}><strong>Try a demo account</strong> (tap to fill):</p>
            <div className="role-quick" role="group" aria-label="Demo accounts">
              {DEMO_ACCOUNTS.map((a) => (
                <button key={a.id} type="button" className="chip-btn" onClick={() => setIdentifier(a.id)} style={{ minHeight: 40 }}>
                  {a.label} · {a.id}
                </button>
              ))}
            </div>
          </div>

          <div className="auth-actions" style={{ marginTop: 18 }}>
            <Link className="btn" to="/patient/register">New here? Register as a patient</Link>
            <Link className="btn btn-ghost" to="/">Back to public site</Link>
          </div>
          <p className="hint"><Link to="/login">Staff console →</Link></p>
        </div>
      </div>
    </div>
  );
}