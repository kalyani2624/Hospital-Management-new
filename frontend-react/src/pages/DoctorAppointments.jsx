import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  completeAppointment, createRecord, listAppointmentsForDoctor, recordsByPatient, toApiError,
} from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { Avatar, EmptyState, ErrorBanner, Field, Modal, SectionHeader, Skeleton, StatusPill } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

const FILTERS = [
  ['all', 'All'],
  ['today', 'Today'],
  ['upcoming', 'Upcoming'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
];

export default function DoctorAppointments() {
  const { auth, role, pushToast } = useApp();
  const navigate = useNavigate();
  const doctorId = auth?.doctorId;
  const [filter, setFilter] = useState('all');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [consulting, setConsulting] = useState(null); // appointment being consulted
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [form, setForm] = useState({ diagnosis: '', treatmentNotes: '', prescription: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const load = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    setError(null);
    try {
      setRows(await listAppointmentsForDoctor(doctorId, filter));
    } catch (e) {
      setError(toApiError(e));
    } finally {
      setLoading(false);
    }
  }, [doctorId, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const openConsult = async (a) => {
    setConsulting(a);
    setForm({ diagnosis: '', treatmentNotes: '', prescription: '' });
    setFormError(null);
    setHistoryLoading(true);
    setHistory([]);
    try {
      const r = await recordsByPatient(a.patient?.id);
      setHistory(Array.isArray(r) ? r : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  async function saveConsultation(e) {
    e.preventDefault();
    if (!consulting) return;
    setFormError(null);
    if (!form.diagnosis.trim()) { setFormError('Diagnosis is required — add a clinical impression.'); return; }
    setSaving(true);
    try {
      await createRecord({
        patientId: consulting.patient?.id,
        hospitalId: consulting.hospital?.id,
        doctorId: Number(doctorId),
        diagnosis: form.diagnosis.trim(),
        treatmentNotes: form.treatmentNotes.trim(),
        prescription: form.prescription.trim(),
      });
      await completeAppointment(consulting.id, Number(doctorId));
      pushToast(`Consultation #${consulting.id} saved — appointment marked COMPLETED.`);
      setConsulting(null);
      load();
    } catch (err) {
      const ae = toApiError(err);
      if (ae.status === 403) {
        setFormError('Demo rule: the backend refused this note — your Doctor session identity may be missing. Set it in Profile.');
      } else {
        setFormError(ae.message);
      }
    } finally {
      setSaving(false);
    }
  }

  if (role !== 'Doctor') {
    return (
      <div className="card" style={{ maxWidth: 640, textAlign: 'center', padding: 28 }}>
        <p className="eyebrow" style={{ color: 'var(--color-warning)' }}>403 · Doctor module</p>
        <h1>Staff diary is not your module</h1>
        <hr className="ashoka-v2" aria-hidden="true" />
        <p className="hint">Doctors see only their assigned appointments here. Reception and admins use the staff diary.</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
      </div>
    );
  }

  if (!doctorId) {
    return (
      <div>
        <SectionHeader title="My Appointments" hint={`Signed in as ${role}`} />
        <div className="card" style={{ marginTop: 12 }}>
          <EmptyState
            art="patient"
            title="No doctor identity chosen"
            body="The Doctor module locks to one seeded doctor. Pick yours in Profile (or sign out and sign back in as a Doctor)."
            action={<Link className="btn btn-primary" to="/profile">Set doctor identity in Profile</Link>}
          />
        </div>
      </div>
    );
  }

  const myName = auth?.doctorName || auth?.name || `Doctor #${doctorId}`;

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow" style={{ color: 'var(--color-primary)', margin: 0 }}>Doctor diary · {myName}</p>
          <h1>My Appointments</h1>
          <hr className="ashoka-v2" aria-hidden="true" />
          <p className="hint" style={{ margin: 0 }}>
            Only appointments assigned to you. Patient-portal and reception bookings appear here automatically.
            <span className="pill pill-info" style={{ marginLeft: 8, fontSize: 11 }}>
              <Icon name="shield" size={12} /> demo-scoped to Dr #{doctorId} {auth?.specialization ? `· ${auth.specialization}` : ''}
            </span>
          </p>
        </div>
        <div className="page-actions"><Link className="btn" to="/doctor/patients"><Icon name="users" size={16} /> My patients</Link></div>
      </div>
      <ErrorBanner error={error} onRetry={load} hint="Backend on :8086 must run the updated build for doctor endpoints." />

      <div className="filter-pills" role="tablist" aria-label="Appointment filters">
        {FILTERS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} className="filter-pill">{label}</button>
        ))}
      </div>

      <section className="card" style={{ marginTop: 12 }} aria-label="Assigned appointments">
        <SectionHeader title={`${FILTERS.find(([k]) => k === filter)?.[1]} — assigned`} hint="Bookings from the patient portal and receptionist ride into this list live." />
        {loading ? <Skeleton height={220} /> : rows.length === 0 ? (
          <EmptyState art="calendar" title={`No ${filter === 'all' ? '' : filter + ' '}appointments assigned`} body={filter === 'completed' ? 'Complete a consult to see it here.' : 'New bookings for you appear as soon as anyone books a slot.'} />
        ) : (
          <div className="table-scroll"><table className="data"><thead><tr>
            <th>When</th><th>Patient</th><th>Hospital</th><th>Department</th><th>Reason</th><th>Status</th><th>Action</th>
          </tr></thead><tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td><span className="pill pill-info">{String(a.appointmentTime || '').replace('T', ' ').slice(0, 16)}</span></td>
                <td><span className="cell-main"><Avatar name={a.patient?.name || `#${a.patient?.id}`} size="sm" /><span><span className="cell-name">{a.patient?.name ?? `#${a.patient?.id ?? ''}`}</span><br /><small className="cell-sub">{a.patient?.centralId ?? ''}{a.patient?.age ? ` · ${a.patient.age}y` : ''}</small></span></span></td>
                <td>{a.hospital?.name ?? `#${a.hospital?.id ?? ''}`}</td>
                <td>{a.doctor?.specialization ?? '—'}</td>
                <td className="hint">{a.reason || '—'}</td>
                <td><StatusPill status={a.status} /></td>
                <td>
                  {String(a.status).toUpperCase() === 'BOOKED' ? (
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => openConsult(a)}><Icon name="file" size={14} /> Consult</button>
                  ) : String(a.status).toUpperCase() === 'COMPLETED' ? (
                    <Link className="btn btn-sm btn-ghost" to={`/patients/${encodeURIComponent(a.patient?.centralId || '')}`}>View notes</Link>
                  ) : (<span className="hint">—</span>)}
                </td>
              </tr>
            ))}
          </tbody></table></div>
        )}
        <p className="hint" style={{ marginTop: 10, marginBottom: 0 }}>
          <Icon name="alert" size={14} /> Doctors cannot book, cancel or reschedule — those actions live with reception/admin (demo-enforced on the backend).
        </p>
      </section>

      <Modal
        open={!!consulting}
        onClose={() => !saving && setConsulting(null)}
        title={`Consultation — ${consulting?.patient?.name || 'patient'}`}
        width={760}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" disabled={saving} onClick={() => setConsulting(null)}>Close</button>
            <button type="button" className="btn btn-primary" disabled={saving} form="consult-form"><Icon name="checkCircle" size={16} /> {saving ? 'Saving…' : 'Save consult + complete appointment'}</button>
          </div>
        }
      >
        {consulting && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="card" style={{ margin: 0, background: 'var(--color-surface-2)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <Avatar name={consulting.patient?.name || 'P'} size="md" />
                <div style={{ flex: 1, minWidth: 220 }}>
                  <strong>{consulting.patient?.name}</strong> <span className="hint">· {consulting.patient?.age ?? '—'}y · {consulting.patient?.gender || '—'}</span>
                  <div className="hint" style={{ marginTop: 2 }}>
                    <code>{consulting.patient?.centralId ?? '—'}</code> · {consulting.patient?.phone || 'no phone'} · seen at {consulting.hospital?.name ?? '—'} · {String(consulting.appointmentTime || '').replace('T', ' ').slice(0, 16)}
                  </div>
                  {consulting.reason && <div className="hint" style={{ marginTop: 2 }}>Reason: {consulting.reason}</div>}
                </div>
              </div>
            </div>

            <div>
              <SectionHeader title="Medical history" hint="Prior visit notes for this patient." />
              {historyLoading ? <Skeleton height={80} /> : history.length === 0 ? (
                <p className="hint">No prior notes on file.</p>
              ) : (
                <ol className="timeline">
                  {history.map((r) => (
                    <li key={r.id}>
                      <span className="t-dot blue" aria-hidden="true"><Icon name="file" size={12} /></span>
                      <time dateTime={String(r.visitDate || '')}>{String(r.visitDate || '').replace('T', ' ').slice(0, 16)}</time>
                      <div className="timeline-card">
                        <strong>{r.diagnosis}</strong>
                        {r.treatmentNotes ? <div className="hint" style={{ marginTop: 2 }}>{r.treatmentNotes}</div> : null}
                        {r.prescription ? <div className="hint" style={{ marginTop: 2 }}>Rx: {r.prescription}</div> : null}
                        <div className="hint">{r.doctor?.name ?? ''} · {r.hospital?.name ?? ''}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <form id="consult-form" onSubmit={saveConsultation} aria-label="New consultation note" style={{ display: 'grid', gap: 10 }}>
              {formError && <div className="alert alert-error" role="alert"><Icon name="alert" size={18} /> {formError}</div>}
              <Field label="Diagnosis (required)" id="cx-dx" required error={null} hint="Clinical impression in plain language.">
                <textarea id="cx-dx" rows={2} value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} required placeholder="e.g. Acute viral pharyngitis" style={{ minHeight: 64 }} />
              </Field>
              <Field label="Treatment notes" id="cx-tn" hint="Plan, advice, follow-up.">
                <textarea id="cx-tn" rows={3} value={form.treatmentNotes} onChange={(e) => setForm({ ...form, treatmentNotes: e.target.value })} placeholder="Advice, lifestyle, follow-up…" />
              </Field>
              <Field label="Prescription" id="cx-rx">
                <textarea id="cx-rx" rows={2} value={form.prescription} onChange={(e) => setForm({ ...form, prescription: e.target.value })} placeholder="Paracetamol 500mg TDS x3 days…" />
              </Field>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}