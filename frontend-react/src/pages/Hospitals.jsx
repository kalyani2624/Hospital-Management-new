import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createHospital, getAvailability, listHospitals, toApiError } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { Avatar, EmptyState, ErrorBanner, Field, LoadLight, Pagination, SectionHeader, Skeleton } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

export default function Hospitals() {
  const { pushToast, can, effectiveScopeId, isAuthenticated } = useApp();
  const [rows, setRows] = useState([]);
  const [avail, setAvail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeF, setTypeF] = useState('');
  const [cityF, setCityF] = useState('');
  const [q, setQ] = useState('');
  const [loadF, setLoadF] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', type: 'DISTRICT', totalBeds: 100 });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const staffCanCreate = isAuthenticated && can.manageHospitals;
  const adminView = staffCanCreate;

  // M3 fix: fetch the FULL registry once (no ?page&size), filter client-side,
  // then paginate the FILTERED set. Server paging before client filtering hid
  // rows on other pages and made hasMore lie. Registry is small (demo scale);
  // if it grows past 200 rows, add backend ?type&city&q filters instead.
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [h, a] = await Promise.all([listHospitals(), getAvailability().catch(() => [])]);
      setRows(Array.isArray(h) ? h : []);
      setAvail(Array.isArray(a) ? a : []);
    } catch (e) {
      const ae = toApiError(e);
      console.warn('Hospitals load failed', ae);
      setError({ ...ae, message: 'Hospital list is temporarily unavailable. Showing what we can — please retry.' });
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const availById = useMemo(() => { const m = new Map(); avail.forEach((r) => m.set(Number(r.hospitalId), r)); return m; }, [avail]);

  const filtered = useMemo(() => {
    let out = rows;
    if (isAuthenticated && effectiveScopeId) out = out.filter((h) => String(h.id) === String(effectiveScopeId));
    if (typeF) out = out.filter((h) => String(h.type).toUpperCase() === typeF);
    if (cityF) out = out.filter((h) => String(h.city || '').toLowerCase().includes(cityF.toLowerCase()));
    if (q) out = out.filter((h) => String(h.name || '').toLowerCase().includes(q.toLowerCase()));
    if (loadF) out = out.filter((h) => {
      const a = availById.get(Number(h.id));
      const tot = a?.totalBeds ?? h.totalBeds ?? 0;
      const occ = a?.occupiedBeds ?? 0;
      const pct = tot ? (occ / tot) * 100 : 0;
      if (loadF === 'available') return pct < 80;
      if (loadF === 'tight') return pct >= 80 && pct < 100;
      if (loadF === 'full') return pct >= 100;
      return true;
    });
    return out;
  }, [rows, typeF, cityF, q, loadF, effectiveScopeId, availById, isAuthenticated]);

  // Client-side paging over the FILTERED set — hasMore is now truthful.
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const safePage = Math.min(page, totalPages - 1);
  const paged = useMemo(
    () => filtered.slice(safePage * size, safePage * size + size),
    [filtered, safePage, size],
  );
  const hasMore = (safePage + 1) * size < filtered.length;

  async function submitCreate(e) {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim() || !form.city.trim()) { setFormError('Name and city are required.'); return; }
    setSaving(true);
    try {
      const saved = await createHospital({ name: form.name.trim(), city: form.city.trim(), type: form.type, totalBeds: Number(form.totalBeds) || 0 });
      pushToast(`Hospital "${saved.name}" created.`, { actionLabel: 'View', onAction: () => { window.location.hash = `#/hospitals/${saved.id}`; } });
      setShowCreate(false);
      setForm({ name: '', city: '', type: 'DISTRICT', totalBeds: 100 });
      load();
    } catch (err) {
      const ae = toApiError(err);
      setFormError(ae.status === 400 ? `Validation failed: ${ae.message}` : ae.message);
    } finally { setSaving(false); }
  }

  return (
    <div className="landing-body" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 56px' }}>
      <p className="eyebrow" style={{ color: 'var(--color-primary)' }}>{adminView ? 'NETWORK ADMINISTRATION' : 'Find care · No login needed'}</p>
      <div className="page-head"><div><h1 style={{ fontSize: 'clamp(26px,3.4vw,38px)' }}>{adminView ? 'Hospital Management' : 'Find a hospital near you'}</h1><hr className="ashoka-v2" aria-hidden="true" /><p className="hint" style={{ margin: 0 }}>{adminView ? 'Manage the hospital registry and monitor bed capacity across the network.' : 'Browse connected hospitals, see doctors and book an appointment.'}</p></div>
        <div className="page-actions">{staffCanCreate && <button type="button" className="btn btn-primary" onClick={() => setShowCreate((v) => !v)}><Icon name="plus" size={16} /> New hospital</button>}</div></div>
      <ErrorBanner error={error} onRetry={load} hint="Check your connection, then retry. Emergency? Call 108." />

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="toolbar" role="search" aria-label="Filter hospitals" style={{ margin: 0 }}>
          <div className="grow"><label className="field-label" htmlFor="hq">Search name or city</label><input id="hq" type="search" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="e.g. Thane, Sion, Pune…" /></div>
          <div><label className="field-label" htmlFor="ht">Type</label><select id="ht" value={typeF} onChange={(e) => { setTypeF(e.target.value); setPage(0); }}><option value="">All types</option><option value="CENTRAL">CENTRAL</option><option value="DISTRICT">DISTRICT</option><option value="COMMUNITY">COMMUNITY</option></select></div>
          <div><label className="field-label" htmlFor="hc">City</label><input id="hc" value={cityF} onChange={(e) => { setCityF(e.target.value); setPage(0); }} placeholder="Thane…" /></div>
        </div>
        <div className="filter-pills" style={{ marginTop: 10 }} role="group" aria-label="Load filter">
          {[['', 'All loads'], ['available', 'Available'], ['tight', 'Tight 80%+'], ['full', 'Full']].map(([v, l]) => (
            <button key={v} type="button" className="filter-pill" aria-pressed={loadF === v} onClick={() => { setLoadF(v); setPage(0); }}>{l}</button>
          ))}
        </div>
        <p className="hint" style={{ margin: '8px 0 0' }}>{filtered.length} match{filtered.length === 1 ? '' : 'es'} in registry{filtered.length > size ? ` — showing ${(safePage * size) + 1}–${Math.min(filtered.length, (safePage + 1) * size)}` : ''}.</p>
      </div>

      {showCreate && staffCanCreate && (
        <form className="card" onSubmit={submitCreate} aria-label="Create hospital" style={{ marginBottom: 12 }}>
          <SectionHeader title="Register hospital (staff)" hint="SuperAdmin only — creates a live registry entry." />
          {formError && <div className="alert alert-error" role="alert"><Icon name="alert" size={18} /> {formError}</div>}
          <div className="form-grid form-grid-2">
            <Field label="Name" id="nh-name" required error={null}><input id="nh-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Civil Hospital Thane" /></Field>
            <Field label="City" id="nh-city" required error={null}><input id="nh-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required placeholder="Thane" /></Field>
            <Field label="Type" id="nh-type"><select id="nh-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>CENTRAL</option><option>DISTRICT</option><option>COMMUNITY</option></select></Field>
            <Field label="Total beds" id="nh-beds" hint="Registry capacity; live stock lives on the Beds board."><input id="nh-beds" type="number" min={0} value={form.totalBeds} onChange={(e) => setForm({ ...form, totalBeds: e.target.value })} /></Field>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Create hospital'}</button><button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button></div>
        </form>
      )}

      {loading ? <Skeleton height={220} count={1} /> : filtered.length === 0 ? (
        <div className="card"><EmptyState art="hospital" title="No hospitals match" body="Clear filters or try another city. Emergency? Call 108 now." action={staffCanCreate ? <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>Create hospital</button> : <Link className="btn btn-primary" to="/emergency">Emergency help</Link>} secondary={<button type="button" className="btn btn-ghost" onClick={() => { setQ(''); setCityF(''); setTypeF(''); setLoadF(''); setPage(0); }}>Clear filters</button>} /></div>
      ) : (
        <div className="doc-grid">
          {paged.map((h) => {
            const a = availById.get(Number(h.id));
            const tot = a?.totalBeds ?? h.totalBeds ?? 0;
            const occ = a?.occupiedBeds ?? 0;
            const free = Math.max(0, tot - occ);
            const pct = tot ? Math.round((occ / tot) * 100) : 0;
            return (
              <article key={h.id} className="card hosp-card-cit">
                <div style={{ height: 6, borderRadius: 6, background: pct >= 100 ? 'var(--color-danger)' : pct >= 80 ? 'var(--color-saffron)' : 'var(--gradient-brand)', margin: '-18px -18px 14px' }} aria-hidden="true" />
                {pct >= 90 && tot > 0 && (<div className="alert alert-warn" role="alert" style={{ marginTop: 0 }}><Icon name="alert" size={18} /><span>Nearly full — {pct}% occupied. Consider a nearby hospital or call 108 for guidance.</span></div>)}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Avatar name={h.name} size="md" />
                  <div><h3 style={{ margin: 0 }}><Link to={`/hospitals/${h.id}`}>{h.name}</Link></h3><p className="hint" style={{ margin: 0 }}>{h.type} · {h.city} · <span className="pill pill-info" style={{ fontSize: 11 }}>{free} free</span></p></div>
                </div>
                <div style={{ marginTop: 10 }}><LoadLight total={tot} occupied={occ} /></div>
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {!adminView && <Link className="btn btn-sm btn-primary" to={`/appointments?hospitalId=${h.id}`}>Book <Icon name="arrowRight" size={14} /></Link>}
                  <Link className="btn btn-sm" to={`/hospitals/${h.id}`}>{adminView ? 'View hospital details' : 'View + doctors'}</Link>
                  {!adminView && <a className="btn btn-sm btn-ghost" href="tel:108"><Icon name="phone" size={14} /> Call</a>}
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Pagination page={safePage} size={size} onPage={setPage} onSize={(s) => { setSize(s); setPage(0); }} hasMore={hasMore} />
      {!isAuthenticated && <p className="hint" style={{ marginTop: 12 }}>Staff? <Link to="/login?next=%2Fhospitals">Login</Link> to register hospitals and manage capacity.</p>}
    </div>
  );
}
