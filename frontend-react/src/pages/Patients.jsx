import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPatient, getPatientByCentralId, listHospitals, listPatients, toApiError } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { Avatar, EmptyState, ErrorBanner, Field, Pagination, SectionHeader, Skeleton } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

export default function Patients() {
  const { pushToast, goCentralId, rememberCentralId, can, effectiveScopeId } = useApp();
  const [rows, setRows] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [lookupState, setLookupState] = useState({ loading: false, error: null, result: null });
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [showReg, setShowReg] = useState(false);
  const [form, setForm] = useState({ centralId: '', name: '', age: 30, gender: 'Female', phone: '', hospitalId: effectiveScopeId ? String(effectiveScopeId) : '' });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [p, h] = await Promise.all([listPatients(page, size), listHospitals().catch(() => [])]);
      setRows(Array.isArray(p) ? p : []);
      setHospitals(Array.isArray(h) ? h : []);
    } catch (e) { setError(toApiError(e)); } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, size]);

  // Hospital Admins see only citizens registered at their facility.
  const visibleRows = effectiveScopeId
    ? rows.filter((p) => String(p.registeredHospital?.id ?? p.registeredHospital ?? '') === String(effectiveScopeId))
    : rows;

  async function lookup(e) {
    e?.preventDefault();
    const id = search.trim();
    if (!id) return;
    setLookupState({ loading: true, error: null, result: null });
    try {
      const p = await getPatientByCentralId(id);
      rememberCentralId(id);
      setLookupState({ loading: false, error: null, result: p });
    } catch (err) {
      const ae = toApiError(err);
      setLookupState({ loading: false, error: ae.status === 404 ? `No record for "${id}". Search again or register this citizen.` : ae.message, result: null });
    }
  }

  async function register(e) {
    e.preventDefault();
    setFormError(null);
    if (!form.centralId.trim() || !form.name.trim()) { setFormError('centralId and name are required.'); return; }
    setSaving(true);
    try {
      const saved = await createPatient({ centralId: form.centralId.trim(), name: form.name.trim(), age: Number(form.age) || 0, gender: form.gender, phone: form.phone.trim(), hospitalId: form.hospitalId ? Number(form.hospitalId) : null });
      pushToast(`Registered ${saved.name} (${saved.centralId}).`);
      rememberCentralId(saved.centralId);
      setShowReg(false);
      setForm({ centralId: '', name: '', age: 30, gender: 'Female', phone: '', hospitalId: effectiveScopeId ? String(effectiveScopeId) : '' });
      load();
      goCentralId(saved.centralId);
    } catch (err) {
      const ae = toApiError(err);
      setFormError(ae.status === 409 ? `This centralId already exists. ${ae.message} — open the existing record instead of duplicating.` : ae.message);
    } finally { setSaving(false); }
  }

  return (
    <div>
      <div className="page-head"><div><h1>{can.registerPatients ? 'Patients — one ID per citizen' : 'Patients overview'}</h1><hr className="ashoka-v2" aria-hidden="true" /><p className="hint" style={{ margin: 0 }}>{can.registerPatients ? 'Search by centralId first to prevent duplicates. History joins appointments + records + referrals across every hospital.' : `Read-only directory for ${effectiveScopeId ? 'your hospital' : 'the network'}. Registration belongs to the front desk.`}</p></div></div>
      <ErrorBanner error={error} onRetry={load} />

      <form className="card" onSubmit={lookup} role="search" aria-label="CentralId lookup" style={{ borderTop: '4px solid transparent', borderImage: 'var(--gradient-brand) 1' }}>
        <SectionHeader title="Find citizen" hint="CentralId is monospace — copy-paste safe." actions={<><button className="btn btn-primary" disabled={lookupState.loading}>{lookupState.loading ? 'Searching…' : (<><Icon name="search" size={16} /> Find record</>)}</button>{can.registerPatients && <button type="button" className="btn btn-cta" onClick={() => setShowReg((v) => !v)}><Icon name="plus" size={16} /> Register new</button>}</>} />
        <label className="field-label" htmlFor="p-search">CentralId search</label>
        <input id="p-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="MH-2026-004213" autoComplete="off" style={{ fontFamily: 'var(--font-mono)', fontSize: 17 }} />
        {lookupState.error && <div className="alert alert-error" role="alert" style={{ marginBottom: 0 }}><Icon name="alert" size={18} /> {lookupState.error}</div>}
        {lookupState.result && (
          <div className="alert alert-ok" role="status" style={{ marginBottom: 0 }}><Icon name="checkCircle" size={18} /><span>Found <strong>{lookupState.result.name}</strong> ({lookupState.result.centralId}) — <Link to={`/patients/${encodeURIComponent(lookupState.result.centralId)}`}>Open unified history</Link></span></div>
        )}
        {can.registerPatients && lookupState.error && lookupState.error.includes('No record') && (
          <div style={{ marginTop: 8 }}><button type="button" className="btn btn-sm" onClick={() => { setForm((f) => ({ ...f, centralId: search.trim() })); setShowReg(true); }}>Register {search.trim()} as new citizen</button></div>
        )}
      </form>

      {showReg && can.registerPatients && (
        <form className="card" style={{ marginTop: 12 }} onSubmit={register} aria-label="Register patient">
          <SectionHeader title="Register citizen" hint="Draft auto-saves locally; mistakes are editable — no confirm dialogs." />
          {formError && <div className="alert alert-error" role="alert"><Icon name="alert" size={18} /> {formError} {formError.includes('already exists') && <Link to={`/patients/${encodeURIComponent(form.centralId.trim())}`}>Open existing</Link>}</div>}
          <div className="form-grid form-grid-3">
            <Field label="centralId" id="rg-cid" required error={null} hint="Format MH-2026-000001. Must be unique."><input id="rg-cid" value={form.centralId} onChange={(e) => setForm({ ...form, centralId: e.target.value })} placeholder="MH-2026-004213" required style={{ fontFamily: 'var(--font-mono)' }} /></Field>
            <Field label="Full name" id="rg-name" required error={null}><input id="rg-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Full name" /></Field>
            <Field label="Age" id="rg-age"><input id="rg-age" type="number" min={0} max={130} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></Field>
            <Field label="Gender" id="rg-g"><select id="rg-g" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option>Female</option><option>Male</option><option>Other</option></select></Field>
            <Field label="Phone" id="rg-p"><input id="rg-p" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98XXXXXXXX" /></Field>
            <Field label="Registered hospital" id="rg-h" hint={effectiveScopeId ? 'Locked to your facility.' : undefined}><select id="rg-h" value={form.hospitalId} disabled={!!effectiveScopeId} onChange={(e) => setForm({ ...form, hospitalId: e.target.value })}><option value="">— choose —</option>{hospitals.filter((h) => !effectiveScopeId || String(h.id) === String(effectiveScopeId)).map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></Field>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}><button className="btn btn-primary" disabled={saving}>{saving ? 'Registering…' : 'Register'}</button><button type="button" className="btn btn-ghost" onClick={() => setShowReg(false)}>Cancel</button></div>
        </form>
      )}

      <section className="card" style={{ marginTop: 12 }} aria-label="Recent patients">
        <SectionHeader title="Registry" hint="Avatar + name stack, mono centralId chip, status rhythm." />
        {loading ? <Skeleton height={180} /> : visibleRows.length === 0 ? (
          <EmptyState art="patient" title="No patients yet" body={can.registerPatients ? 'Register the first citizen with a centralId.' : 'No citizens are registered at this facility yet.'} action={can.registerPatients ? <button type="button" className="btn btn-primary" onClick={() => setShowReg(true)}>Register citizen</button> : null} />
        ) : (
          <div className="table-scroll"><table className="data"><thead><tr><th>Citizen</th><th>centralId</th><th>Age/Gender</th><th>Hospital</th><th>Action</th></tr></thead><tbody>
            {visibleRows.map((p) => (
              <tr key={p.id}>
                <td><span className="cell-main"><Avatar name={p.name} size="sm" /><span className="cell-name">{p.name}</span></span></td>
                <td><code>{p.centralId}</code><br /><small className="cell-sub">#{p.id}</small></td>
                <td className="num">{p.age} · {p.gender || '—'}</td>
                <td>{p.registeredHospital?.name ?? (p.registeredHospital ? `#${p.registeredHospital.id ?? p.registeredHospital}` : '—')}</td>
                <td><Link className="btn btn-sm btn-primary" to={`/patients/${encodeURIComponent(p.centralId)}`}>History <Icon name="arrowRight" size={14} /></Link></td>
              </tr>
            ))}
          </tbody></table></div>
        )}
        <Pagination page={page} size={size} onPage={setPage} onSize={(s) => { setSize(s); setPage(0); }} hasMore={visibleRows.length >= size} />
      </section>
    </div>
  );
}
