import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { cancelAppointment, getPatientAppointments } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { ConfirmDialog, DataTable, ErrorBanner, StatusPill } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

function fmtDt(t) {
  if (!t) return '—';
  return new Date(t).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'all', label: 'All' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function PatientAppointments() {
  const { patient, pushToast } = useApp();
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('upcoming');
  const [toCancel, setToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  async function load() {
    if (!patient?.id) return;
    setLoading(true);
    setError('');
    try {
      const r = await getPatientAppointments(patient.id);
      setAppts(Array.isArray(r) ? r : []);
    } catch (e) {
      setError(e.message || 'Could not load your appointments.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [patient?.id]);

  const rows = useMemo(() => {
    const now = Date.now();
    if (tab === 'upcoming') return appts.filter((a) => a.status === 'BOOKED' && new Date(a.appointmentTime) > now).sort((a, b) => new Date(a.appointmentTime) - new Date(b.appointmentTime));
    if (tab === 'cancelled') return appts.filter((a) => a.status === 'CANCELLED');
    return appts.slice().reverse();
  }, [appts, tab]);

  const canCancel = (a) => a.status === 'BOOKED' && new Date(a.appointmentTime) > Date.now();

  async function doCancel() {
    if (!toCancel) return;
    setCancelling(true);
    try {
      await cancelAppointment(toCancel.id);
      pushToast(`Appointment #${toCancel.id} cancelled. Slot released.`);
      await load();
    } catch (e) {
      pushToast('Could not cancel — please retry later.');
    } finally {
      setCancelling(false);
      setToCancel(null);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 style={{ fontSize: 'clamp(24px,3vw,32px)', margin: 0 }}>My appointments</h1>
          <p className="hint" style={{ marginTop: 4 }}>Cancel booked visits anytime — free up the slot for others.</p>
        </div>
        <Link className="btn btn-primary" to="/patient/book"><Icon name="calendar" size={16} /> Book new</Link>
      </div>

      <div className="tabs" role="tablist" aria-label="Appointment timeline">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'tab tab-active' : 'tab'} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {error ? <ErrorBanner error={error} /> : null}

      <div className="card" style={{ padding: 18 }}>
        <DataTable
          keyOf={(a) => a.id}
          loading={loading}
          columns={[
            { key: 'id', label: '#', render: (a) => <span className="num">#{a.id}</span> },
            { key: 'appointmentTime', label: 'When', render: (a) => <strong>{fmtDt(a.appointmentTime)}</strong> },
            { key: 'hospital', label: 'Hospital', render: (a) => a.hospital?.name || '—' },
            { key: 'doctor', label: 'Doctor', render: (a) => a.doctor?.name || '—' },
            { key: 'reason', label: 'Reason', render: (a) => a.reason || '—' },
            { key: 'status', label: 'Status', render: (a) => <StatusPill status={a.status} /> },
          ]}
          rows={rows}
          actions={[
            { label: 'Cancel', icon: 'x', onClick: (a) => setToCancel(a), disabled: (a) => !canCancel(a), title: (a) => (canCancel(a) ? 'Cancel this appointment' : 'Only upcoming, booked appointments can be cancelled') },
          ]}
          emptyTitle={tab === 'cancelled' ? 'No cancellations' : tab === 'all' ? 'No appointments yet' : 'No upcoming appointments'}
          emptyBody={tab === 'upcoming' ? 'Book a visit whenever you need to see a doctor.' : 'Your history will appear here.'}
        />
      </div>

      <ConfirmDialog
        open={!!toCancel}
        title={`Cancel appointment #${toCancel?.id}?`}
        body={<span>{toCancel ? `This frees the slot for ${toCancel?.doctor?.name || 'the doctor'} on ${fmtDt(toCancel?.appointmentTime)}. You can book again anytime.` : ''}</span>}
        confirmLabel="Yes, cancel it"
        busy={cancelling}
        onConfirm={doCancel}
        onCancel={() => setToCancel(null)}
      />
    </div>
  );
}