import { useEffect, useMemo, useState } from 'react';
import { listAppointments, listHospitals, toApiError } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { EmptyState, ErrorBanner, SectionHeader, Skeleton, StatusPill } from '../components/ui.jsx';

function fmt(t) {
  if (!t) return '—';
  return new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AppointmentsOverview() {
  const { effectiveScopeId } = useApp();
  const [rows, setRows] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusF, setStatusF] = useState('');
  const [hospitalF, setHospitalF] = useState(effectiveScopeId ? String(effectiveScopeId) : '');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [a, h] = await Promise.all([listAppointments(0, 50), listHospitals().catch(() => [])]);
      setRows(Array.isArray(a) ? a : []);
      setHospitals(Array.isArray(h) ? h : []);
    } catch (e) {
      setError(toApiError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const hospName = useMemo(() => {
    const m = new Map();
    hospitals.forEach((x) => m.set(String(x.id), x.name));
    return (id) => m.get(String(id)) || (id ? `Hospital #${id}` : '—');
  }, [hospitals]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const hid = String(r.hospital?.id ?? r.hospitalId ?? '');
      if (effectiveScopeId && hid !== String(effectiveScopeId)) return false;
      if (hospitalF && hid !== hospitalF) return false;
      if (statusF && String(r.status).toUpperCase() !== statusF) return false;
      return true;
    });
  }, [rows, hospitalF, statusF, effectiveScopeId]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Appointments Overview</h1>
          <p className="hint" style={{ margin: 0 }}>Read-only schedule for the facility. Booking and rescheduling are handled by Reception.</p>
        </div>
      </div>
      <ErrorBanner error={error} onRetry={load} />

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="toolbar">
          <div>
            <label className="field-label" htmlFor="ao-h">Hospital</label>
            <select id="ao-h" value={hospitalF} disabled={!!effectiveScopeId} onChange={(e) => setHospitalF(e.target.value)}>
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
            <label className="field-label" htmlFor="ao-s">Status</label>
            <select id="ao-s" value={statusF} onChange={(e) => setStatusF(e.target.value)}>
              <option value="">All</option>
              <option value="BOOKED">BOOKED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>
      </div>

      <section className="card">
        <SectionHeader title="Appointments" hint="Most recent 50 returned by the API." />
        {loading ? <Skeleton height={200} /> : filtered.length === 0 ? (
          <EmptyState title="No appointments" body="No appointments match these filters." />
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
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td className="num">#{a.id}</td>
                    <td>{fmt(a.appointmentTime)}</td>
                    <td>{a.patient?.name || (a.patient?.centralId ? `#${a.patient.centralId}` : '—')}</td>
                    <td>{a.doctor?.name || '—'}</td>
                    <td>{a.hospital?.name || hospName(a.hospital?.id ?? a.hospitalId)}</td>
                    <td><StatusPill status={a.status} /></td>
                    <td>{a.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
