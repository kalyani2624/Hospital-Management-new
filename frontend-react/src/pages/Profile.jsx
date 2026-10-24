import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listDoctors, listHospitals } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { Avatar, Field, KpiCard } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

export default function Profile() {
  const { auth, role, myHospitalId, recent, updateProfile, setDoctorClaim, pushToast, logout } = useApp();
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [claim, setClaim] = useState(auth?.doctorId || '');
  const [form, setForm] = useState({ name: auth?.name || '', email: auth?.email || '', hospitalId: auth?.hospitalId || myHospitalId || '' });
  const [saved, setSaved] = useState(false);
  const [sessions] = useState([{ id: 'this', device: 'This browser · 127.0.0.1', at: auth?.loginAt || new Date().toISOString(), current: true }, { id: 'ward', device: 'Ward tablet · shared', at: new Date(Date.now() - 86400000).toISOString(), current: false }]);

  useEffect(() => {
    listHospitals().then((r) => setHospitals(Array.isArray(r) ? r : [])).catch(() => {});
    listDoctors({}).then((d) => setDoctors(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  function submitClaim(e) {
    e.preventDefault();
    const d = doctors.find((x) => String(x.id) === String(claim));
    if (!d) { pushToast('Pick a practising doctor first.'); return; }
    setDoctorClaim({ doctorId: d.id, doctorName: d.name, specialization: d.specialization, hospitalId: d.hospital?.id ?? '', hospitalName: d.hospital?.name ?? '' });
    setForm((f) => ({ ...f, hospitalId: d.hospital?.id != null ? String(d.hospital.id) : f.hospitalId }));
    pushToast(`Now practising as ${d.name} · ${d.specialization}.`);
  }

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) { pushToast('Name cannot be empty.'); return; }
    const h = hospitals.find((x) => String(x.id) === String(form.hospitalId));
    updateProfile({ name: form.name.trim(), email: form.email.trim(), hospitalId: form.hospitalId, hospitalName: h?.name || '' });
    setSaved(true);
    pushToast('Profile updated (stored locally).');
    setTimeout(() => setSaved(false), 4000);
  }

  return (
    <div>
      <div className="page-head"><div><h1>Profile</h1><hr className="ashoka-v2" aria-hidden="true" /><p className="hint" style={{ margin: 0 }}>Your demo session. Edits persist to <code>localStorage</code> only.</p></div></div>
      <div className="card" style={{ overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ height: 84, margin: '-18px -18px 0', background: 'var(--gradient-brand)', position: 'relative' }} aria-hidden="true" />
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: -32 }}>
          <Avatar name={auth?.name || role} size="xl" />
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0 }}>{auth?.name || 'Signed-in staff'}</h2>
            <p className="hint" style={{ margin: '2px 0' }}>{auth?.email || 'no email on file'} · <span className="pill pill-completed"><Icon name="checkCircle" size={12} /> {role}</span></p>
            <p className="hint" style={{ margin: 0 }}>Hospital: <strong>{auth?.hospitalName || hospitals.find((h) => String(h.id) === String(auth?.hospitalId || myHospitalId))?.name || (role === 'SuperAdmin' ? 'All Hospitals (ministry)' : '— not assigned —')}</strong>{auth?.centralId ? <> · centralId <code>{auth.centralId}</code></> : null}</p>
            {auth?.loginAt ? <p className="hint" style={{ margin: 0 }}>Session started {new Date(auth.loginAt).toLocaleString()}</p> : null}
          </div>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 12 }}>
        <KpiCard label="Lookups" value={recent.length} index={2} />
        <KpiCard label="Sessions" value={sessions.length} index={0} />
        <KpiCard label="Role scope" value={role === 'SuperAdmin' ? 'All' : '1 hospital'} index={4} />
      </div>

      {role === 'Doctor' && (
        <form className="card" onSubmit={submitClaim} aria-label="Practising identity" style={{ marginBottom: 12 }}>
          <h2 style={{ marginTop: 0 }}>Practising identity <span className="pill pill-info" style={{ fontSize: 11, verticalAlign: 'middle' }}>Demo claim</span></h2>
          <p className="hint">Your Doctor module reads and writes only as this seeded doctor. The claim travels in the <code>X-Demo-Doctor-Id</code> header — demo enforcement, not real auth (see <code>DemoAuthorizationFilter.java</code>).</p>
          <div className="form-grid form-grid-2">
            <Field label="Act as doctor" id="pf-doc" hint="Seeded demo doctors — switching refreshes dashboard, diary and history.">
              <select id="pf-doc" value={claim} onChange={(e) => setClaim(e.target.value)} style={{ minHeight: 48 }}>
                <option value="">— choose —</option>
                {doctors.map((d) => <option key={d.id} value={String(d.id)}>Dr #{d.id} {d.name} · {d.specialization}</option>)}
              </select>
            </Field>
            <Field label="Current claim" id="pf-claim" hint="Written to hub.auth at sign-in or here.">
              <input id="pf-claim" readOnly disabled value={auth?.doctorId ? `Dr #${auth.doctorId} ${auth.doctorName || ''}${auth?.specialization ? ` · ${auth.specialization}` : ''}` : 'No doctor identity set'} />
            </Field>
          </div>
          <button className="btn btn-primary"><Icon name="user" size={16} /> Set practising identity</button>
        </form>
      )}

      <div className="cols cols-2">
        <section className="card" aria-label="Identity">
          <h2>Sessions + recent</h2>
          <h3 style={{ fontSize: 15 }}>Recent centralIds</h3>
          {recent.length === 0 ? (<p className="hint">No lookups yet — press <kbd>/</kbd> and search any centralId.</p>) : (
            <div className="recent-chips">{recent.map((id) => <Link key={id} className="chip-btn" to={`/patients/${encodeURIComponent(id)}`}>{id}</Link>)}</div>
          )}
          <h3 style={{ fontSize: 15, marginTop: 14 }}>Active sessions</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {sessions.map((s) => (
              <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--color-border-subtle)', borderRadius: 12, padding: '10px 12px' }}>
                <span><strong>{s.device}</strong><br /><small className="hint">{new Date(s.at).toLocaleString()}{s.current ? ' · current' : ''}</small></span>
                {!s.current && <button type="button" className="btn btn-sm btn-ghost" onClick={() => pushToast('Ward session revoked (demo).')}>Revoke</button>}
              </li>
            ))}
          </ul>
          <div className="card" style={{ marginTop: 12, background: 'var(--color-danger-bg)', borderColor: 'var(--color-danger)' }}>
            <strong>Danger zone</strong>
            <p className="hint">Clear this browser session and return to landing.</p>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => { logout(); window.location.hash = '#/'; }}><Icon name="logout" size={14} /> Clear demo session</button>
          </div>
        </section>

        <form className="card" onSubmit={submit} aria-label="Edit profile">
          <h2>Edit profile</h2>
          <div className="form-grid">
            <Field label="Display name" id="pf-name" required error={null}><input id="pf-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ minHeight: 48 }} /></Field>
            <Field label="Work email" id="pf-email"><input id="pf-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ minHeight: 48 }} /></Field>
            <Field label="Assigned hospital" id="pf-hosp" hint="Non-SuperAdmin portals lock to this facility.">
              <select id="pf-hosp" value={form.hospitalId} onChange={(e) => setForm({ ...form, hospitalId: e.target.value })} style={{ minHeight: 48 }}>
                <option value="">— none —</option>
                {hospitals.map((h) => <option key={h.id} value={String(h.id)}>{h.name} · {h.city}</option>)}
              </select>
            </Field>
          </div>
          {saved && <div className="alert alert-ok" role="status" style={{ marginBottom: 8 }}><Icon name="checkCircle" size={18} /> Saved</div>}
          <button className="btn btn-primary btn-lg" style={{ marginTop: 8 }}><Icon name="check" size={16} /> Save changes</button>
        </form>
      </div>
    </div>
  );
}
