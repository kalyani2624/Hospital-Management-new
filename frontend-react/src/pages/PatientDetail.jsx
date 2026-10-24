import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPatientByCentralId, getPatientHistory, toApiError } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { Avatar, EmptyState, ErrorBanner, Skeleton, StatusPill } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

const DOT = { appointment: 'emerald', record: 'blue', referral: 'saffron' };
const ICON = { appointment: 'calendar', record: 'file', referral: 'swap' };

export default function PatientDetail() {
  const { role } = useApp();
  const { centralId } = useParams();
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const p = await getPatientByCentralId(centralId);
      setPatient(p);
      try { const h = await getPatientHistory(p.id); setHistory(h); } catch { setHistory(null); }
    } catch (e) { setError(toApiError(e)); } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [centralId]);

  const timeline = useMemo(() => {
    if (!history) return [];
    const items = [];
    (history.appointments || []).forEach((a) => items.push({ kind: 'appointment', at: a.appointmentTime, title: `Appointment ${a.status} with ${a.doctor?.name ?? `Doctor #${a.doctor?.id ?? ''}`} at ${a.hospital?.name ?? ''}`, sub: a.doctor?.specialization ?? '', raw: a }));
    (history.records || history.medicalRecords || []).forEach((r) => items.push({ kind: 'record', at: r.visitDate, title: `Visit — ${r.diagnosis}`, sub: `${r.prescription ? `Rx: ${r.prescription} · ` : ''}${r.doctor?.name ?? ''} · ${r.hospital?.name ?? ''}`, raw: r }));
    (history.referrals || []).forEach((r) => items.push({ kind: 'referral', at: r.createdAt || r.updatedAt, title: `Referral ${r.status}: ${r.fromHospital?.name ?? ''} → ${r.toHospital?.name ?? ''}`, sub: r.reason ?? '', raw: r }));
    items.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
    return filter === 'all' ? items : items.filter((x) => x.kind === filter || (filter === 'records' && x.kind === 'record'));
  }, [history, filter]);

  async function copyId() {
    try { await navigator.clipboard.writeText(patient.centralId); setCopied(true); setTimeout(() => setCopied(false), 1600); }
    catch { setCopied(false); }
  }

  if (loading) return <div><h1>Patient history</h1><Skeleton height={300} /></div>;
  if (error || !patient) return (
    <div><h1>{centralId}</h1><ErrorBanner error={error || 'Patient not found.'} onRetry={load} hint="Search again or register this citizen." /><Link className="btn" to="/patients">← Back to search</Link></div>
  );

  return (
    <div>
      <Link className="btn btn-sm" to="/patients"><Icon name="chevronLeft" size={14} /> Back to search</Link>
      <div className="card" style={{ marginTop: 10, overflow: 'hidden' }}>
        <div style={{ height: 56, margin: '-18px -18px 0', background: 'var(--gradient-brand)' }} aria-hidden="true" />
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: -26 }}>
          <Avatar name={patient.name} size="xl" />
          <div style={{ flex: 1 }}>
            <h1 style={{ marginBottom: 2 }}>{patient.name} <span className="hint">· {patient.age} · {patient.gender || '—'} · {patient.phone || 'no phone'}</span></h1>
            <p style={{ margin: '4px 0 8px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <code style={{ fontSize: 15 }}>{patient.centralId}</code>
              <button type="button" className="btn btn-sm" onClick={copyId} aria-live="polite"><Icon name="copy" size={14} /> {copied ? 'Copied' : 'Copy'}</button>
              <span className="pill pill-completed"><Icon name="shield" size={12} /> ABHA-linked</span>
              <span className="hint">· Registered at {patient.registeredHospital?.name ?? '—'}</span>
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {role !== 'Doctor' && <Link className="btn btn-sm btn-primary" to={`/appointments?centralId=${encodeURIComponent(patient.centralId)}`}><Icon name="calendar" size={14} /> Book appointment</Link>}
              <Link className="btn btn-sm" to={`/records?centralId=${encodeURIComponent(patient.centralId)}`}>Add record (Doctor)</Link>
              {role !== 'Doctor' && <Link className="btn btn-sm" to={`/referrals?centralId=${encodeURIComponent(patient.centralId)}`}>New referral</Link>}
              {role === 'Doctor' && <span className="hint"><Icon name="alert" size={13} /> Doctors chart, they don’t book or refer from here.</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="filter-pills" style={{ marginTop: 14 }} role="tablist" aria-label="Timeline filter">
        {[['all', 'All'], ['appointment', 'Appointments'], ['records', 'Records'], ['referral', 'Referrals']].map(([k, label]) => (
          <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} className="filter-pill">{label}</button>
        ))}
      </div>

      {timeline.length === 0 ? (
        <div className="card" style={{ marginTop: 12 }}><EmptyState art="patient" title="Fresh record — timeline starts here" body="Appointments, visit notes and referrals will appear as one unified timeline." action={<Link className="btn btn-primary" to={`/appointments?centralId=${encodeURIComponent(patient.centralId)}`}>Book first appointment</Link>} /></div>
      ) : (
        <ol className="timeline" aria-label="Unified patient history" style={{ marginTop: 14 }}>
          {timeline.map((t, i) => (
            <li key={i}>
              <span className={`t-dot ${DOT[t.kind] || ''}`} aria-hidden="true"><Icon name={ICON[t.kind] || 'heart'} size={12} /></span>
              <time dateTime={String(t.at || '')}>{String(t.at || '—').replace('T', ' ').slice(0, 16)}</time>
              <div className="timeline-card"><strong>{t.title}</strong>{t.sub && <div className="hint">{t.sub}</div>}
                <div style={{ marginTop: 6 }}>{t.kind === 'appointment' && <StatusPill status={t.raw.status} />}{t.kind === 'referral' && <StatusPill status={t.raw.status} />}</div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
