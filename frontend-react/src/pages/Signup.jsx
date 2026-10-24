import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createHospital, createPatient, listHospitals, toApiError } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { ErrorBanner, Field } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

const TABS = [{ id: 'hospital', label: 'Onboard a hospital' }, { id: 'staff', label: 'Register staff / citizen' }, { id: 'patient', label: 'Register as a patient' }];

export default function Signup({ patientOnly = false }) {
  const { pushToast, login, loginPatient } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState(patientOnly ? 'patient' : 'hospital');
  const [hospitals, setHospitals] = useState([]);
  // M4 fix: Hospital entity only persists {name, city, type, totalBeds} — the old
  // address/phone inputs POSTed fields Jackson silently dropped (201 but data loss).
  // Removed from form + payload so the UI never promises to save them.
  const [hForm, setHForm] = useState({ name: '', city: '', type: 'DISTRICT', totalBeds: 100 });
  const [sForm, setSForm] = useState({ centralId: '', name: '', age: 30, gender: 'Female', phone: '', hospitalId: '' });
  const [pForm, setPForm] = useState({ name: '', phone: '', email: '', address: '', dob: '', hospitalId: '' });
  const [err, setErr] = useState(null);
  const [fieldErr, setFieldErr] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    listHospitals().then((r) => setHospitals(Array.isArray(r) ? r : [])).catch(() => {});
  }, []);

  function validateHospital() {
    const e = {};
    if (!hForm.name.trim()) e.name = 'Hospital name is required.';
    if (!hForm.city.trim()) e.city = 'City is required.';
    if (!['CENTRAL', 'DISTRICT', 'COMMUNITY'].includes(hForm.type)) e.type = 'Pick a valid type.';
    if (!(Number(hForm.totalBeds) >= 1 && Number(hForm.totalBeds) <= 5000)) e.totalBeds = 'Beds must be 1–5000.';
    setFieldErr(e);
    return Object.keys(e).length === 0;
  }

  function validateStaff() {
    const e = {};
    if (!sForm.centralId.trim()) e.centralId = 'centralId is required — format MH-2026-000001.';
    else if (!/^[A-Za-z]{2}-\d{4}-\d{6}$/.test(sForm.centralId.trim())) e.centralId = 'Expected format like MH-2026-000001 (2 letters, year, 6 digits).';
    if (!sForm.name.trim()) e.name = 'Full name is required.';
    if (!(Number(sForm.age) >= 0 && Number(sForm.age) <= 130)) e.age = 'Age must be 0–130.';
    if (sForm.phone && !/^[+\d][\d\s-]{6,16}$/.test(sForm.phone.trim())) e.phone = 'Enter a valid phone or leave blank.';
    setFieldErr(e);
    return Object.keys(e).length === 0;
  }

  async function submitHospital(e) {
    e.preventDefault();
    setErr(null); setDone(null);
    if (!validateHospital()) return;
    setBusy(true);
    try {
      // Payload maps 1:1 to Hospital.java — no address/phone (backend has no columns).
      const saved = await createHospital({ name: hForm.name.trim(), city: hForm.city.trim(), type: hForm.type, totalBeds: Number(hForm.totalBeds) });
      setDone({ kind: 'hospital', id: saved.id, name: saved.name });
      pushToast(`Hospital request accepted — ${saved.name} (#${saved.id}).`);
    } catch (ex) {
      const ae = toApiError(ex);
      setErr(ae.status === 409 ? `That hospital already exists (409). ${ae.message} — pick the existing registry entry instead.` : ae.message);
    } finally { setBusy(false); }
  }

  async function submitStaff(e) {
    e.preventDefault();
    setErr(null); setDone(null);
    if (!validateStaff()) return;
    setBusy(true);
    try {
      const saved = await createPatient({ centralId: sForm.centralId.trim(), name: sForm.name.trim(), age: Number(sForm.age) || 0, gender: sForm.gender, phone: sForm.phone.trim(), hospitalId: sForm.hospitalId ? Number(sForm.hospitalId) : null });
      setDone({ kind: 'staff', id: saved.id, name: saved.name, centralId: saved.centralId });
      pushToast(`Registered ${saved.name} (${saved.centralId}).`);
      login({ name: saved.name, role: 'Receptionist', hospitalId: sForm.hospitalId, centralId: saved.centralId });
    } catch (ex) {
      const ae = toApiError(ex);
      setErr(ae.status === 409 ? `centralId ${sForm.centralId} already exists (409). ${ae.message} — open the existing record instead of duplicating.` : ae.message);
    } finally { setBusy(false); }
  }

  function ageFromDob(dob) {
    if (!dob) return 0;
    const diff = Date.now() - new Date(dob).getTime();
    if (Number.isNaN(diff) || diff < 0) return 0;
    return Math.floor(diff / (365.25 * 86400000));
  }

  function validatePatient() {
    const e = {};
    if (!pForm.name.trim()) e.name = 'Full name is required.';
    else if (pForm.name.trim().length < 2) e.name = 'Name looks too short.';
    if (!/^\d{10}$/.test(pForm.phone.trim())) e.phone = 'Enter a valid 10-digit mobile number.';
    if (pForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pForm.email.trim())) e.email = 'Enter a valid email or clear the field.';
    if (pForm.dob && new Date(pForm.dob) > new Date()) e.dob = 'Date of birth cannot be in the future.';
    setFieldErr(e);
    return Object.keys(e).length === 0;
  }

  async function submitPatient(e) {
    e.preventDefault();
    setErr(null); setDone(null);
    if (!validatePatient()) return;
    setBusy(true);
    try {
      // Blank centralId → backend auto-generates PAT-xxxxx (self-registration).
      const saved = await createPatient({
        centralId: '',
        name: pForm.name.trim(),
        age: ageFromDob(pForm.dob),
        gender: '',
        phone: pForm.phone.trim(),
        hospitalId: pForm.hospitalId ? Number(pForm.hospitalId) : null,
        dob: pForm.dob || null,
        address: pForm.address.trim() || null,
        email: pForm.email.trim() || null,
      });
      setDone({ kind: 'patient', id: saved.id, name: saved.name, centralId: saved.centralId });
      pushToast(`Welcome, ${saved.name} — your Central Patient ID is ${saved.centralId}.`);
      loginPatient(saved);
      navigate('/patient', { replace: true });
    } catch (ex) {
      const ae = toApiError(ex);
      if (ae.status === 409) setErr(`That mobile number is already registered (409) — please sign in with it instead.`);
      else setErr(ae.message);
    } finally { setBusy(false); }
  }

  return (
    <div className="auth-split">
      <a className="skip-link" href="#signup-form">Skip to sign-up form</a>
      <div className="auth-brand">
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span className="emblem" aria-hidden="true"><Icon name="plus" size={24} /></span>
            <div><strong style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>MediCore</strong><div style={{ color: '#C7D2FE', fontSize: 13 }}>Patient and hospital registration</div></div>
          </div>
          <h2 style={{ fontSize: 'clamp(26px,3vw,36px)', marginTop: 28, color: '#fff' }}>{patientOnly ? 'Create your patient account.' : 'Register with MediCore.'}</h2>
          {!patientOnly && <ol style={{ paddingLeft: 20, lineHeight: 2, color: '#E0E7FF' }}>
            <li><strong>Step 1 of 2</strong> — register facility + capacity</li>
            <li><strong>Step 2 of 2</strong> — register staff with centralId</li>
            <li>Go live — beds, doctors, referrals light up</li>
          </ol>}
        </div>
        <div className="quote-card">{patientOnly ? "Register once and use your Central Patient ID to manage appointments across connected hospitals. Demo sign-in does not yet use passwords." : "Hospital administration and patient registration for the MediCore demo."}</div>
      </div>
      <div className="auth-form-col">
        <div className="auth-card auth-wide">
          <h1 style={{ fontSize: 26 }}>Create your account</h1>
          <p className="hint" style={{ marginTop: 0 }}>{patientOnly ? 'Enter your details to receive a Central Patient ID.' : 'Choose a registration type below.'}</p>
          <hr className="ashoka-v2" aria-hidden="true" />
          <div className="tabs" role="tablist" aria-label="Sign-up type">
            {(patientOnly ? TABS.filter((t) => t.id === 'patient') : TABS).map((t) => (<button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => { setTab(t.id); setErr(null); setDone(null); setFieldErr({}); }}>{t.label}</button>))}
          </div>
          <ErrorBanner error={err ? { message: err } : null} />
          {done && (
            <div className="alert alert-ok" role="status"><Icon name="checkCircle" size={20} /><span>
              {done.kind === 'hospital' ? (<span>Hospital <strong>{done.name}</strong> created as <strong>#{done.id}</strong> (201). <Link to="/hospitals">Open registry</Link> or <Link to="/login">login to continue</Link>.</span>)
                : done.kind === 'patient' ? (<span>Patient <strong>{done.name}</strong> registered as <strong>{done.centralId}</strong> — opening your portal…</span>)
                : (<span>Citizen <strong>{done.name}</strong> registered as <strong>{done.centralId}</strong> (201) and signed in as Receptionist. <button type="button" className="btn btn-sm" onClick={() => navigate('/dashboard')}>Go to dashboard →</button></span>)}
            </span></div>
          )}
          {tab === 'hospital' ? (
            <form id="signup-form" onSubmit={submitHospital} noValidate>
              <div className="form-grid form-grid-2">
                <Field label="Hospital name" id="su-hname" required error={fieldErr.name}><input id="su-hname" value={hForm.name} onChange={(e) => setHForm({ ...hForm, name: e.target.value })} placeholder="Civil Hospital Thane" required style={{ minHeight: 48 }} /></Field>
                <Field label="City" id="su-city" required error={fieldErr.city}><input id="su-city" value={hForm.city} onChange={(e) => setHForm({ ...hForm, city: e.target.value })} placeholder="Thane" required style={{ minHeight: 48 }} /></Field>
                <Field label="Type" id="su-type" error={fieldErr.type}><select id="su-type" value={hForm.type} onChange={(e) => setHForm({ ...hForm, type: e.target.value })} style={{ minHeight: 48 }}><option value="CENTRAL">CENTRAL</option><option value="DISTRICT">DISTRICT</option><option value="COMMUNITY">COMMUNITY</option></select></Field>
                <Field label="Total beds" id="su-beds" error={fieldErr.totalBeds} hint="POST /api/hospitals — 201 on success. Address/phone are managed at the facility desk, not in this registry."><input id="su-beds" type="number" min={1} max={5000} value={hForm.totalBeds} onChange={(e) => setHForm({ ...hForm, totalBeds: e.target.value })} style={{ minHeight: 48 }} /></Field>
              </div>
              <div className="auth-actions">
                <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? (<><span className="spinner" /> Submitting…</>) : 'Submit onboarding (201)'}</button>
                <Link className="btn" to="/login">Already have a session? Login</Link>
              </div>
            </form>
          ) : tab === 'staff' ? (
            <form id="signup-form" onSubmit={submitStaff} noValidate>
              <div className="form-grid form-grid-3">
                <Field label="centralId" id="su-cid" required error={fieldErr.centralId} hint="Unique. Format MH-2026-000001."><input id="su-cid" value={sForm.centralId} onChange={(e) => setSForm({ ...sForm, centralId: e.target.value })} placeholder="MH-2026-004213" required style={{ minHeight: 48, fontFamily: 'var(--font-mono)' }} /></Field>
                <Field label="Full name" id="su-name" required error={fieldErr.name}><input id="su-name" value={sForm.name} onChange={(e) => setSForm({ ...sForm, name: e.target.value })} required style={{ minHeight: 48 }} /></Field>
                <Field label="Age" id="su-age" error={fieldErr.age}><input id="su-age" type="number" min={0} max={130} value={sForm.age} onChange={(e) => setSForm({ ...sForm, age: e.target.value })} style={{ minHeight: 48 }} /></Field>
                <Field label="Gender" id="su-g"><select id="su-g" value={sForm.gender} onChange={(e) => setSForm({ ...sForm, gender: e.target.value })} style={{ minHeight: 48 }}><option>Female</option><option>Male</option><option>Other</option></select></Field>
                <Field label="Phone" id="su-p" error={fieldErr.phone}><input id="su-p" value={sForm.phone} onChange={(e) => setSForm({ ...sForm, phone: e.target.value })} placeholder="98XXXXXXXX" style={{ minHeight: 48 }} /></Field>
                <Field label="Home hospital" id="su-h"><select id="su-h" value={sForm.hospitalId} onChange={(e) => setSForm({ ...sForm, hospitalId: e.target.value })} style={{ minHeight: 48 }}><option value="">— choose —</option>{hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></Field>
              </div>
              <p className="hint">POST <code>/api/patients</code> — 201 on success, friendly recovery on 409 duplicate.</p>
              <div className="auth-actions">
                <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Registering…' : 'Register (201)'}</button>
                <Link className="btn" to="/login">Already have a session? Login</Link>
              </div>
            </form>
          ) : (
            <form id="signup-form" onSubmit={submitPatient} noValidate>
              <div className="form-grid form-grid-2">
                <Field label="Full name" id="pu-name" required error={fieldErr.name}><input id="pu-name" value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} placeholder="Asha Patil" required style={{ minHeight: 48 }} /></Field>
                <Field label="Mobile number" id="pu-phone" required error={fieldErr.phone} hint="This becomes your portal login."><div className="input-wrap"><span className="input-ico"><Icon name="phone" size={18} /></span><input id="pu-phone" value={pForm.phone} onChange={(e) => setPForm({ ...pForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="9876500001" inputMode="numeric" required style={{ minHeight: 48 }} /></div></Field>
                <Field label="Email (optional)" id="pu-email" error={fieldErr.email}><input id="pu-email" type="email" value={pForm.email} onChange={(e) => setPForm({ ...pForm, email: e.target.value })} placeholder="you@example.com" style={{ minHeight: 48 }} /></Field>
                <Field label="Date of birth" id="pu-dob" error={fieldErr.dob}><input id="pu-dob" type="date" value={pForm.dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setPForm({ ...pForm, dob: e.target.value })} style={{ minHeight: 48 }} /></Field>
                <Field label="Address" id="pu-addr" error={null}><div className="input-wrap"><span className="input-ico"><Icon name="pin" size={18} /></span><input id="pu-addr" value={pForm.address} onChange={(e) => setPForm({ ...pForm, address: e.target.value })} placeholder="House, area, district" style={{ minHeight: 48 }} /></div></Field>
                <Field label="Preferred hospital (optional)" id="pu-h"><select id="pu-h" value={pForm.hospitalId} onChange={(e) => setPForm({ ...pForm, hospitalId: e.target.value })} style={{ minHeight: 48 }}><option value="">— choose —</option>{hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></Field>
              </div>
              <p className="hint">POST <code>/api/patients</code> with a blank centralId — a <code>PAT-xxxxx</code> ID is generated for you. Duplicate mobiles get a friendly 409.</p>
              <div className="demo-hint"><Icon name="shield" size={16} /> <strong>Development / demo:</strong> no OTP or verification while signing up.</div>
              <div className="auth-actions">
                <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? (<><span className="spinner" /> Registering…</>) : 'Register &amp; open my portal'}</button>
                <Link className="btn" to="/patient/login">Already registered? Sign in</Link>
              </div>
            </form>
          )}
          <p className="hint"><Link to="/">← Back to landing</Link> · <Link to="/forgot">Forgot session?</Link></p>
        </div>
      </div>
    </div>
  );
}
