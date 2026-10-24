import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPatient, listHospitals, toApiError } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { ErrorBanner, Field, SectionHeader } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

export default function RegisterPatient() {
  const { pushToast, effectiveScopeId } = useApp();
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [form, setForm] = useState({
    centralId: '',
    name: '',
    age: 30,
    gender: 'Female',
    phone: '',
    hospitalId: effectiveScopeId ? String(effectiveScopeId) : '',
  });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listHospitals().then((r) => setHospitals(Array.isArray(r) ? r : [])).catch(() => {});
  }, []);

  async function register(e) {
    e.preventDefault();
    setFormError(null);
    if (!form.centralId.trim() || !form.name.trim()) {
      setFormError('centralId and name are required.');
      return;
    }
    setSaving(true);
    try {
      const saved = await createPatient({
        centralId: form.centralId.trim(),
        name: form.name.trim(),
        age: Number(form.age) || 0,
        gender: form.gender,
        phone: form.phone.trim(),
        hospitalId: form.hospitalId ? Number(form.hospitalId) : null,
      });
      pushToast(`Registered ${saved.name} (${saved.centralId}).`);
      navigate(`/patients/${encodeURIComponent(saved.centralId)}`);
    } catch (err) {
      const ae = toApiError(err);
      setFormError(ae.status === 409 ? `This centralId already exists. ${ae.message}` : ae.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Register Patient</h1>
          <p className="hint" style={{ margin: 0 }}>Create a citizen record with a unique centralId. Duplicates are rejected.</p>
        </div>
      </div>
      <form className="card" onSubmit={register}>
        <SectionHeader title="New citizen" hint="All fields except phone/hospital are required by the form." />
        {formError && <ErrorBanner error={formError} />}
        <div className="form-grid form-grid-3">
          <Field label="CentralId" id="rp-cid" required hint="Must be unique (e.g. MH-2026-004999)">
            <input id="rp-cid" value={form.centralId} onChange={(e) => setForm({ ...form, centralId: e.target.value })} style={{ fontFamily: 'var(--font-mono)' }} required />
          </Field>
          <Field label="Full name" id="rp-name" required>
            <input id="rp-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Age" id="rp-age">
            <input id="rp-age" type="number" min={0} max={130} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
          </Field>
          <Field label="Gender" id="rp-g">
            <select id="rp-g" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="Phone" id="rp-p">
            <input id="rp-p" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98XXXXXXXX" />
          </Field>
          <Field label="Registered hospital" id="rp-h" hint={effectiveScopeId ? 'Locked to your facility.' : undefined}>
            <select id="rp-h" value={form.hospitalId} disabled={!!effectiveScopeId} onChange={(e) => setForm({ ...form, hospitalId: e.target.value })}>
              <option value="">— choose —</option>
              {hospitals
                .filter((h) => !effectiveScopeId || String(h.id) === String(effectiveScopeId))
                .map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
            </select>
          </Field>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Registering…' : (<><Icon name="checkCircle" size={16} /> Register patient</>)}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/reception/patients')}>
            Back to directory
          </button>
        </div>
      </form>
    </div>
  );
}
