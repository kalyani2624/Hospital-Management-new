import { useEffect, useMemo, useState } from 'react';
import { createDepartment, deleteDepartment, listHospitalDepartments, listHospitals, toApiError } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { EmptyState, ErrorBanner, Field, SectionHeader, Skeleton } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

export default function Departments() {
  const { pushToast, effectiveScopeId, auth } = useApp();
  const [rows, setRows] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [hospitalId, setHospitalId] = useState(effectiveScopeId ? String(effectiveScopeId) : '');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const hid = effectiveScopeId || (hospitalId ? Number(hospitalId) : null);
      const [d, h] = await Promise.all([
        listHospitalDepartments(hid).catch(() => []),
        listHospitals().catch(() => []),
      ]);
      setRows(Array.isArray(d) ? d : []);
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

  const hospName = useMemo(() => {
    const m = new Map();
    hospitals.forEach((x) => m.set(String(x.id), x.name));
    return (id) => m.get(String(id)) || `Hospital #${id}`;
  }, [hospitals]);

  async function submit(e) {
    e.preventDefault();
    const hid = effectiveScopeId || hospitalId;
    if (!name.trim() || !hid) {
      pushToast('Department name and hospital are required.');
      return;
    }
    setSaving(true);
    try {
      await createDepartment({ name: name.trim(), hospitalId: Number(hid) });
      pushToast(`Department "${name.trim()}" added.`);
      setName('');
      load();
    } catch (err) {
      pushToast(toApiError(err).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this department?')) return;
    setBusyId(id);
    try {
      await deleteDepartment(id);
      pushToast('Department deleted.');
      load();
    } catch (err) {
      pushToast(toApiError(err).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Departments</h1>
          <p className="hint" style={{ margin: 0 }}>
            {effectiveScopeId ? `Managing departments for ${auth?.hospitalName || 'your hospital'}.` : 'Network departments.'}
          </p>
        </div>
      </div>
      <ErrorBanner error={error} onRetry={load} />

      <form className="card" onSubmit={submit} style={{ marginBottom: 12 }}>
        <SectionHeader title="Add department" hint="Departments belong to exactly one hospital." />
        <div className="form-grid form-grid-3">
          <Field label="Department name" id="dept-name" required>
            <input id="dept-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Oncology" />
          </Field>
          <Field label="Hospital" id="dept-hosp" hint={effectiveScopeId ? 'Locked to your facility.' : undefined} required>
            <select
              id="dept-hosp"
              value={effectiveScopeId ? String(effectiveScopeId) : hospitalId}
              disabled={!!effectiveScopeId}
              onChange={(e) => setHospitalId(e.target.value)}
            >
              <option value="">— choose —</option>
              {hospitals
                .filter((h) => !effectiveScopeId || String(h.id) === String(effectiveScopeId))
                .map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
            </select>
          </Field>
        </div>
        <div style={{ marginTop: 10 }}>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Adding…' : (<><Icon name="plus" size={16} /> Add department</>)}
          </button>
        </div>
      </form>

      <section className="card">
        <SectionHeader title="Department list" />
        {loading ? <Skeleton height={160} /> : rows.length === 0 ? (
          <EmptyState title="No departments" body="Add the first department for this hospital." />
        ) : (
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Hospital</th>
                  <th>ID</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td>{d.hospitalName || hospName(d.hospitalId)}</td>
                    <td className="num">#{d.id}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        disabled={busyId === d.id}
                        onClick={() => remove(d.id)}
                      >
                        Delete
                      </button>
                    </td>
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
