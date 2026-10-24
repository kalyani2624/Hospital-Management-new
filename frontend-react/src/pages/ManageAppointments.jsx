import { useEffect, useMemo, useState } from 'react';
import { cancelAppointment, listAppointments, listDoctors, listHospitals, rescheduleAppointment, toApiError } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { EmptyState, ErrorBanner, Field, SectionHeader, Skeleton, StatusPill } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

function toInput(d) {
  const p = new Date(d);
  p.setMinutes(p.getMinutes() - p.getTimezoneOffset());
  return p.toISOString().slice(0, 16);
}

function fmt(t) {
  if (!t) return '—';
  return new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function ManageAppointments() {
  const { pushToast, effectiveScopeId } = useApp();
  const [rows, setRows] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusF, setStatusF] = useState('BOOKED');
  const [hospitalF, setHospitalF] = useState(effectiveScopeId ? String(effectiveScopeId) : '');
  const [doctorF, setDoctorF] = useState('');
  const [resched, setResched] = useState({ open: false, id: null, time: '' });
  const [busy, setBusy] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [a, d, h] = await Promise.all([
        listAppointments(0, 80),
        listDoctors({ hospitalId: effectiveScopeId || undefined }).catch(() => []),
        listHospitals().catch(() => []),
      ]);
      setRows(Array.isArray(a) ? a : []);
      setDoctors(Array.isArray(d) ? d : []);
      setHospitals(Array.isArray(h) ? h : []);
    } catch (e) {
      setError(toApiError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveScopeId]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const hid = String(r.hospital?.id ?? r.hospitalId ?? '');
      if (effectiveScopeId && hid !== String(effectiveScopeId)) return false;
      if (hospitalF && hid !== hospitalF) return false;
      if (doctorF && String(r.doctor?.id) !== doctorF) return false;
      if (statusF && String(r.status).toUpperCase() !== statusF) return false;
      return true;
    });
  }, [rows, hospitalF, doctorF, statusF, effectiveScopeId]);

  async function doCancel(id) {
    if (!window.confirm('Cancel this appointment?')) return;
    setBusy(`c:${id}`);
    try {
      await cancelAppointment(id);
      pushToast(`Appointment #${id} cancelled.`);
      load();
    } catch (e) {
      pushToast(toApiError(e).message);
    } finally {
      setBusy('');
    }
  }

  function openResched(a) {
    const base = a.appointmentTime ? new Date(a.appointmentTime) : new Date(Date.now() + 3600 * 1000);
    base.setMinutes(Math.ceil(base.getMinutes() / 30) * 30, 0, 0);
    setResched({ open: true, id: a.id, time: toInput(base) });
  }

  async function doResched(e) {
    e.preventDefault();
    if (!resched.id || !resched.time) return;
    setBusy(`r:${resched.id}`);
    try {
      const iso = new Date(resched.time).toISOString().slice(0, 19);
      await rescheduleAppointment(resched.id, iso);
      pushToast(`Appointment #${resched.id} rescheduled.`);
      setResched({ open: false, id: null, time: '' });
      load();
    } catch (err) {
      pushToast(toApiError(err).message);
    } finally {
      setBusy('');
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Manage Appointments</h1>
          <p className="hint" style={{ margin: 0 }}>Cancel or reschedule BOOKED appointments. Completed/cancelled rows are read-only.</p>
        </div>
      </div>
      <ErrorBanner error={error} onRetry={load} />

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="toolbar">
          <div>
            <label className="field-label" htmlFor="ma-h">Hospital</label>
            <select id="ma-h" value={hospitalF} disabled={!!effectiveScopeId} onChange={(e) => setHospitalF(e.target.value)}>
              <option value="">{effectiveScopeId ? 'My hospital' : 'All'}</option>
              {hospitals
                .filter((h) => !effectiveScopeId || String(h.id) === String(effectiveScopeId))
                .map((h) => (
                  <option key={h.id} value={String(h.id)}>
                    {h.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="ma-d">Doctor</label>
            <select id="ma-d" value={doctorF} onChange={(e) => setDoctorF(e.target.value)}>
              <option value="">All</option>
              {doctors.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="ma-s">Status</label>
            <select id="ma-s" value={statusF} onChange={(e) => setStatusF(e.target.value)}>
              <option value="BOOKED">BOOKED</option>
              <option value="">All</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>
      </div>

      <section className="card">
        <SectionHeader title="Appointments" hint="Newest first (API order). Only BOOKED rows can be cancelled/rescheduled." />
        {loading ? <Skeleton height={220} /> : filtered.length === 0 ? (
          <EmptyState title="No appointments" body="No appointments match the current filters." />
        ) : (
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>When</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Hospital</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const booked = String(a.status).toUpperCase() === 'BOOKED';
                  return (
                    <tr key={a.id}>
                      <td className="num">#{a.id}</td>
                      <td>{fmt(a.appointmentTime)}</td>
                      <td>{a.patient?.name || '—'}</td>
                      <td>{a.doctor?.name || '—'}</td>
                      <td>{a.hospital?.name || '—'}</td>
                      <td><StatusPill status={a.status} /></td>
                      <td>{a.reason || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button type="button" className="btn btn-sm" disabled={!booked || busy === `r:${a.id}`} onClick={() => openResched(a)}>
                            Reschedule
                          </button>
                          <button type="button" className="btn btn-sm btn-ghost" disabled={!booked || busy === `c:${a.id}`} onClick={() => doCancel(a.id)}>
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {resched.open && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Reschedule appointment">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Reschedule appointment #{resched.id}</h3>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setResched({ open: false, id: null, time: '' })}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <form onSubmit={doResched} style={{ marginTop: 10 }}>
              <Field label="New date and time" id="rs-time" required>
                <input id="rs-time" type="datetime-local" value={resched.time} onChange={(e) => setResched((s) => ({ ...s, time: e.target.value }))} required />
              </Field>
              <p className="hint">Slot must be in the future. Duplicates are rejected with 409.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn btn-primary" disabled={busy === `r:${resched.id}`}>
                  {busy === `r:${resched.id}` ? 'Saving…' : 'Save new time'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setResched({ open: false, id: null, time: '' })}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
