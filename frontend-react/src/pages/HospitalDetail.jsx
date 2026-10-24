import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { bedsByHospital, getHospital, getHospitalLoad, listDoctors, listAppointments, toApiError, updateHospital } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { Avatar, EmptyState, ErrorBanner, KpiCard, LoadLight, OccupancyBar, Skeleton, StatusPill } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

export default function HospitalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pushToast, can, isAuthenticated } = useApp();
  const [hospital, setHospital] = useState(null);
  const [load, setLoad] = useState(null);
  const [beds, setBeds] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appts, setAppts] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', city: '', type: 'DISTRICT', totalBeds: 0 });

  const staffCanEdit = isAuthenticated && can.manageHospitals;

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const [h, l, b, d] = await Promise.all([getHospital(id), getHospitalLoad(id).catch(() => null), bedsByHospital(id).catch(() => []), listDoctors({ hospitalId: id }).catch(() => [])]);
      let a = [];
      if (isAuthenticated) {
        try { const all = await listAppointments(); a = (Array.isArray(all) ? all : []).filter((x) => String(x?.hospital?.id ?? x?.hospitalId) === String(id) || Number(x?.hospital?.id) === Number(id)); } catch { a = []; }
      }
      setHospital(h); setLoad(l); setBeds(Array.isArray(b) ? b : []); setDoctors(Array.isArray(d) ? d : []);
      setAppts(a);
      setEditForm({ name: h.name || '', city: h.city || '', type: h.type || 'DISTRICT', totalBeds: h.totalBeds || 0 });
    } catch (e) {
      const ae = toApiError(e);
      console.warn('Hospital detail failed (citizen fallback)', ae);
      setError({ ...ae, message: 'Hospital detail is temporarily unavailable. Please retry — emergency? Call 108.' });
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id, isAuthenticated]);

  async function saveEdit(e) {
    e.preventDefault();
    try { const saved = await updateHospital(id, editForm); setHospital(saved); setEditing(false); pushToast('Hospital updated.'); }
    catch (err) { pushToast(toApiError(err).message); }
  }

  if (loading) return <div className="landing-body" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 56px' }}><h1>Hospital detail</h1><Skeleton height={280} /></div>;
  if (error || !hospital) return (
    <div className="landing-body" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 56px' }}><button type="button" className="btn btn-sm" onClick={() => navigate(-1)}><Icon name="chevronLeft" size={14} /> Back</button>
      <h1>Hospital #{id}</h1><ErrorBanner error={error || 'Hospital not found. Search again.'} onRetry={fetchAll} hint="Check the registry, then retry." /></div>
  );

  const tot = beds.reduce((s, b) => s + (Number(b.total) || 0), 0);
  const occ = beds.reduce((s, b) => s + (Number(b.occupied) || 0), 0);

  return (
    <div className="landing-body" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 56px' }}>
      <button type="button" className="btn btn-sm" onClick={() => navigate(-1)}><Icon name="chevronLeft" size={14} /> Back</button>
      <div className="card" style={{ marginTop: 10, overflow: 'hidden' }}>
        <div style={{ height: 72, margin: '-18px -18px 0', background: 'var(--gradient-brand)', position: 'relative' }} aria-hidden="true" />
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: -28, position: 'relative', flexWrap: 'wrap' }}>
          <Avatar name={hospital.name} size="xl" />
          <div style={{ flex: 1, minWidth: 220 }}>
            <h1 style={{ marginBottom: 2 }}>{hospital.name}</h1>
            <p className="hint" style={{ margin: 0 }}>{hospital.type} · {hospital.city} · <span className="pill pill-completed"><Icon name="shield" size={12} /> NABH</span> <span className="pill pill-info"><Icon name="heart" size={12} /> AB-PMJAY</span></p>
            <div style={{ marginTop: 8 }}><LoadLight total={load?.totalBeds ?? tot} occupied={load?.occupiedBeds ?? occ} /> <span className="hint">Load: {load ? `${load.doctors} doctors · ${load.appointments} appointments` : `${doctors.length} doctors on roster`}</span></div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link className="btn btn-saffron btn-sm" to={`/appointments?hospitalId=${hospital.id}`}>Book <Icon name="arrowRight" size={14} /></Link>
            <a className="btn btn-sm" href="tel:108"><Icon name="phone" size={14} /> Call 108</a>
            {staffCanEdit && (<button type="button" className="btn btn-sm btn-ghost" onClick={() => setEditing((v) => !v)}>{editing ? 'Close edit' : 'Edit (staff)'}</button>)}
          </div>
        </div>
      </div>
      {editing && staffCanEdit && (
        <form className="card" style={{ marginTop: 10 }} onSubmit={saveEdit}>
          <div className="form-grid form-grid-2">
            <div><label className="field-label" htmlFor="eh-n">Name</label><input id="eh-n" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div><label className="field-label" htmlFor="eh-c">City</label><input id="eh-c" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} /></div>
            <div><label className="field-label" htmlFor="eh-t">Type</label><select id="eh-t" value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}><option>CENTRAL</option><option>DISTRICT</option><option>COMMUNITY</option></select></div>
            <div><label className="field-label" htmlFor="eh-b">Total beds</label><input id="eh-b" type="number" min={0} value={editForm.totalBeds} onChange={(e) => setEditForm({ ...editForm, totalBeds: Number(e.target.value) })} /></div>
          </div>
          <div style={{ marginTop: 8 }}><button className="btn btn-primary">Save</button></div>
        </form>
      )}

      <div className="tabs" role="tablist" aria-label="Hospital sections">
        {[['overview', 'Overview'], ['doctors', `Doctors ${doctors.length}`], ['beds', 'Beds'], ['appointments', 'Appointments']].map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
            <KpiCard label="Doctors" value={load?.doctors ?? doctors.length} index={1} />
            <KpiCard label="Appointments" value={load?.appointments ?? appts.length} index={3} />
            <div className="card kpi-card"><div className="kpi-label">Beds</div><div className="kpi-value num">{occ}/{tot}</div><OccupancyBar total={tot} occupied={occ} /></div>
          </div>
          <div className="card" style={{ marginTop: 12 }}>
            <h3>Ward breakdown — live</h3>
            {beds.length === 0 ? <p className="hint">No ward breakdown yet — availability still shows live totals above.</p> : (
              <div className="table-scroll"><table className="data"><thead><tr><th>Ward</th><th>Total</th><th>Occupied</th><th>Available</th><th>Pressure</th></tr></thead><tbody>{beds.map((b) => (
                <tr key={b.id ?? b.wardType}><td><strong>{b.wardType}</strong></td><td className="num">{b.total}</td><td className="num">{b.occupied}</td><td className="num">{b.available ?? Math.max(0, b.total - b.occupied)}</td><td><OccupancyBar total={b.total} occupied={b.occupied} /></td></tr>
              ))}</tbody></table></div>
            )}
            {doctors.length > 0 && (<div style={{ display: 'flex', gap: 6, marginTop: 12, alignItems: 'center' }}><div style={{ display: 'flex' }}>{doctors.slice(0, 5).map((d, i) => <span key={d.id} style={{ marginLeft: i === 0 ? 0 : -10, zIndex: 5 - i }}><Avatar name={d.name} size="sm" ring /></span>)}</div><span className="hint">+ {doctors.length} doctors on roster</span></div>)}
          </div>
        </div>
      )}

      {tab === 'doctors' && (
        <div className="card">
          {doctors.length === 0 ? <EmptyState art="doctor" title="No doctors here yet" body="Try another hospital, or book any OPD." action={<Link className="btn btn-primary" to="/doctors">Open directory</Link>} /> : (
            <div className="table-scroll"><table className="data"><thead><tr><th>Doctor</th><th>Specialization</th><th>Next</th><th>Action</th></tr></thead><tbody>{doctors.map((d) => (
              <tr key={d.id}><td><span className="cell-main"><Avatar name={d.name} size="sm" ring /><span className="cell-name">{d.name}</span></span></td><td><span className="pill pill-completed">{d.specialization}</span></td><td>Today / Tomorrow</td><td><Link className="btn btn-sm btn-primary" to={`/appointments?doctorId=${d.id}&hospitalId=${hospital.id}`}>Book</Link></td></tr>
            ))}</tbody></table></div>
          )}
        </div>
      )}

      {tab === 'beds' && (
        <div className="card">
          {beds.length === 0 ? <EmptyState art="bed" title="Ward detail coming from live feed" body="Totals above are live. Ward split appears once the Beds board is seeded." /> : (
            <div className="table-scroll"><table className="data"><thead><tr><th>Ward</th><th>Total</th><th>Occupied</th><th>Available</th><th>Load</th></tr></thead><tbody>{beds.map((b) => (
              <tr key={b.id ?? b.wardType}><td><strong>{b.wardType}</strong></td><td className="num">{b.total}</td><td className="num">{b.occupied}</td><td className="num"><strong>{b.available ?? Math.max(0, b.total - b.occupied)}</strong></td><td><LoadLight total={b.total} occupied={b.occupied} /></td></tr>
            ))}</tbody></table></div>
          )}
          <p className="hint">Bed admission / discharge is staff-only. Citizens read live availability here.</p>
        </div>
      )}

      {tab === 'appointments' && (
        <div className="card">
          {!isAuthenticated ? (
            <EmptyState art="calendar" title="Bookings need a quick verify" body="Browse hospitals and doctors freely. To confirm a slot, enter your mobile / ABHA on the booking page — no password needed." action={<Link className="btn btn-primary" to={`/appointments?hospitalId=${hospital.id}`}>Book at this hospital</Link>} secondary={<Link className="btn btn-ghost" to="/login">Staff login</Link>} />
          ) : appts.length === 0 ? <EmptyState art="calendar" title="No appointments here" body="Book the first slot for this facility." action={<Link className="btn btn-primary" to={`/appointments?hospitalId=${hospital.id}`}>Book</Link>} /> : (
            <div className="table-scroll"><table className="data"><thead><tr><th>ID</th><th>When</th><th>Patient</th><th>Doctor</th><th>Status</th></tr></thead><tbody>{appts.slice(0, 50).map((a) => (
              <tr key={a.id}><td className="num">#{a.id}</td><td>{String(a.appointmentTime || '').replace('T', ' ')}</td><td>{a.patient?.name ?? `#${a.patient?.id ?? ''}`}</td><td>{a.doctor?.name ?? `#${a.doctor?.id ?? ''}`}</td><td><StatusPill status={a.status} /></td></tr>
            ))}</tbody></table></div>
          )}
        </div>
      )}
    </div>
  );
}
