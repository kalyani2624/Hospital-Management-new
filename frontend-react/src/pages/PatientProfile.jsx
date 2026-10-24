import { useState } from 'react';
import { updatePatient } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { Field } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

function toLocalInput(d) {
  if (!d) return '';
  const p = new Date(d);
  if (Number.isNaN(p.getTime())) return '';
  p.setMinutes(p.getMinutes() - p.getTimezoneOffset());
  return p.toISOString().slice(0, 10);
}

export default function PatientProfile() {
  const { patient, updatePatientSession, pushToast } = useApp();
  const [form, setForm] = useState(() => ({
    centralId: patient?.centralId || '',
    name: patient?.name || '',
    phone: patient?.phone || '',
    email: patient?.email || '',
    address: patient?.address || '',
    dob: toLocalInput(patient?.dob),
  }));
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    else if (form.name.trim().length < 2) e.name = 'Name looks too short.';
    if (!/^\d{10}$/.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit mobile number.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email or clear the field.';
    if (form.dob && new Date(form.dob) > new Date()) e.dob = 'Date of birth cannot be in the future.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save(e) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const updated = await updatePatient(patient.id, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        dob: form.dob || null,
      });
      updatePatientSession({ name: updated.name, phone: updated.phone, email: updated.email, address: updated.address, dob: updated.dob });
      pushToast('Profile saved — hospital records updated.');
    } catch (err) {
      pushToast(err.message || 'Save failed. Please retry.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-head">
        <div>
          <h1 style={{ fontSize: 'clamp(24px,3vw,32px)', margin: 0 }}>My profile</h1>
          <p className="hint" style={{ marginTop: 4 }}>Your central ID is fixed. Update contact details anytime.</p>
        </div>
      </div>

      <form onSubmit={save} noValidate>
        <div className="card" style={{ padding: 18 }}>
          <div className="form-grid">
            <Field label="Central Patient ID" id="pp-cid" hint="Auto-generated — cannot be changed.">
              <div className="input-wrap"><span className="input-ico"><Icon name="idcard" size={18} /></span><input id="pp-cid" value={form.centralId} readOnly disabled style={{ minHeight: 48 }} /></div>
            </Field>
            <Field label="Full name" id="pp-name" required error={errors.name}>
              <input id="pp-name" className={errors.name ? 'input-error' : ''} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ minHeight: 48 }} />
            </Field>
            <Field label="Mobile number" id="pp-phone" required error={errors.phone} hint="Used to sign in to this portal.">
              <div className="input-wrap"><span className="input-ico"><Icon name="phone" size={18} /></span><input id="pp-phone" className={errors.phone ? 'input-error' : ''} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} inputMode="numeric" style={{ minHeight: 48 }} /></div>
            </Field>
            <Field label="Email" id="pp-email" error={errors.email}>
              <div className="input-wrap"><span className="input-ico"><Icon name="mail" size={18} /></span><input id="pp-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" style={{ minHeight: 48 }} /></div>
            </Field>
            <Field label="Date of birth" id="pp-dob" error={errors.dob}>
              <input id="pp-dob" type="date" value={form.dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, dob: e.target.value })} style={{ minHeight: 48 }} />
            </Field>
            <Field label="Age (auto)" error={null}>
              <input value={form.dob ? `${Math.floor((Date.now() - new Date(form.dob).getTime()) / (365.25 * 86400000))} years old` : '— set birth date —'} readOnly disabled style={{ minHeight: 48 }} />
            </Field>
            <Field label="Address" id="pp-addr" error={null}>
              <div className="input-wrap"><span className="input-ico"><Icon name="pin" size={18} /></span><input id="pp-addr" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="House, area, district" style={{ minHeight: 48 }} /></div>
            </Field>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" disabled={busy}>{busy ? (<><span className="spinner" /> Saving…</>) : (<><Icon name="check" size={16} /> Save changes</>)}</button>
          </div>
        </div>
      </form>
    </div>
  );
}