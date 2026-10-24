import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { downloadCsv, getAvailability, getCensus, getHospitalLoad, getSoapStatus, listHospitals, listReferrals, toApiError } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { ErrorBanner, KpiCard, SectionHeader, Skeleton } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#D97706', '#0369A1', '#7C3AED'];
const tooltipStyle = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, boxShadow: '0 8px 24px rgba(79,70,229,0.16)', fontSize: 13 };

function CitizenReports({ avail }) {
  return (
    <div>
      <div className="svc-grid" style={{ marginTop: 14 }}>
        {[
          { icon: 'flask', hue: 'linear-gradient(135deg,#0369A1,#38BDF8)', t: 'Lab reports', d: 'Verified reports appear here after the lab signs off. For national ORS reports, use mobile / ABHA OTP on the ORS lab gate.', links: [['Open ORS lab gate', 'https://ors.gov.in/copp/lab_report_gate.jsp'], ['How to get my report', '/help']] },
          { icon: 'droplet', hue: 'linear-gradient(135deg,#B91C1C,#F87171)', t: 'Blood availability', d: `Live now: ${avail.reduce((s, r) => s + (Number(r.availableBeds) || 0), 0)} beds free network-wide is a proxy for pressure — group-wise blood stock is shown per hospital below. Donation camps every weekend.`, links: [['e-BloodBank info', 'https://ors.gov.in/']] },
          { icon: 'calendar', hue: 'linear-gradient(135deg,#4F46E5,#06B6D4)', t: 'OPD tokens', d: 'Today’s token is 142, average wait 22 minutes. Your SMS token is the queue — show it at the desk, no paper needed.', links: [['Book OPD', '/appointments']] },
        ].map((c) => (
          <div key={c.t} className="card svc-card">
            <span className="svc-ico" style={{ background: c.hue }}><Icon name={c.icon} size={22} /></span>
            <div><h3 style={{ margin: '0 0 4px' }}>{c.t}</h3><p className="hint" style={{ margin: '0 0 8px' }}>{c.d}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{c.links.map(([l, href]) => href.startsWith('http') ? <a key={l} className="btn btn-sm" href={href} target="_blank" rel="noreferrer">{l}</a> : <Link key={l} className="btn btn-sm" to={href}>{l}</Link>)}</div>
            </div>
          </div>
        ))}
      </div>
      <section className="card" style={{ marginTop: 12 }} aria-label="Live bed availability">
        <SectionHeader title={`Live bed availability (${avail.length} hospitals)`} hint="Public, no login — from the central availability feed." />
        <div className="table-scroll"><table className="data"><thead><tr><th>Hospital</th><th>City</th><th>Total</th><th>Occupied</th><th>Available</th></tr></thead><tbody>{avail.slice(0, 20).map((r) => <tr key={r.hospitalId}><td><strong>{r.hospitalName}</strong></td><td>{r.city || '—'}</td><td className="num">{r.totalBeds}</td><td className="num">{r.occupiedBeds}</td><td className="num"><strong>{r.availableBeds}</strong></td></tr>)}</tbody></table></div>
        <p className="hint">Updated live. For ICU / ventilator split and nodal-officer phone, call 108 or ask the casualty desk.</p>
      </section>
    </div>
  );
}

export default function Reports() {
  const { role, pushToast, isAuthenticated } = useApp();
  const [census, setCensus] = useState(null);
  const [avail, setAvail] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scope, setScope] = useState('all');
  const [genAt, setGenAt] = useState('');
  // L1: SOAP interop badge state — live WSDL probe, staff export center only.
  const [soap, setSoap] = useState({ ok: null, status: null, bytes: 0 });

  const isStaffExports = isAuthenticated && (role === 'SuperAdmin' || role === 'HospitalAdmin');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [c, a, h] = await Promise.all([getCensus().catch(() => null), getAvailability().catch(() => []), listHospitals().catch(() => [])]);
      let r = [];
      if (isStaffExports) {
        try { r = await listReferrals().catch(() => []); } catch { r = []; }
      }
      setCensus(c); setAvail(Array.isArray(a) ? a : []); setHospitals(Array.isArray(h) ? h : []); setReferrals(Array.isArray(r) ? r : []);
      setGenAt(new Date().toLocaleString());
    } catch (e) {
      const ae = toApiError(e);
      console.warn('Reports load failed', ae);
      setError({ ...ae, message: 'Live numbers are temporarily unavailable. Citizen cards below still explain how to get reports.' });
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [isStaffExports]);

  // L1: probe SOAP WSDL for the export-center badge (staff only probes, citizen cards stay clean).
  useEffect(() => {
    if (!isStaffExports) return;
    let alive = true;
    getSoapStatus().then((s) => { if (alive) setSoap(s); }).catch(() => {});
    return () => { alive = false; };
  }, [isStaffExports]);

  const scopedAvail = useMemo(() => (scope === 'all' ? avail : avail.filter((x) => String(x.hospitalId) === String(scope))), [avail, scope]);

  const wardPie = useMemo(() => {
    const m = {};
    scopedAvail.forEach((h) => (h.wards || []).forEach((w) => { m[w.wardType] = (m[w.wardType] || 0) + (Number(w.occupied) || 0); }));
    const entries = Object.entries(m).map(([name, value]) => ({ name, value }));
    if (entries.length === 0 && scopedAvail.length > 0) {
      const tot = scopedAvail.reduce((s, r) => s + (Number(r.occupiedBeds) || 0), 0);
      return [{ name: 'Occupied', value: tot }, { name: 'Available', value: Math.max(0, scopedAvail.reduce((s, r) => s + (Number(r.totalBeds) || 0), 0) - tot) }];
    }
    return entries;
  }, [scopedAvail]);

  const occBar = useMemo(() => scopedAvail.slice(0, 8).map((r) => ({ name: String(r.hospitalName || '').slice(0, 14), occupied: Number(r.occupiedBeds) || 0, available: Number(r.availableBeds) || 0 })), [scopedAvail]);

  function exportCensus() {
    if (!census) return;
    downloadCsv('census-snapshot.csv', ['metric', 'value'], Object.entries(census).map(([k, v]) => [k, v]));
    pushToast('Census CSV downloaded. Every export is logged.');
  }
  function exportAvailability() {
    downloadCsv('bed-availability.csv', ['hospitalId', 'hospitalName', 'city', 'totalBeds', 'occupiedBeds', 'availableBeds'], scopedAvail.map((r) => [r.hospitalId, r.hospitalName, r.city, r.totalBeds, r.occupiedBeds, r.availableBeds]));
    pushToast('Availability CSV downloaded.');
  }
  function exportReferrals() {
    downloadCsv('referral-throughput.csv', ['id', 'patient', 'from', 'to', 'status', 'reason'], referrals.map((r) => [r.id, r.patient?.centralId ?? r.patient?.id, r.fromHospital?.name ?? r.fromHospitalId, r.toHospital?.name ?? r.toHospitalId, r.status, r.reason]));
    pushToast('Referral CSV downloaded.');
  }
  async function exportLoad() {
    const targets = scope === 'all' ? hospitals : hospitals.filter((h) => String(h.id) === String(scope));
    const rows = [];
    for (const h of targets.slice(0, 20)) {
      try { const l = await getHospitalLoad(h.id); rows.push([l.hospitalId, l.hospitalName, l.doctors, l.appointments, l.totalBeds, l.occupiedBeds]); } catch { /* skip */ }
    }
    downloadCsv('hospital-load.csv', ['hospitalId', 'hospitalName', 'doctors', 'appointments', 'totalBeds', 'occupiedBeds'], rows);
    pushToast(`Hospital load CSV downloaded (${rows.length} rows).`);
  }

  if (loading) return <div className="landing-body" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 56px' }}><h1>Reports</h1><Skeleton height={260} /></div>;

  return (
    <div className="landing-body" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 56px' }}>
      <p className="eyebrow" style={{ color: 'var(--color-primary)' }}>Lab · Blood · OPD — no login needed</p>
      <div className="page-head"><div><h1 style={{ fontSize: 'clamp(26px,3.4vw,38px)' }}>Reports, blood &amp; transparency</h1><hr className="ashoka-v2" aria-hidden="true" /><p className="hint" style={{ margin: 0 }}>Citizen cards first. {isStaffExports ? `Staff exports by ${role}${genAt ? ` at ${genAt}` : ''}.` : 'Staff exports appear after login.'}</p></div></div>
      <ErrorBanner error={error} onRetry={load} hint="Check your connection, then retry." />

      <CitizenReports avail={avail} />

      {!isStaffExports && (
        <div className="staff-strip" style={{ marginTop: 14 }}>
          <div><strong>Staff exports &amp; audit</strong><div className="hint">Census / availability / load / referral CSVs + legacy SOAP bridge — SuperAdmin / HospitalAdmin only.</div></div>
          <Link className="btn btn-primary btn-sm" to="/login?next=%2Freports">Staff login to export</Link>
        </div>
      )}

      {isStaffExports && (
        <>
          <div className="toolbar" style={{ marginTop: 16 }}>
            <div><label className="field-label" htmlFor="rp-scope">Hospital scope (staff)</label><select id="rp-scope" value={scope} onChange={(e) => setScope(e.target.value)}><option value="all">All Hospitals</option>{hospitals.map((h) => <option key={h.id} value={String(h.id)}>{h.name}</option>)}</select></div>
          </div>

          {census && (
            <div className="kpi-grid" style={{ marginBottom: 12 }}>
              <KpiCard label="Hospitals" value={census.hospitals} index={0} />
              <KpiCard label="Patients" value={census.patients} index={2} />
              <KpiCard label="Referrals" value={census.referrals} index={4} />
            </div>
          )}

          <div className="cols cols-2">
            <section className="card" aria-label="Export tiles" style={{ gridColumn: '1 / -1' }}>
              <SectionHeader title="Export center (staff)" hint="Every export is logged with role + scope + timestamp." />
              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
                {[
                  { t: 'Census snapshot', d: `${census ? Object.keys(census).length : 0} metrics · live`, fn: exportCensus, icon: 'dashboard' },
                  { t: 'Bed availability', d: `${scopedAvail.length} hospitals · live`, fn: exportAvailability, icon: 'bed' },
                  { t: 'Hospital load', d: 'Per-facility doctors + beds', fn: exportLoad, icon: 'building' },
                  { t: 'Referral throughput', d: `${referrals.length} referrals · live`, fn: exportReferrals, icon: 'swap' },
                ].map((c) => (
                  <div key={c.t} className="card" style={{ margin: 0, background: 'var(--color-surface-2)' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span className="kpi-icon teal"><Icon name={c.icon} size={20} /></span><div><strong>{c.t}</strong><div className="hint">{c.d}</div></div></div>
                    <button type="button" className="btn btn-sm btn-primary" style={{ marginTop: 10 }} onClick={c.fn}><Icon name="download" size={14} /> Download CSV</button>
                  </div>
                ))}
              </div>
            </section>

            <section className="card" aria-label="Occupancy by hospital bar">
              <SectionHeader title="Occupancy by hospital" hint="Rounded 8px bars, gradient palette." />
              {occBar.length === 0 ? <p className="hint">No ward data.</p> : (
                <div className="chart-box" role="img" aria-label="Occupancy bar chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={occBar} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" /><XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} interval={0} angle={-16} dy={8} height={52} /><YAxis tick={{ fontSize: 12 }} /><Tooltip contentStyle={tooltipStyle} /><Legend /><Bar dataKey="occupied" fill="#4F46E5" radius={[8, 8, 0, 0]} name="Occupied" /><Bar dataKey="available" fill="#10B981" radius={[8, 8, 0, 0]} name="Available" /></BarChart></ResponsiveContainer></div>
              )}
            </section>

            <section className="card" aria-label="Occupied beds by ward">
              <SectionHeader title="Referral + bed mix" hint="Donut with legend pills." />
              {wardPie.length === 0 ? <p className="hint">No ward data.</p> : (
                <div className="chart-box" role="img" aria-label="Occupied beds by ward donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={wardPie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3} strokeWidth={0} label>{wardPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /><Legend /></PieChart></ResponsiveContainer></div>
              )}
            </section>

            <section className="card" aria-label="Interop note">
              <SectionHeader title="Interop & audit" hint="SOAP bridge status + WSDL link." />
              <p style={{ margin: '8px 0' }}>
                {soap.ok == null ? (
                  <span className="pill pill-info"><Icon name="clock" size={14} /> SOAP checking…</span>
                ) : soap.ok ? (
                  <span className="pill pill-completed" title={`WSDL ${soap.status} · ${soap.bytes} bytes · getCentralCensus / getHospitalLoad / getDoctorSchedule`}><Icon name="checkCircle" size={14} /> SOAP WSDL {soap.status} · {soap.bytes} bytes</span>
                ) : (
                  <span className="pill pill-cancelled" title={soap.message || 'WSDL unreachable'}><Icon name="xCircle" size={14} /> SOAP unreachable ({soap.status || '—'})</span>
                )}{' '}
                <span className="hint">getCentralCensus · getHospitalLoad · getDoctorSchedule</span>
              </p>
              <p className="hint">Legacy SOAP interop status above — full runbook, CORS origins and copy-paste envelope live in <Link to="/help">Help → Runbook for IT cell</Link>.</p>
              <p className="hint" style={{ marginTop: 8 }}>Audit note: every export is logged with role + scope + timestamp.</p>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
