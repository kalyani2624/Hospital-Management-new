import { useEffect, useMemo, useState } from 'react';
import { admitBed, dischargeBed, getAvailability, listBeds, listHospitals, toApiError, upsertBed } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { EmptyState, ErrorBanner, Field, LoadLight, SectionHeader, Skeleton } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

const WARDS = ['GENERAL', 'ICU', 'EMERGENCY', 'PEDIATRIC'];

export default function Beds() {
  const { pushToast, can, effectiveScopeId } = useApp();
  const [beds, setBeds] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [avail, setAvail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hospF, setHospF] = useState('');
  const [wardF, setWardF] = useState('');
  const [upsert, setUpsert] = useState({ hospitalId: effectiveScopeId ? String(effectiveScopeId) : '', wardType: 'GENERAL', total: 20 });
  const [busy, setBusy] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [b, h, a] = await Promise.all([listBeds().catch(() => []), listHospitals().catch(() => []), getAvailability().catch(() => [])]);
      setBeds(Array.isArray(b) ? b : []);
      setHospitals(Array.isArray(h) ? h : []);
      setAvail(Array.isArray(a) ? a : []);
    } catch (e) { setError(toApiError(e)); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const hospById = useMemo(() => {
    const m = new Map();
    hospitals.forEach((h) => m.set(String(h.id), h));
    avail.forEach((a) => { if (!m.has(String(a.hospitalId))) m.set(String(a.hospitalId), { id: a.hospitalId, name: a.hospitalName, city: a.city }); });
    return m;
  }, [hospitals, avail]);

  const filtered = useMemo(() => beds.filter((b) => {
    const hid = String(b.hospital?.id ?? '');
    if (effectiveScopeId && hid !== String(effectiveScopeId)) return false;
    if (hospF && hid !== hospF) return false;
    if (wardF && String(b.wardType).toUpperCase() !== wardF) return false;
    return true;
  }), [beds, hospF, wardF, effectiveScopeId]);

  async function doAdmit(hospitalId, wardType) {
    const key = `${hospitalId}:${wardType}:admit`;
    setBusy(key);
    const prev = beds;
    setBeds((rows) => rows.map((b) => String(b.hospital?.id) === String(hospitalId) && String(b.wardType).toUpperCase() === String(wardType).toUpperCase() ? { ...b, occupied: Number(b.occupied) + 1 } : b));
    try {
      const saved = await admitBed(hospitalId, wardType);
      setBeds((rows) => rows.map((b) => (b.id === saved.id ? saved : b)));
      pushToast(`Admitted — ${wardType} at #${hospitalId}. Available ${saved.available ?? Math.max(0, saved.total - saved.occupied)}.`, { actionLabel: 'Undo (discharge)', ms: 30000, onAction: async () => { try { const r = await dischargeBed(hospitalId, wardType); setBeds((rows) => rows.map((b) => (b.id === r.id ? r : b))); } catch { /* ignore */ } } });
    } catch (e) {
      setBeds(prev);
      const ae = toApiError(e);
      pushToast(ae.status === 409 ? `Full — ${wardType} at #${hospitalId} is 100% occupied. Try a nearby hospital from Central Command.` : ae.message);
    } finally { setBusy(''); }
  }

  async function doDischarge(hospitalId, wardType) {
    const key = `${hospitalId}:${wardType}:dis`;
    setBusy(key);
    const prev = beds;
    setBeds((rows) => rows.map((b) => String(b.hospital?.id) === String(hospitalId) && String(b.wardType).toUpperCase() === String(wardType).toUpperCase() ? { ...b, occupied: Math.max(0, Number(b.occupied) - 1) } : b));
    try {
      const saved = await dischargeBed(hospitalId, wardType);
      setBeds((rows) => rows.map((b) => (b.id === saved.id ? saved : b)));
      pushToast(`Discharged — ${wardType} at #${hospitalId}.`, { actionLabel: 'Undo (re-admit)', ms: 30000, onAction: async () => { try { const r = await admitBed(hospitalId, wardType); setBeds((rows) => rows.map((b) => (b.id === r.id ? r : b))); } catch { /* ignore */ } } });
    } catch (e) { setBeds(prev); pushToast(toApiError(e).message); } finally { setBusy(''); }
  }

  async function submitUpsert(e) {
    e.preventDefault();
    if (!upsert.hospitalId) { pushToast('Choose a hospital first.'); return; }
    try {
      const saved = await upsertBed({ hospitalId: Number(upsert.hospitalId), wardType: upsert.wardType, total: Number(upsert.total) || 0 });
      pushToast(`Stock saved — ${saved.wardType}: ${saved.total} total.`);
      load();
    } catch (err) { pushToast(toApiError(err).message); }
  }

  return (
    <div>
      <div className="page-head"><div><h1>{can.manageBeds ? 'Bed management' : 'Bed availability'}</h1><hr className="ashoka-v2" aria-hidden="true" /><p className="hint" style={{ margin: 0 }}>{can.manageBeds ? 'Admit is disabled at 0 available. Tight wards (>80%) ask for confirmation. Discharge offers a 30s undo. Labels and percentages always accompany colour.' : 'Read-only network occupancy. Admitting, discharging and capacity changes belong to each hospital admin.'}</p></div></div>
      <ErrorBanner error={error} onRetry={load} />
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="pill pill-completed"><Icon name="checkCircle" size={14} /> Available</span>
          <span className="pill pill-pending"><Icon name="alert" size={14} /> Tight 80%+</span>
          <span className="pill pill-cancelled"><Icon name="xCircle" size={14} /> Full</span>
        </div>
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <div><label className="field-label" htmlFor="bd-h">Hospital</label><select id="bd-h" value={hospF} onChange={(e) => setHospF(e.target.value)}><option value="">All</option>{[...hospById.values()].filter((h) => !effectiveScopeId || String(h.id) === String(effectiveScopeId)).map((h) => <option key={h.id} value={String(h.id)}>{h.name}</option>)}</select></div>
          <div><label className="field-label" htmlFor="bd-w">Ward</label><select id="bd-w" value={wardF} onChange={(e) => setWardF(e.target.value)}><option value="">All</option>{WARDS.map((w) => <option key={w}>{w}</option>)}</select></div>
        </div>
      </div>

      {can.manageBeds && (
        <form className="card" style={{ marginBottom: 12 }} onSubmit={submitUpsert} aria-label="Upsert bed stock">
          <SectionHeader title="Set ward capacity" hint="HospitalAdmin — total beds per ward." />
          <div className="form-grid form-grid-3">
            <Field label="Hospital" id="up-h" hint={effectiveScopeId ? 'Locked to your facility.' : undefined} required error={null}><select id="up-h" value={upsert.hospitalId} disabled={!!effectiveScopeId} onChange={(e) => setUpsert({ ...upsert, hospitalId: e.target.value })}><option value="">— choose —</option>{[...hospById.values()].filter((h) => !effectiveScopeId || String(h.id) === String(effectiveScopeId)).map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></Field>
            <Field label="Ward" id="up-w"><select id="up-w" value={upsert.wardType} onChange={(e) => setUpsert({ ...upsert, wardType: e.target.value })}>{WARDS.map((w) => <option key={w}>{w}</option>)}</select></Field>
            <Field label="Total beds" id="up-t"><input id="up-t" type="number" min={0} value={upsert.total} onChange={(e) => setUpsert({ ...upsert, total: e.target.value })} /></Field>
          </div>
          <div style={{ marginTop: 8 }}><button className="btn btn-primary"><Icon name="check" size={16} /> Save capacity</button></div>
        </form>
      )}

      {loading ? <Skeleton height={240} /> : filtered.length === 0 ? (
        <div className="card"><EmptyState art="bed" title="No bed rows" body="Set ward capacity above, or seed hospitals first." action={<button type="button" className="btn btn-primary" onClick={() => setHospF('')}>Clear filter</button>} /></div>
      ) : (
        <div className="bed-matrix">
          {filtered.map((b) => {
            const hid = b.hospital?.id;
            const total = Number(b.total) || 0;
            const occ = Number(b.occupied) || 0;
            const availN = b.available ?? Math.max(0, total - occ);
            const pct = total ? Math.round((occ / total) * 100) : 0;
            const full = availN <= 0;
            const tight = pct >= 80 && !full;
            const key = `${hid}:${b.wardType}`;
            return (
              <article key={b.id ?? key} className="bed-cell">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ marginBottom: 2 }}>{hospById.get(String(hid))?.name ?? `Hospital #${hid}`} <span className="hint">· {b.wardType}</span></h3>
                  <span style={{ width: 44, height: 44, borderRadius: 999, border: '3px solid var(--color-border-subtle)', borderTopColor: full ? 'var(--color-danger)' : tight ? 'var(--color-saffron)' : 'var(--color-success)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12 }} role="img" aria-label={`${pct}% occupied`}>{pct}%</span>
                </div>
                <p style={{ margin: '6px 0' }}><LoadLight total={total} occupied={occ} /></p>
                <p className="num" style={{ margin: '0 0 6px' }}>Available <strong>{availN}</strong> of {total}</p>
                <div className="bed-tiles" aria-hidden="true">
                  {Array.from({ length: Math.min(12, Math.max(4, total || 4)) }).map((_, i) => {
                    const isOcc = i < Math.round(((occ / Math.max(1, total)) * Math.min(12, Math.max(4, total || 4))));
                    return <span key={i} className={`bed-tile ${isOcc ? 'occ' : 'free'}`}>{isOcc ? '•' : '○'}</span>;
                  })}
                </div>
                {tight && <div className="alert alert-warn" role="alert" style={{ margin: '8px 0 0' }}><Icon name="alert" size={16} /> Tight — confirm before admitting; consider diversion.</div>}
                {full && <div className="alert alert-error" role="alert" style={{ margin: '8px 0 0' }}><Icon name="xCircle" size={16} /> Full — admit disabled. Suggest nearby hospitals.</div>}
                {can.manageBeds && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button type="button" className="btn btn-sm btn-primary" disabled={full || busy === `${hid}:${b.wardType}:admit`} onClick={() => { if (tight && !window.confirm(`Ward is ${pct}% full. Admit anyway?`)) return; doAdmit(hid, b.wardType); }}>{busy === `${hid}:${b.wardType}:admit` ? 'Admitting…' : 'Admit'}</button>
                    <button type="button" className="btn btn-sm" disabled={busy === `${hid}:${b.wardType}:dis` || occ <= 0} onClick={() => doDischarge(hid, b.wardType)}>{busy === `${hid}:${b.wardType}:dis` ? 'Working…' : 'Discharge'}</button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
