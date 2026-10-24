import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Field } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  function submit(e) {
    e.preventDefault();
    setError(null);
    const v = email.trim();
    if (!v) { setError('Enter your work email to receive a reset link.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setError('That email does not look valid — check for typos.'); return; }
    setSent(true);
  }

  return (
    <div className="auth-split">
      <div className="auth-brand">
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span className="emblem" aria-hidden="true"><Icon name="plus" size={24} /></span>
            <div><strong style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>Govt Hospital Hub</strong><div style={{ color: '#C7D2FE', fontSize: 13 }}>Session recovery</div></div>
          </div>
          <h2 style={{ fontSize: 'clamp(26px,3vw,34px)', marginTop: 28, color: '#fff' }}>Locked out? Back in 60 seconds.</h2>
          <p style={{ color: '#E0E7FF' }}>Demo sessions live in localStorage — a reset link or a fresh role login both work. No data is lost.</p>
        </div>
        <div className="quote-card">IT cell: 1800-XXX-XXXX (8am–8pm) · help@govhospital.in — include role + hospital + centralId.</div>
      </div>
      <div className="auth-form-col">
        <div className="auth-card auth-narrow">
          <h1 style={{ fontSize: 26 }}>Forgot access?</h1>
          <hr className="ashoka-v2" aria-hidden="true" />
          {sent ? (
            <div className="alert alert-ok" role="status"><Icon name="checkCircle" size={20} /><span>If <strong>{email.trim()}</strong> is registered with your hospital IT cell, a reset link is on its way. Demo note: sessions live in <code>localStorage</code> — you can also just <Link to="/login">log in again with your role</Link>.
              <div style={{ marginTop: 10 }}><Link className="btn btn-primary" to="/login">Back to login <Icon name="arrowRight" size={16} /></Link></div></span></div>
          ) : (
            <form onSubmit={submit} noValidate>
              <p className="hint">We will email a one-time link. For the demo, any valid email shows the success state.</p>
              {error && <div className="alert alert-error" role="alert"><Icon name="alert" size={18} /> {error}</div>}
              <Field label="Work email" id="fg-email" required error={null}>
                <div className="input-wrap"><span className="input-ico"><Icon name="mail" size={18} /></span><input id="fg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@govhospital.in" autoComplete="email" style={{ minHeight: 48 }} /></div>
              </Field>
              <div className="auth-actions">
                <button className="btn btn-primary btn-lg">Send reset link</button>
                <Link className="btn" to="/login">Back to login</Link>
              </div>
            </form>
          )}
          <p className="hint"><Link to="/">← Back to landing</Link></p>
        </div>
      </div>
    </div>
  );
}
