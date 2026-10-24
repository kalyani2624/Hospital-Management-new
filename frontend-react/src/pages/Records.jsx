import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { createRecord, getPatientByCentralId, listDoctors, listHospitals, listPatients, recordsByDoctor, recordsByPatient, toApiError } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { Avatar, EmptyState, ErrorBanner, Field, SectionHeader, Skeleton } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

const TEMPLATES = ['SOAP: Subjective / Objective / Assessment / Plan', 'Discharge: condition + follow-up + meds', 'Prescription: drug + dose + duration'];

export default function Records() {
  const { pushToast, can, role, auth } = useApp();
  const [params] = useSearchParams();
  const [centralId, setCentralId] = useState(params.get('centralId') || '');
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [myRecords, setMyRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ hospitalId: '', doctorId: '', diagnosis: '', treatmentNotes: '', prescription: '' });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const isDoctor = role === 'Doctor';

  useEffect(() => {
    listHospitals().then((h) => setHospitals(Array.isArray(h) ? h : [])).catch(() => {});
    listDoctors({}).then((d) => setDoctors(Array.isArray(d) ? d : [])).catch(() => {});
    listPatients(0, 20).then((p) => setPatients(Array.isArray(p) ? p : [])).catch(() => {});
  }, []);

  // Doctor: show the notes I authored (all patients) — the Consultation History lens.
  useEffect(() => {
    if (!isDoctor || !auth?.doctorId) { setMyRecords([]); return; }
    recordsByDoctor(auth.doctorId).then((r) => setMyRecords(Array.isArray(r) ? r : [])).catch(() => setMyRecords([]));
    // Default the note form to my own hospital + identity.
    setForm((f) => ({ ...f, doctorId: String(auth.doctorId), hospitalId: f.hospitalId || String(auth.hospitalId || '') }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDoctor, auth?.doctorId]);

  async function lookup(e) {
    e?.preventDefault();
    const id = centralId.trim();
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const p = await getPatientByCentralId(id);
      setPatient(p);
      const r = await recordsByPatient(p.id).catch(() => []);
      setRecords(Array.isArray(r) ? r : []);
      if (p.registeredHospital?.id) setForm((f) => ({ ...f, hospitalId: f.hospitalId || String(p.registeredHospital.id) }));
    } catch (err) {
      const ae = toApiError(err);
      setError(ae.status === 404 ? `No record for "${id}".` : ae.message);
      setPatient(null);
      setRecords([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { if (centralId) lookup(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function submit(e) {
    e.preventDefault();
    setFormError(null);
    if (!can.writeRecords) { setFormError(`${role} cannot write clinical notes — switch to Doctor or SuperAdmin (mock).`); return; }
    if (!patient) { setFormError('Look up a patient first.'); return; }
    if (!form.diagnosis.trim()) { setFormError('Diagnosis is required — add a clinical impression.'); return; }
    if (!form.hospitalId) { setFormError('Hospital is required.'); return; }
    setSaving(true);
    try {
      const saved = await createRecord({ patientId: patient.id, hospitalId: Number(form.hospitalId), doctorId: form.doctorId ? Number(form.doctorId) : null, diagnosis: form.diagnosis.trim(), treatmentNotes: form.treatmentNotes.trim(), prescription: form.prescription.trim() });
      pushToast(`Visit note #${saved.id} saved.`);
      setForm((f) => ({ ...f, diagnosis: '', treatmentNotes: '', prescription: '' }));
      const r = await recordsByPatient(patient.id).catch(() => []);
      setRecords(Array.isArray(r) ? r : []);
      if (isDoctor) recordsByDoctor(auth.doctorId).then((x) => setMyRecords(Array.isArray(x) ? x : [])).catch(() => {});
    } catch (err) { setFormError(toApiError(err).message); } finally { setSaving(false); }
  }

  return (
    <div>
      <div className="page-head"><div><h1>Records — clinical visit notes</h1><hr className="ashoka-v2" aria-hidden="true" /><p className="hint" style={{ margin: 0 }}>Doctor-gated: only Doctor / SuperAdmin can save. Every note carries hospital context for the unified timeline.</p></div></div>
      {!can.writeRecords && (
        <div className="alert alert-warn" role="alert"><Icon name="alert" size={18} /><span>{role} is read-only here. Clinical notes require a Doctor role — use the avatar menu to switch (mock). The list below still works.</span></div>
      )}
      <ErrorBanner error={error} onRetry={lookup} />

      <form className="card" onSubmit={lookup} role="search" aria-label="Find patient for records">
        <div className="toolbar" style={{ margin: 0 }}>
          <div className="grow"><label className="field-label" htmlFor="rc-cid">Patient centralId</label><input id="rc-cid" value={centralId} onChange={(e) => setCentralId(e.target.value)} placeholder="MH-2026-004213" style={{ fontFamily: 'var(--font-mono)' }} /></div>
          <button className="btn btn-primary"><Icon name="search" size={16} /> Load visits</button>
        </div>
      </form>

      <div className="cols cols-2" style={{ marginTop: 12 }}>
        <form className="card" onSubmit={submit} aria-label="New visit note" style={{ position: 'relative', overflow: 'hidden' }}>
          {!can.writeRecords && <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(2px)', background: 'rgba(255,255,255,0.4)', zIndex: 1, display: 'grid', placeItems: 'center' }} aria-hidden="true" />}
          <SectionHeader title={`New visit note ${patient ? `— ${patient.name}` : ''}`} />
          {formError && <div className="alert alert-error" role="alert"><Icon name="alert" size={18} /> {formError}</div>}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {TEMPLATES.map((t) => (<button key={t} type="button" className="chip-btn" onClick={() => setForm((f) => ({ ...f, diagnosis: t }))} disabled={!can.writeRecords} aria-disabled={!can.writeRecords}>{t.split(':')[0]}</button>))}
          </div>
          <div className="form-grid">
            <Field label="Patient" id="rc-p" hint="Look up by centralId first.">
              <select id="rc-p" value={patient?.id ?? ''} disabled={!can.writeRecords} aria-disabled={!can.writeRecords} onChange={async (e) => { const hit = patients.find((x) => String(x.id) === e.target.value); if (hit) { setCentralId(hit.centralId); setPatient(hit); const r = await recordsByPatient(hit.id).catch(() => []); setRecords(Array.isArray(r) ? r : []); } }}>
                <option value="">{patient ? `${patient.name} · ${patient.centralId}` : '— use lookup —'}</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.centralId}</option>)}
              </select>
            </Field>
            <div className="form-grid form-grid-2">
              <Field label="Hospital" id="rc-h" required error={null}><select id="rc-h" value={form.hospitalId} disabled={!can.writeRecords || isDoctor} aria-disabled={!can.writeRecords || isDoctor} onChange={(e) => setForm({ ...form, hospitalId: e.target.value })}><option value="">— choose —</option>{hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></Field>
              {isDoctor ? (
                <Field label="Doctor" id="rc-d" hint="Locked to your session identity (demo)."><input id="rc-d" value={auth?.doctorName || `Doctor #${auth?.doctorId}`} readOnly disabled /></Field>
              ) : (
                <Field label="Doctor" id="rc-d"><select id="rc-d" value={form.doctorId} disabled={!can.writeRecords} aria-disabled={!can.writeRecords} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}><option value="">— optional —</option>{doctors.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.specialization}</option>)}</select></Field>
              )}
            </div>
            <Field label="Diagnosis (required)" id="rc-dx" required error={null} hint="Plain clinical language, e.g. Viral fever."><textarea id="rc-dx" rows={4} value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} disabled={!can.writeRecords} aria-disabled={!can.writeRecords} placeholder="SOAP note…" style={{ minHeight: 96 }} /></Field>
            <Field label="Treatment notes" id="rc-tn" hint="Plan, advice, follow-up."><textarea id="rc-tn" rows={3} value={form.treatmentNotes} onChange={(e) => setForm({ ...form, treatmentNotes: e.target.value })} placeholder="Advice, follow-up, investigations…" disabled={!can.writeRecords} aria-disabled={!can.writeRecords} /></Field>
            <Field label="Prescription" id="rc-rx"><textarea id="rc-rx" rows={2} value={form.prescription} onChange={(e) => setForm({ ...form, prescription: e.target.value })} placeholder="Paracetamol 500mg…" disabled={!can.writeRecords} aria-disabled={!can.writeRecords} /></Field>
          </div>
          <div style={{ marginTop: 10, position: 'relative', zIndex: 2 }}>
            {!can.writeRecords ? <p className="hint"><Icon name="alert" size={14} /> Ask a Doctor to chart — you can still view.</p> : <button className="btn btn-primary btn-lg" disabled={saving}>{saving ? 'Saving…' : (<><Icon name="file" size={16} /> Save visit note</>)}</button>}
          </div>
        </form>

        <section className="card" aria-label="Recent visit notes">
          <SectionHeader title={`Recent notes ${patient ? `— ${patient.name}` : ''}`} />
          {loading ? <Skeleton height={160} /> : !patient ? (
            <EmptyState art="search" title="No patient selected" body="Enter a centralId and load visits." />
          ) : records.length === 0 ? (
            <EmptyState art="record" title="No notes yet" body="Save the first visit note for this citizen." />
          ) : (
            <ol className="timeline">
              {records.slice().reverse().slice(0, 20).map((r) => (
                <li key={r.id}>
                  <span className="t-dot blue" aria-hidden="true"><Icon name="file" size={12} /></span>
                  <time dateTime={String(r.visitDate || '')}>{String(r.visitDate || '').replace('T', ' ').slice(0, 16)}</time>
                  <div className="timeline-card">
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Avatar name={r.doctor?.name || 'Dr'} size="sm" /><strong>{r.diagnosis}</strong> <span className="pill pill-info" style={{ fontSize: 11 }}>{r.doctor ? 'Doctor' : 'Note'}</span></div>
                    {r.treatmentNotes ? <div className="hint" style={{ marginTop: 4 }}>{r.treatmentNotes}</div> : null}
                    <div className="hint" style={{ marginTop: 4 }}>{r.prescription ? `Rx: ${r.prescription} · ` : ''}{r.doctor?.name ?? ''} · {r.hospital?.name ?? ''}</div>
                    <div style={{ marginTop: 6 }}><Link className="btn btn-sm btn-ghost" to={`/patients/${encodeURIComponent(patient.centralId)}`}>View in timeline</Link></div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {isDoctor && (
        <section className="card" style={{ marginTop: 12 }} aria-label="My recent notes">
          <SectionHeader title={`My recent notes — ${myRecords.length}`} hint="Notes you authored across all patients (also under Consultation History)." actions={<Link className="btn btn-sm" to="/doctor/history">Consultation History</Link>} />
          {myRecords.length === 0 ? (
            <EmptyState art="record" title="You have not saved a note yet" body="Load a patient, chart the visit, or run a consultation from My Appointments." />
          ) : (
            <ol className="timeline">
              {myRecords.slice(0, 8).map((r) => (
                <li key={r.id}>
                  <span className="t-dot blue" aria-hidden="true"><Icon name="file" size={12} /></span>
                  <time dateTime={String(r.visitDate || '')}>{String(r.visitDate || '').replace('T', ' ').slice(0, 16)}</time>
                  <div className="timeline-card">
                    <strong>{r.diagnosis}</strong>
                    <div className="hint" style={{ marginTop: 4 }}>{r.patient?.name ?? `Patient #${r.patient?.id ?? ''}`} · <code>{r.patient?.centralId ?? ''}</code> · {r.hospital?.name ?? ''}</div>
                    {r.prescription ? <div className="hint" style={{ marginTop: 4 }}>Rx: {r.prescription}</div> : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}
