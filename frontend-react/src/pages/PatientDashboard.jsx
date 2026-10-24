import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPatientAppointments } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { EmptyState, ErrorBanner, KpiCard, StatusPill, DataTable } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

function fmtDt(t) {
  if (!t) return '—';
  return new Date(t).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function PatientDashboard() {
  const { patient } = useApp();
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!patient?.id) return;
    let live = true;
    setLoading(true);
    getPatientAppointments(patient.id)
      .then((r) => { if (live) setAppts(Array.isArray(r) ? r : []); })
      .catch((e) => { if (live) setError(e.message || 'Could not load your appointments.'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [patient?.id]);

  const upcoming = appts.filter((a) => a.status === 'BOOKED' && new Date(a.appointmentTime) > new Date());
  const previous = appts.filter((a) => !(a.status === 'BOOKED' && new Date(a.appointmentTime) > new Date()));
  const next = upcoming.sort((a, b) => new Date(a.appointmentTime) - new Date(b.appointmentTime))[0];

  return (
    <div>
      <h1 style={{ margin: '0 0 4px' }}>Welcome, {patient?.name?.split(' ')[0] || 'there'}</h1>
      <p className="hint" style={{ marginTop: 0 }}>Here’s what’s coming up at {patient?.registeredHospital?.name || 'your hospital'}.</p>

      <div className="portal-cards" style={{ marginBottom: 18 }}>
        <KpiCard label="Upcoming appointments" value={upcoming.length} icon="calendar" hue="blue" />
        <KpiCard label="Past visits" value={previous.length} icon="file" hue="violet" />
        <KpiCard label="Next visit" value={next ? fmtDt(next.appointmentTime) : 'None yet'} icon="clock" hue="teal" />
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
        <Link className="btn btn-primary" to="/patient/book"><Icon name="calendar" size={16} /> Book an appointment</Link>
        <Link className="btn" to="/patient/appointments"><Icon name="clock" size={16} /> My appointments</Link>
        <Link className="btn btn-ghost" to="/patient/profile"><Icon name="user" size={16} /> Update profile</Link>
      </div>

      {error ? <ErrorBanner error={error} /> : null}

      <div className="card" style={{ padding: 18 }}>
        <h3 style={{ margin: '0 0 12px' }}>Upcoming appointments</h3>
        {loading ? (
          <div className="skeleton" style={{ height: 60 }} />
        ) : upcoming.length ? (
          <DataTable
            keyOf={(a) => a.id}
            columns={[
              { key: 'appointmentTime', label: 'When', render: (a) => <strong>{fmtDt(a.appointmentTime)}</strong> },
              { key: 'hospital', label: 'Hospital', render: (a) => a.hospital?.name || '—' },
              { key: 'doctor', label: 'Doctor', render: (a) => a.doctor?.name || '—' },
              { key: 'status', label: 'Status', render: (a) => <StatusPill status={a.status} /> },
              { key: 'reason', label: 'Reason', render: (a) => a.reason || '—' },
            ]}
            rows={upcoming}
            emptyTitle="You’re all clear"
            emptyBody="No upcoming appointments. Book one now."
          />
        ) : (
          <EmptyState
            title="No upcoming appointments"
            body="You have no booked visits right now. Need to see a doctor? Booking takes under a minute."
            action={<Link className="btn btn-primary" to="/patient/book"><Icon name="calendar" size={16} /> Book an appointment</Link>}
          />
        )}
      </div>
    </div>
  );
}