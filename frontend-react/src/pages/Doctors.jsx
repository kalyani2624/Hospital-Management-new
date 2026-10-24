import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { createDoctor, listDoctors, listHospitals, toApiError } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { Avatar, EmptyState, ErrorBanner, Field, Pagination, Skeleton } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

const SPECS = ['', 'General', 'Cardiology', 'Orthopaedic', 'Pediatrics', 'Gynaecology', 'Neurology', 'Dermatology', 'ENT', 'Ophthalmology', 'Eye', 'Dental'];

export default function Doctors() {
  const { pushToast, can, effectiveScopeId, isAuthenticated } = useApp();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(12);

  const hospitalId = params.get('hospitalId') || (isAuthenticated ? effectiveScopeId || '' : '');
  const specialization = params.get('specialization') || params.get('dept') || '';
  const q = params.get('q') || '';
  const availOnly = params.get('avail') === '1';
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', specialization: 'General', hospitalId: '' });
  const [saving, setSaving] = useState(false);
  const staffCanPost = isAuthenticated && can.manageDoctors;

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [d, h] = await Promise.all([listDoctors({ hospitalId: hospitalId || undefined, specialization: specialization || undefined, page, size }), listHospitals().catch(() => [])]);
      setRows(Array.isArray(d) ? d : []);
      setHospitals(Array.isArray(h) ? h : []);
    } catch (e) {
      const ae = toApiError(e);
      console.warn('Doctors load failed', ae);
      setError({ ...ae, message: 'Doctor list is temporarily unavailable. Please retry.' });
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [hospitalId, specialization, page, size]);

  const hospById = useMemo(() => { const m = new Map(); hospitals.forEach((h) => m.set(String(h.id), h)); return m; }, [hospitals]);

  const filtered = useMemo(() => {
    let out = rows;
    if (q) out = out.filter((d) => String(d.name || '').toLowerCase().includes(q.toLowerCase()));
    // M1 fix: avail=1 now actually filters — estimated free-slot check (see slotStrip).
    if (availOnly) out = out.filter((d) => hasFreeSlotToday(d.id));
    return out;
  }, [rows, q, availOnly]);

  function set(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key === 'dept') { if (value) next.set('specialization', value); next.delete('dept'); }
    setParams(next);
  }

  // M2: no real slot-availability REST API exists (only SOAP getDoctorSchedule),
  // so the strip is an explicitly-labelled ESTIMATED demo pattern. Booking stays
  // server-validated (409) so citizens are never misled into a false guarantee.
  // ~1 in 9 demo doctors show fully booked so the avail=1 filter is testable.
  function slotStrip(seed) {
    const base = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'];
    const n = Number(seed) || 0;
    if (n % 9 === 8) return base.map((t) => ({ t, booked: true }));
    return base.map((t, i) => ({ t, booked: (n + i) % 4 === 0 }));
  }

  function hasFreeSlotToday(seed) {
    return slotStrip(seed).some((s) => !s.booked);
  }

  async function submitCreate(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.hospitalId) { pushToast('Name and hospital are required.'); return; }
    setSaving(true);
    try {
      const saved = await createDoctor({ name: form.name.trim(), specialization: form.specialization, hospitalId: Number(form.hospitalId) });
      pushToast(`Dr ${saved.name} posted.`);
      setShowCreate(false);
      setForm({ name: '', specialization: 'General', hospitalId: '' });
      load();
    } catch (err) { pushToast(toApiError(err).message); } finally { setSaving(false); }
  }

  return (
    <div className="landing-body" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 56px' }}>
      <p className="eyebrow" style={{ color: 'var(--color-primary)' }}>Find care · No login needed</p>
      <div className="page-head"><div><h1 style={{ fontSize: 'clamp(26px,3.4vw,38px)' }}>Meet our doctors</h1><hr className="ashoka-v2" aria-hidden="true" /><p className="hint" style={{ margin: 0 }}>Qualification, hospital, next available (estimated demo pattern) — then one-tap booking. Fees told upfront at desk. {availOnly && 'Showing only doctors with an estimated free slot today.'}</p></div>
        <div className="page-actions">{staffCanPost && <button type="button" className="btn btn-primary" onClick={() => setShowCreate((v) => !v)}><Icon name="plus" size={16} /> Post doctor</button>}{(hospitalId || specialization || q || availOnly) && <button type="button" className="btn btn-ghost" onClick={() => setParams({})}>Clear filters</button>}</div></div>
      <ErrorBanner error={error} onRetry={load} hint="Check your connection, then retry." />

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="toolbar" style={{ margin: 0 }}>
          <div><label className="field-label" htmlFor="dh">Hospital</label><select id="dh" value={hospitalId} onChange={(e) => { set('hospitalId', e.target.value); setPage(0); }}><option value="">{isAuthenticated && effectiveScopeId ? 'My hospital' : 'All hospitals'}</option>{hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
          <div><label className="field-label" htmlFor="ds">Specialization</label><select id="ds" value={specialization} onChange={(e) => { set('specialization', e.target.value); setPage(0); }}>{SPECS.map((s) => <option key={s} value={s}>{s === '' ? 'All' : s}</option>)}</select></div>
          <div className="grow"><label className="field-label" htmlFor="dq">Search name</label><input id="dq" type="search" value={q} onChange={(e) => set('q', e.target.value)} placeholder="e.g. Rao, Meera…" /></div>
          <div><label className="field-label" htmlFor="da">Availability</label><select id="da" value={availOnly ? '1' : ''} onChange={(e) => set('avail', e.target.value)}><option value="">All</option><option value="1">Has free slot today</option></select></div>
        </div>
        <div className="filter-pills" style={{ marginTop: 10 }} role="group" aria-label="Specialty quick filter">
          {['', 'General', 'Cardiology', 'Pediatrics', 'Orthopaedic', 'Eye'].map((s) => (
            <button key={s} type="button" className="filter-pill" aria-pressed={specialization === s} onClick={() => { set('specialization', s); setPage(0); }}>{s === '' ? 'All' : s}</button>
          ))}
        </div>
      </div>

      {showCreate && staffCanPost && (
        <form className="card" style={{ marginBottom: 12 }} onSubmit={submitCreate}>
          <h3>Post doctor (staff)</h3>
          <div className="form-grid form-grid-3">
            <Field label="Name" id="nd-n" required error={null}><input id="nd-n" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr Rao" required /></Field>
            <Field label="Specialization" id="nd-s"><select id="nd-s" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })}>{SPECS.filter(Boolean).map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label="Hospital" id="nd-h" required error={null}><select id="nd-h" value={form.hospitalId} onChange={(e) => setForm({ ...form, hospitalId: e.target.value })} required><option value="">— choose —</option>{hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></Field>
          </div>
          <div style={{ marginTop: 8 }}><button className="btn btn-primary" disabled={saving}>{saving ? 'Posting…' : 'Post doctor'}</button></div>
        </form>
      )}

      {loading ? <Skeleton height={200} /> : filtered.length === 0 ? (
        <div className="card"><EmptyState art="doctor" title={specialization ? `No ${specialization} doctor found` : 'No doctors found'} body="Try another specialty or hospital — or call 108 for urgent guidance." action={<button type="button" className="btn" onClick={() => setParams({})}>Clear filters</button>} secondary={<Link className="btn btn-primary" to="/appointments">Book any OPD</Link>} /></div>
      ) : (
        <div className="doc-grid">
          {filtered.map((d) => {
            const h = hospById.get(String(d.hospital?.id ?? '')) ?? d.hospital;
            const slots = slotStrip(d.id);
            const freeCount = slots.filter((s) => !s.booked).length;
            const fullyBookedDemo = freeCount === 0;
            return (
              <article key={d.id} className="card doc-card">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Avatar name={d.name} size="md" ring />
                  <div><h3 style={{ margin: 0 }}>{d.name}</h3><p className="hint" style={{ margin: '2px 0 0' }}><span className="pill pill-completed" style={{ fontSize: 12 }}>{d.specialization}</span> <span>{h?.name ?? ''}{d.department?.name ? ` · ${d.department.name}` : ''}</span></p><p className="hint" style={{ margin: 0 }}>Next available: <strong>{fullyBookedDemo ? 'Tomorrow (estimated)' : 'Today / Tomorrow (estimated)'}</strong> <span title="Demo pattern — live availability is confirmed at booking time (409 if just filled).">ⓘ Estimated</span></p></div>
                </div>
                <p className="hint" style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.06em', margin: '12px 0 4px' }} title="Estimated demo pattern — no live slot API; booking is server-validated.">TODAY · MORNING / EVENING · <span className="pill pill-info" style={{ fontSize: 11 }}>Estimated demo</span></p>
                <div className="slot-strip" aria-label={`Estimated today slots for ${d.name} — demo pattern, confirmed at booking`}>
                  {slots.map((s) => (<span key={s.t} className={`slot ${s.booked ? 'booked' : ''}`} aria-label={`${s.t} ${s.booked ? 'booked (estimated)' : 'available (estimated)'}`} title={s.booked ? 'Estimated booked — try booking, server confirms' : 'Estimated free — server confirms at booking'}>{s.t}</span>))}
                </div>
                <p className="hint" style={{ margin: '6px 0 0', fontSize: 12 }}>Demo pattern — live slot confirmed at booking.</p>
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}><Link className="btn btn-sm btn-primary" to={`/appointments?doctorId=${d.id}&hospitalId=${d.hospital?.id ?? ''}`}>Book <Icon name="arrowRight" size={14} /></Link><a className="btn btn-sm btn-ghost" href="tel:102"><Icon name="phone" size={14} /> Call</a><Link className="btn btn-sm btn-ghost" to={`/doctors?specialization=${encodeURIComponent(d.specialization || '')}`}>More</Link></div>
              </article>
            );
          })}
        </div>
      )}
      <Pagination page={page} size={size} onPage={setPage} onSize={(s) => { setSize(s); setPage(0); }} hasMore={rows.length >= size} />
    </div>
  );
}
