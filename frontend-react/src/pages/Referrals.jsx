import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { acceptReferral, createReferral, listHospitals, listPatients, listReferrals, toApiError } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { Avatar, EmptyState, ErrorBanner, Field, Pagination, SectionHeader, Skeleton, StatusPill } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

const COLS = [['PENDING', 'Pending', 'pending'], ['ACCEPTED', 'Accepted', 'accepted'], ['COMPLETED', 'Completed', 'completed']];

export default function Referrals() {
  const { pushToast, can, effectiveScopeId, auth } = useApp();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(12);
  // L4 fix: persist view — initializer reads hub.refView so Table survives reload.
  const [view, setView] = useState(() => { try { return localStorage.getItem('hub.refView') || 'board'; } catch { return 'board'; } });
  const [fromF, setFromF] = useState('');
  const [toF, setToF] = useState('');
  const [dragId, setDragId] = useState(null);
  const [triage, setTriage] = useState(null);
  const [form, setForm] = useState({ patientId: '', fromHospitalId: effectiveScopeId ? String(effectiveScopeId) : '', toHospitalId: '', reason: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [r, h, p] = await Promise.all([listReferrals(page, size), listHospitals().catch(() => []), listPatients(0, 20).catch(() => [])]);
      setRows(Array.isArray(r) ? r : []);
      setHospitals(Array.isArray(h) ? h : []);
      setPatients(Array.isArray(p) ? p : []);
    } catch (e) { setError(toApiError(e)); } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, size]);
  useEffect(() => {
    const cid = params.get('centralId');
    if (cid) { const hit = patients.find((x) => x.centralId === cid); if (hit) setForm((f) => ({ ...f, patientId: String(hit.id) })); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patients]);

  const hospName = useMemo(() => {
    const m = new Map();
    hospitals.forEach((h) => m.set(String(h.id), h.name));
    return (v) => (v && typeof v === 'object' ? v.name : m.get(String(v)) ?? `#${v ?? ''}`);
  }, [hospitals]);

  const filtered = useMemo(() => rows.filter((r) => {
    const f = String(r.fromHospital?.id ?? r.fromHospitalId ?? '');
    const t = String(r.toHospital?.id ?? r.toHospitalId ?? '');
    // Hospital Admin sees transfers touching their own facility only.
    if (effectiveScopeId && f !== String(effectiveScopeId) && t !== String(effectiveScopeId)) return false;
    if (fromF && f !== fromF) return false;
    if (toF && t !== toF) return false;
    return true;
  }), [rows, fromF, toF, effectiveScopeId]);

  async function submit(e) {
    e.preventDefault();
    if (!form.patientId || !form.fromHospitalId || !form.toHospitalId || !form.reason.trim()) { pushToast('Patient, from/to hospital and reason are required.'); return; }
    if (form.fromHospitalId === form.toHospitalId) { pushToast('From and To hospitals must differ.'); return; }
    setSaving(true);
    try {
      const saved = await createReferral({ patientId: Number(form.patientId), fromHospitalId: Number(effectiveScopeId || form.fromHospitalId), toHospitalId: Number(form.toHospitalId), reason: form.reason.trim() });
      pushToast(`Referral #${saved.id} created (PENDING).`, { ms: 5000 });
      setForm({ patientId: '', fromHospitalId: effectiveScopeId ? String(effectiveScopeId) : '', toHospitalId: '', reason: '' });
      setParams({});
      load();
    } catch (err) { pushToast(toApiError(err).message); } finally { setSaving(false); }
  }

  async function accept(id) {
    try { await acceptReferral(id); pushToast(`Referral #${id} accepted.`); setTriage(null); load(); }
    catch (e) { pushToast(`${toApiError(e).message} — refreshed; retry.`); load(); }
  }

  function onDrop(col) {
    if (dragId == null) return;
    if (col === 'PENDING') { setDragId(null); return; }
    if (col === 'ACCEPTED') accept(dragId);
    else pushToast('COMPLETED is terminal in this demo — use Accept to move PENDING → ACCEPTED.');
    setDragId(null);
  }

  const byStatus = (s) => filtered.filter((r) => String(r.status).toUpperCase() === s);

  return (
    <div>
      <div className="page-head"><div><h1>{can.manageReferrals ? 'Referrals — inter-hospital queue' : 'Referrals overview'}</h1><hr className="ashoka-v2" aria-hidden="true" /><p className="hint" style={{ margin: 0 }}>{can.manageReferrals ? 'Transfer without losing history. Drag cards PENDING → ACCEPTED, or use the accessible table view.' : 'Read-only network view. Hospitals accept and route transfers themselves.'}</p></div>
        <div className="page-actions" role="group" aria-label="View toggle"><button type="button" className={`btn btn-sm ${view === 'board' ? 'btn-primary' : ''}`} onClick={() => { try { localStorage.setItem('hub.refView', 'board'); } catch { /* ignore */ } setView('board'); }} aria-pressed={view === 'board'}>Kanban</button><button type="button" className={`btn btn-sm ${view === 'table' ? 'btn-primary' : ''}`} onClick={() => { try { localStorage.setItem('hub.refView', 'table'); } catch { /* ignore */ } setView('table'); }} aria-pressed={view === 'table'}>Table (screen-reader)</button></div></div>
      <ErrorBanner error={error} onRetry={load} />

      {can.manageReferrals && (
      <form className="card" onSubmit={submit} aria-label="Create referral" style={{ marginBottom: 12 }}>
        <SectionHeader title="New referral" hint="Created as PENDING; the receiving hospital accepts it." />
        <div className="form-grid form-grid-2">
          <Field label="Patient" id="rf-p" required error={null}><select id="rf-p" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}><option value="">— choose —</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.centralId}</option>)}</select></Field>
          <Field label="Reason (required)" id="rf-r" required error={null}><input id="rf-r" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Cardiology review" /></Field>
          <Field label="From hospital" id="rf-f" hint="Locked to your facility." required error={null}><select id="rf-f" value={form.fromHospitalId} disabled={!!effectiveScopeId} onChange={(e) => setForm({ ...form, fromHospitalId: e.target.value })}><option value="">— choose —</option>{hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></Field>
          <Field label="To hospital" id="rf-t" required error={null}><select id="rf-t" value={form.toHospitalId} onChange={(e) => setForm({ ...form, toHospitalId: e.target.value })}><option value="">— choose —</option>{hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></Field>
        </div>
        <div style={{ marginTop: 8 }}><button className="btn btn-primary" disabled={saving}>{saving ? 'Sending…' : (<><Icon name="swap" size={16} /> Send referral</>)}</button></div>
      </form>
      )}

      <div className="toolbar">
        <div><label className="field-label" htmlFor="rf-ff">From</label><select id="rf-ff" value={fromF} onChange={(e) => setFromF(e.target.value)}><option value="">All</option>{hospitals.map((h) => <option key={h.id} value={String(h.id)}>{h.name}</option>)}</select></div>
        <div><label className="field-label" htmlFor="rf-tf">To</label><select id="rf-tf" value={toF} onChange={(e) => setToF(e.target.value)}><option value="">All</option>{hospitals.map((h) => <option key={h.id} value={String(h.id)}>{h.name}</option>)}</select></div>
      </div>

      {loading ? <Skeleton height={220} /> : filtered.length === 0 ? (
        <div className="card"><EmptyState art="referral" title="All clear — triage starts here" body="No referrals in this filter. New transfers will queue here." action={<button type="button" className="btn btn-primary" onClick={() => { setFromF(''); setToF(''); }}>View pending</button>} /></div>
      ) : view === 'board' ? (
        <div className="kanban" aria-label="Referral board">
          {COLS.map(([key, label, cls]) => (
            <section key={key} className="kanban-col" aria-label={`${label} column`}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
              onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
              onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('dragover'); onDrop(key); }}>
              <div className={`kanban-head ${cls}`}><span style={{ width: 10, height: 10, borderRadius: 99, background: key === 'PENDING' ? 'var(--color-saffron)' : key === 'ACCEPTED' ? 'var(--color-info)' : 'var(--color-success)' }} /> {label} <span className="kanban-count">{byStatus(key).length}</span></div>
              {byStatus(key).length === 0 && <div className="hint" style={{ border: '1.5px dashed var(--color-border)', borderRadius: 12, padding: 16, textAlign: 'center' }}>Drop here</div>}
              {byStatus(key).map((r) => (
                <article key={r.id} className={`ref-card ${r.id % 3 === 0 ? 'pri-high' : r.id % 3 === 1 ? 'pri-medium' : 'pri-low'}`} draggable={can.acceptReferrals && String(r.status).toUpperCase() === 'PENDING'}
                  onDragStart={() => setDragId(r.id)} onClick={() => setTriage(r)} aria-label={`Referral ${r.id} ${r.status} — open triage`} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><strong>#{r.id}</strong> <StatusPill status={r.status} /></div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}><Avatar name={r.patient?.name || 'P'} size="sm" /><span>{r.patient?.name ?? `#${r.patient?.id ?? ''}`} <span className="hint">{r.patient?.centralId ?? ''}</span></span></div>
                  <div className="hint" style={{ marginTop: 4 }}>{hospName(r.fromHospital ?? r.fromHospitalId)} → {hospName(r.toHospital ?? r.toHospitalId)}</div>
                  <div style={{ margin: '6px 0', fontSize: 14 }}>{r.reason}</div>
                  <div style={{ display: 'flex', gap: 6 }}><button type="button" className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); setTriage(r); }}>Triage</button>
                    {String(r.status).toUpperCase() === 'PENDING' && can.acceptReferrals && (<button type="button" className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); accept(r.id); }}>Accept</button>)}</div>
                </article>
              ))}
            </section>
          ))}
        </div>
      ) : (
        <div className="card"><div className="table-scroll"><table className="data"><thead><tr><th>ID</th><th>Patient</th><th>From → To</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {filtered.map((r) => (
            <tr key={r.id}><td className="num">#{r.id}</td><td><span className="cell-main"><Avatar name={r.patient?.name || 'P'} size="sm" /><span>{r.patient?.name ?? ''} <span className="hint">{r.patient?.centralId ?? ''}</span></span></span></td><td>{hospName(r.fromHospital ?? r.fromHospitalId)} → {hospName(r.toHospital ?? r.toHospitalId)}</td><td>{r.reason}</td><td><StatusPill status={r.status} /></td><td>{String(r.status).toUpperCase() === 'PENDING' && can.acceptReferrals && <button type="button" className="btn btn-sm btn-primary" onClick={() => accept(r.id)}>Accept</button>}</td></tr>
          ))}
        </tbody></table></div></div>
      )}
      {triage && (
        <div role="dialog" aria-label={`Triage referral ${triage.id}`} style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 'min(400px,100vw)', background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)', boxShadow: 'var(--elevation-3)', zIndex: 70, padding: 20, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h3>Referral #{triage.id}</h3><button type="button" className="btn btn-sm btn-ghost" onClick={() => setTriage(null)} aria-label="Close triage"><Icon name="x" size={16} /></button></div>
          <p><StatusPill status={triage.status} /></p>
          <p><strong>Patient:</strong> {triage.patient?.name} <code>{triage.patient?.centralId}</code></p>
          <p><strong>Route:</strong> {hospName(triage.fromHospital ?? triage.fromHospitalId)} → {hospName(triage.toHospital ?? triage.toHospitalId)}</p>
          <p><strong>Reason:</strong> {triage.reason}</p>
          <p className="hint">Vitals: stable · Attachments: 0 · Audit: created {String(triage.createdAt || '').slice(0, 10)}</p>
          {can.acceptReferrals && String(triage.status).toUpperCase() === 'PENDING' && (<div style={{ display: 'flex', gap: 8 }}><button type="button" className="btn btn-primary" onClick={() => accept(triage.id)}>Accept referral</button></div>)}
        </div>
      )}
      <Pagination page={page} size={size} onPage={setPage} onSize={(s) => { setSize(s); setPage(0); }} hasMore={rows.length >= size} />
    </div>
  );
}
