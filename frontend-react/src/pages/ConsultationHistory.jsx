import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { recordsByDoctor, toApiError } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { Avatar, EmptyState, ErrorBanner, SectionHeader, Skeleton } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

export default function ConsultationHistory() {
  const { auth, role, pushToast } = useApp();
  const navigate = useNavigate();
  const doctorId = auth?.doctorId;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    setError(null);
    try {
      setRows(await recordsByDoctor(doctorId));
    } catch (e) {
      const ae = toApiError(e);
      if (ae.status === 403) pushToast('Demo rule: not a valid Doctor session — set identity in Profile.');
      setError(ae);
    } finally {
      setLoading(false);
    }
  }, [doctorId, pushToast]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    if (filter === 'withNotes') return rows.filter((r) => r.treatmentNotes || r.prescription);
    if (filter === 'rx') return rows.filter((r) => r.prescription);
    return rows;
  }, [rows, filter]);

  const withPrescription = rows.filter((r) => r.prescription).length;

  if (role !== 'Doctor') {
    return (
      <div className="card" style={{ maxWidth: 640, textAlign: 'center', padding: 28 }}>
        <p className="eyebrow" style={{ color: 'var(--color-warning)' }}>403 · Doctor module</p>
        <h1>Consultation History is a doctor section</h1>
        <hr className="ashoka-v2" aria-hidden="true" />
        <button type="button" className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
      </div>
    );
  }

  if (!doctorId) {
    return (
      <div>
        <SectionHeader title="Consultation History" hint={`Signed in as ${role}`} />
        <div className="card" style={{ marginTop: 12 }}>
          <EmptyState art="record" title="No doctor identity chosen" body="Pick your seeded doctor in Profile to see your consultation notes." action={<Link className="btn btn-primary" to="/profile">Set doctor identity</Link>} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow" style={{ color: 'var(--color-primary)', margin: 0 }}>Doctor panel · {auth?.doctorName || auth?.name}</p>
          <h1>Consultation History</h1>
          <hr className="ashoka-v2" aria-hidden="true" />
          <p className="hint" style={{ margin: 0 }}>All clinical notes you authored ({rows.length}), newest first.</p>
        </div>
      </div>
      <ErrorBanner error={error} onRetry={load} />

      <div className="filter-pills" role="tablist" aria-label="Consultation filters">
        {[['all', `All (${rows.length})`], ['withNotes', `Plans (${rows.filter((r) => r.treatmentNotes || r.prescription).length})`], ['rx', `Prescribed (${withPrescription})`]].map(([k, label]) => (
          <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} className="filter-pill">{label}</button>
        ))}
      </div>

      <section className="card" style={{ marginTop: 12 }} aria-label="My consultations">
        <SectionHeader title="Your notes" hint="Each save from the Consult flow lands here and on the patient's timeline." />
        {loading ? <Skeleton height={220} /> : visible.length === 0 ? (
          <EmptyState art="record" title="No consultations yet" body="Open My Appointments, pick a BOOKED slot and save the consult — it appears here immediately." action={<Link className="btn btn-primary" to="/doctor/appointments">Open My Appointments</Link>} />
        ) : (
          <ol className="timeline" aria-label="Consultation history">
            {visible.map((r) => (
              <li key={r.id}>
                <span className="t-dot blue" aria-hidden="true"><Icon name="file" size={12} /></span>
                <time dateTime={String(r.visitDate || '')}>{String(r.visitDate || '').replace('T', ' ').slice(0, 16)}</time>
                <div className="timeline-card">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Avatar name={r.patient?.name || 'P'} size="sm" />
                    <strong>{r.diagnosis}</strong>
                    {r.prescription && <span className="pill pill-info" style={{ fontSize: 11 }}>Rx</span>}
                  </div>
                  {r.treatmentNotes && <div className="hint" style={{ marginTop: 4 }}>{r.treatmentNotes}</div>}
                  {r.prescription && <div className="hint" style={{ marginTop: 4 }}>Rx: {r.prescription}</div>}
                  <div style={{ marginTop: 6 }} className="hint">
                    {r.patient?.name ?? `Patient #${r.patient?.id ?? ''}`} · <code>{r.patient?.centralId ?? ''}</code> · {r.hospital?.name ?? ''}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <Link className="btn btn-sm btn-ghost" to={`/patients/${encodeURIComponent(r.patient?.centralId || '')}`}>Open timeline</Link>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}