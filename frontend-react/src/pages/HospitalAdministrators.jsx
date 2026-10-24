import { useEffect, useState } from 'react';
import { listHospitals, toApiError } from '../api/client.js';
import { EmptyState, ErrorBanner, SectionHeader, Skeleton } from '../components/ui.jsx';

export default function HospitalAdministrators() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    setLoading(true);
    listHospitals()
      .then((r) => { if (live) setRows(Array.isArray(r) ? r : []); })
      .catch((e) => { if (live) setError(toApiError(e)); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Hospital Administrators</h1>
          <p className="hint" style={{ margin: 0 }}>No staff-account table exists in this demo build.</p>
        </div>
      </div>
      <ErrorBanner error={error} onRetry={() => window.location.reload()} />
      <div className="card">
        <SectionHeader
          title="Limitation (honest)"
          hint="Demo identity comes from the login form; there is no hospital_admin user entity or account CRUD in the codebase."
        />
        <p style={{ margin: 0 }}>
          Each hospital uses a shared <strong>Hospital Admin</strong> role in the demo. Assign the hospital
          via <strong>Profile</strong> (set hospital) or by signing in with that role. The API enforces
          hospital scope for mutations when <code>X-Demo-Hospital-Id</code> is sent.
        </p>
      </div>
      <section className="card" style={{ marginTop: 12 }}>
        <SectionHeader title="Hospitals" hint="Scope target for hospital administrators." />
        {loading ? <Skeleton height={160} /> : rows.length === 0 ? (
          <EmptyState title="No hospitals" body="Create hospitals from the network first." />
        ) : (
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>Hospital</th>
                  <th>City</th>
                  <th>Type</th>
                  <th>ID</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((h) => (
                  <tr key={h.id}>
                    <td>{h.name}</td>
                    <td>{h.city || '—'}</td>
                    <td>{h.type || '—'}</td>
                    <td className="num">#{h.id}</td>
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
