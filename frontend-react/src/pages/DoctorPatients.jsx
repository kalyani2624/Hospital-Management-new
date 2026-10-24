import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doctorPatients, toApiError } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { Avatar, EmptyState, ErrorBanner, SectionHeader, Skeleton } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

export default function DoctorPatients() {
  const { auth, role, pushToast } = useApp();
  const navigate = useNavigate();
  const doctorId = auth?.doctorId;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    setError(null);
    try {
      setRows(await doctorPatients(doctorId));
    } catch (e) {
      const ae = toApiError(e);
      if (ae.status === 403) pushToast('Demo rule: not a Doctor session — pick your identity in Profile.');
      setError(ae);
    } finally {
      setLoading(false);
    }
  }, [doctorId, pushToast]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((p) =>
      [p.name, p.centralId, p.phone, p.gender, String(p.age)]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(s)));
  }, [rows, q]);

  if (role !== 'Doctor') {
    return (
      <div className="card" style={{ maxWidth: 640, textAlign: 'center', padding: 28 }}>
        <p className="eyebrow" style={{ color: 'var(--color-warning)' }}>403 · Doctor module</p>
        <h1>My Patients is a doctor section</h1>
        <hr className="ashoka-v2" aria-hidden="true" />
        <button type="button" className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
      </div>
    );
  }

  if (!doctorId) {
    return (
      <div>
        <SectionHeader title="My Patients" hint={`Signed in as ${role}`} />
        <div className="card" style={{ marginTop: 12 }}>
          <EmptyState art="user" title="No doctor identity chosen" body="Pick your seeded doctor in Profile to see assigned patients." action={<Link className="btn btn-primary" to="/profile">Set doctor identity</Link>} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow" style={{ color: 'var(--color-primary)', margin: 0 }}>Doctor panel · {auth?.doctorName || auth?.name}</p>
          <h1>My Patients</h1>
          <hr className="ashoka-v2" aria-hidden="true" />
          <p className="hint" style={{ margin: 0 }}>Patients you are assigned to (appointments + consultations) — open any centralId for the unified history.</p>
        </div>
      </div>
      <ErrorBanner error={error} onRetry={load} />

      <form className="card" onSubmit={(e) => e.preventDefault()} role="search" aria-label="Filter my patients" style={{ marginTop: 12 }}>
        <div className="toolbar" style={{ margin: 0 }}>
          <div className="grow"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Filter ${rows.length} assigned patients by name, ID, phone…`} aria-label="Filter assigned patients" /></div>
          {q && <button type="button" className="btn btn-ghost" onClick={() => setQ('')}>Clear</button>}
        </div>
      </form>

      <section className="card" style={{ marginTop: 12 }} aria-label="Assigned patients">
        <SectionHeader title={`Assigned patients — ${filtered.length}`} hint="Union of your appointment patients and consultation records." />
        {loading ? <Skeleton height={200} /> : filtered.length === 0 ? (
          <EmptyState art="patient" title={rows.length === 0 ? 'No patients assigned yet' : 'No match for that search'} body={rows.length === 0 ? 'Bookings and consultations for you will add patients here.' : 'Try another name or ID.'} />
        ) : (
          <div className="table-scroll"><table className="data"><thead><tr><th>Patient</th><th>centralId</th><th>Age / Gender</th><th>Phone</th><th>Action</th></tr></thead><tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td><span className="cell-main"><Avatar name={p.name} size="sm" /><span className="cell-name">{p.name}</span></span></td>
                <td><code>{p.centralId}</code></td>
                <td>{p.age ?? '—'} · {p.gender || '—'}</td>
                <td>{p.phone || '—'}</td>
                <td><Link className="btn btn-sm" to={`/patients/${encodeURIComponent(p.centralId)}`}><Icon name="arrowRight" size={13} /> History</Link></td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </section>
    </div>
  );
}