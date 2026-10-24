import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { bookAppointment, cancelAppointment, createPatient, getPatientByCentralId, listAppointments, listDoctors, listHospitals, toApiError } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { Avatar, EmptyState, ErrorBanner, Field, SectionHeader, Skeleton, StatusPill } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

function toLocalInput(d) {
  const p = new Date(d);
  p.setMinutes(p.getMinutes() - p.getTimezoneOffset());
  return p.toISOString().slice(0, 16);
}
function fromLocalInput(s) {
  return new Date(s).toISOString().slice(0, 19);
}

export default function Appointments() {
  const { pushToast, isAuthenticated, role, auth } = useApp();
  const [params] = useSearchParams();
  const [step, setStep] = useState(1);
  const [centralId, setCentralId] = useState(params.get('centralId') || '');
  const [patient, setPatient] = useState(null);
  const [patientMsg, setPatientMsg] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selDoctor, setSelDoctor] = useState(params.get('doctorId') || '');
  const [selHospital, setSelHospital] = useState(params.get('hospitalId') || '');
  const [dept, setDept] = useState(params.get('dept') || params.get('specialization') || '');
  const [selSlot, setSelSlot] = useState('');
  const [when, setWhen] = useState(() => {
    const dParam = params.get('date');
    if (dParam && /^\d{4}-\d{2}-\d{2}$/.test(dParam)) return `${dParam}T10:00`;
    return toLocalInput(new Date(Date.now() + 24 * 3600 * 1000));
  });
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState(null);
  const [recovery, setRecovery] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);

  async function loadLists() {
    setLoading(true);
    setListError(null);
    try {
      const [d, h] = await Promise.all([
        listDoctors({ ...(selHospital ? { hospitalId: selHospital } : {}), ...(dept ? { specialization: dept } : {}) }).catch(() => []),
        listHospitals().catch(() => []),
      ]);
      setDoctors(Array.isArray(d) ? d : []);
      setHospitals(Array.isArray(h) ? h : []);
      if (isAuthenticated) {
        try {
          const a = await listAppointments().catch(() => []);
          setRecent((Array.isArray(a) ? a : []).slice().reverse().slice(0, 20));
        } catch { setRecent([]); }
      } else {
        setRecent([]);
      }
    } catch (e) {
      const ae = toApiError(e);
      console.warn('Appointments lists failed', ae);
      setListError({ ...ae, message: 'Booking search is temporarily unavailable. Please retry — emergency? Call 108.' });
    } finally { setLoading(false); }
  }

  useEffect(() => { loadLists(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [selHospital, dept, isAuthenticated]);
  useEffect(() => {
    const cid = params.get('centralId');
    if (cid) setCentralId(cid);
    const did = params.get('doctorId');
    if (did) { setSelDoctor(did); setStep(2); }
    const hid = params.get('hospitalId');
    if (hid) setSelHospital(hid);
    const dep = params.get('dept') || params.get('specialization');
    if (dep) setDept(dep);
    const dt = params.get('date');
    if (dt && /^\d{4}-\d{2}-\d{2}$/.test(dt)) setWhen(`${dt}T10:00`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doctorObj = useMemo(() => doctors.find((d) => String(d.id) === String(selDoctor)), [doctors, selDoctor]);
  // H1 fix: selSlot is the single source for the picked time — always merged into `when`
  // so the POST payload uses the tapped 09:30, not a stale datetime input.
  const effectiveWhen = useMemo(
    () => (selSlot ? `${when.slice(0, 10)}T${selSlot}` : when),
    [when, selSlot],
  );
  const past = useMemo(() => new Date(effectiveWhen).getTime() < Date.now(), [effectiveWhen]);
  const days = useMemo(() => Array.from({ length: 7 }).map((_, i) => { const d = new Date(Date.now() + i * 86400000); return { label: d.toLocaleDateString('en-IN', { weekday: 'short' }), num: d.getDate(), iso: d.toISOString().slice(0, 10), today: i === 0 }; }), []);

  async function registerNewPatient(phone) {
    const p = await createPatient({
      centralId: `CIT-${phone}`,
      name: `Citizen ${phone.slice(-4)}`,
      age: 0,
      gender: '',
      phone,
      hospitalId: hospitals[0]?.id ?? null,
    });
    setPatient(p);
    return p;
  }

  async function confirmPatient() {
    setPatientMsg(null);
    const id = centralId.trim();
    if (!id) { setPatientMsg('Enter your mobile number or ABHA / central ID first.'); return; }
    try {
      const p = await getPatientByCentralId(id);
      setPatient(p);
      setPatientMsg(`Confirmed — ${p.name}.`);
      setStep(2);
    } catch (e) {
      const ae = toApiError(e);
      if (ae.status === 404 && /^\d{10}$/.test(id)) {
        try {
          const p = await registerNewPatient(id);
          setPatientMsg(`Registered ${p.name} — ${p.centralId}. Continue with hospital + doctor.`);
          setStep(2);
        } catch (e2) {
          setPatientMsg('Could not register this number right now. Please retry.');
        }
      } else {
        setPatientMsg(ae.status === 404 ? `No record for this ID yet — ask the desk to register you, or try another ID.` : 'Could not confirm right now. Please retry.');
      }
    }
  }

  async function ensurePatientForBooking() {
    const id = centralId.trim();
    if (patient && patient.centralId === id) return patient;
    try {
      const p = await getPatientByCentralId(id);
      setPatient(p);
      return p;
    } catch (e) {
      const ae = toApiError(e);
      if (ae.status === 404 && /^\d{10}$/.test(id)) return registerNewPatient(id);
      throw e;
    }
  }

  function nearestSlots(base) {
    const b = new Date(base).getTime();
    return [
      { label: '+30 min', iso: new Date(b + 30 * 60000).toISOString().slice(0, 19) },
      { label: '+1 hour', iso: new Date(b + 3600 * 1000).toISOString().slice(0, 19) },
      { label: '+2 hours', iso: new Date(b + 2 * 3600 * 1000).toISOString().slice(0, 19) },
      { label: 'Next day same time', iso: new Date(b + 24 * 3600 * 1000).toISOString().slice(0, 19) },
    ];
  }

  // H1: tapping a slot merges into `when` immediately so summary + payload agree.
  function pickSlot(t) {
    setSelSlot(t);
    setWhen((prev) => {
      const date = (prev || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
      return `${date}T${t}`;
    });
  }

  const SLOT_TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '17:00', '17:30', '18:00'];

  async function submitBook(retryIso) {
    setBookError(null);
    setRecovery([]);
    const submitWhen = retryIso ? null : effectiveWhen;
    if (!retryIso && new Date(submitWhen).getTime() < Date.now()) { setBookError('That time is in the past — pick a later slot.'); return; }
    if (!selDoctor) { setBookError('Choose a doctor first.'); return; }
    if (!centralId.trim()) { setBookError('Enter your mobile / ABHA ID in Step 1 first.'); setStep(1); return; }
    setBooking(true);
    try {
      const p = await ensurePatientForBooking();
      const doc = doctorObj ?? { id: Number(selDoctor) };
      const hospId = selHospital || doc.hospital?.id || hospitals[0]?.id;
      if (!hospId) throw new Error('Pick a hospital first.');
      const iso = retryIso || fromLocalInput(submitWhen);
      const saved = await bookAppointment({ patientId: p.id, doctorId: Number(selDoctor), hospitalId: Number(hospId), appointmentTime: iso });
      pushToast(`Booked — token ${String(iso).replace('T', ' ').slice(0, 16)}. SMS confirmation soon.`, { actionLabel: 'Cancel booking', onAction: async () => { try { await cancelAppointment(saved.id); pushToast(`Booking cancelled.`); loadLists(); } catch { /* ignore */ } }, ms: 30000 });
      loadLists();
      setStep(1);
    } catch (e) {
      const ae = toApiError(e);
      if (ae.status === 409) {
        const base = retryIso || fromLocalInput(effectiveWhen);
        setRecovery(nearestSlots(base));
        setBookError('That slot just filled — pick a nearest free slot below. No data was lost.');
      } else if (ae.status === 400) { setBookError(`Please check the form — ${ae.message}`); }
      else if (ae.status === 404) { setBookError('We could not find that patient ID. Ask the desk to register you first.'); }
      else { setBookError('Booking failed right now. Please retry — if urgent, call 108.'); }
    } finally { setBooking(false); }
  }

  async function cancel(id) {
    if (!window.confirm(`Cancel appointment #${id}? Free cancellation.`)) return;
    const prev = recent;
    setRecent((r) => r.map((x) => (x.id === id ? { ...x, status: 'CANCELLED' } : x)));
    try {
      await cancelAppointment(id);
      pushToast(`Appointment #${id} cancelled.`, { ms: 8000 });
      loadLists();
    } catch { setRecent(prev); pushToast('Cancel failed. Please retry.'); }
  }

  // Doctors are read-only on the public booking wizard — sending them to their diary
  // keeps the "no booking" rule honest instead of letting them hit a 403.
  if (isAuthenticated && role === 'Doctor') {
    return (
      <div className="landing-body" style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px 56px' }}>
        <div className="card" style={{ textAlign: 'center', padding: 28 }}>
          <p className="eyebrow" style={{ color: 'var(--color-warning)', margin: 0 }}>403 · Doctor module</p>
          <h1>Doctors don’t book here</h1>
          <hr className="ashoka-v2" aria-hidden="true" />
          <p className="hint">You’re signed in as <strong>{auth?.doctorName || role}</strong>. Booking, cancellation and rescheduling are for patients, reception and admin. Your assigned diary lives in My Appointments — open a BOOKED slot there to run the consultation.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 }}>
            <Link className="btn btn-primary btn-lg" to="/doctor/appointments">Open My Appointments</Link>
            <Link className="btn btn-ghost" to="/dashboard">Back to dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-body" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 56px' }}>
      <p className="eyebrow" style={{ color: 'var(--color-primary)' }}>Book OPD · No login to browse</p>
      <div className="page-head"><div><h1 style={{ fontSize: 'clamp(26px,3.4vw,38px)' }}>Book an appointment in 3 steps</h1><hr className="ashoka-v2" aria-hidden="true" /><p className="hint" style={{ margin: 0 }}>Browse hospitals, doctors and slots freely. Confirm with mobile / ABHA — SMS token in ~30 seconds, free cancellation.</p></div></div>
      <ErrorBanner error={listError} onRetry={loadLists} hint="Check your connection, then retry." />

      <div className="cols cols-2">
        <section className="card" aria-label="Booking wizard">
          <div className="steps" aria-label="Booking progress">
            {['Find yourself', 'Hospital + Doctor + Slot', 'Confirm'].map((label, i) => (
              <div key={label} className={`step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`} aria-current={step === i + 1 ? 'step' : undefined}>
                <span className="n"><span className="step-dot">{step > i + 1 ? '✓' : i + 1}</span> Step {i + 1}</span><br />{label}
              </div>
            ))}
          </div>
          <div style={{ height: 4, borderRadius: 4, background: 'var(--color-border-subtle)', overflow: 'hidden', marginBottom: 12 }} aria-hidden="true"><div style={{ width: `${(step / 3) * 100}%`, height: '100%', background: 'var(--gradient-brand)', transition: 'width 320ms var(--ease)' }} /></div>

          {step === 1 && (
            <div>
              <Field label="Mobile / ABHA / central ID" id="bk-cid" required error={null} hint="We verify at confirmation. Emergency? Call 108, do not book OPD.">
                <input id="bk-cid" value={centralId} onChange={(e) => setCentralId(e.target.value)} placeholder="e.g. 98XXXXXX00 or MH-2026-004213" style={{ fontSize: 17, minHeight: 48 }} autoComplete="off" />
              </Field>
              {patientMsg && <div className="alert alert-info" role="status"><Icon name="search" size={18} /> {patientMsg}</div>}
              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-primary" onClick={confirmPatient}><Icon name="check" size={16} /> Verify &amp; continue</button>
                <button type="button" className="btn" disabled={!patient} onClick={() => setStep(2)}>Next <Icon name="arrowRight" size={14} /></button>
              </div>
              <p className="hint">No ABHA yet? <a href="https://healthid.abdm.gov.in/" target="_blank" rel="noreferrer">Create one free</a> — or book with mobile and link later at desk.</p>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="form-grid form-grid-2">
                <Field label="Hospital" id="bk-h" required error={null}><select id="bk-h" value={selHospital} onChange={(e) => setSelHospital(e.target.value)} style={{ minHeight: 48 }}><option value="">— choose —</option>{hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></Field>
                <Field label="Department" id="bk-dept" error={null} hint="Filters doctors below."><select id="bk-dept" value={dept} onChange={(e) => setDept(e.target.value)} style={{ minHeight: 48 }}><option value="">All departments</option>{['General', 'Cardiology', 'Orthopaedic', 'Pediatrics', 'Gynaecology', 'Eye', 'Dental', 'Dermatology', 'ENT', 'Neurology'].map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
              </div>
              <Field label="Doctor" id="bk-d" required error={null}><select id="bk-d" value={selDoctor} onChange={(e) => setSelDoctor(e.target.value)} style={{ minHeight: 48 }}><option value="">— choose —</option>{doctors.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.specialization}</option>)}</select></Field>
              <p className="hint" style={{ fontWeight: 800, margin: '12px 0 6px' }}>PICK A SLOT</p>
              <div className="slot-strip" role="group" aria-label="Slot picker">
                {SLOT_TIMES.map((t) => (
                  <button key={t} type="button" className="slot" aria-pressed={selSlot === t} onClick={() => pickSlot(t)} title={selSlot === t ? `Selected — booking will use ${when.slice(0, 10)} ${t}` : `Pick ${t} — fills booking time`}>{t}</button>
                ))}
              </div>
              <p className="hint" style={{ margin: '6px 0 0' }}>{selSlot ? `Selected ${selSlot} — booking time is ${effectiveWhen.replace('T', ' ')}.` : 'Tap a slot to fill the booking time below.'}</p>
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button type="button" className="btn btn-primary" disabled={!selDoctor} onClick={() => setStep(3)}>Next <Icon name="arrowRight" size={14} /></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div id="today">
              <div className="card" style={{ background: 'var(--color-surface-2)', marginBottom: 12 }}>
                <strong>Summary — check before confirming</strong>
                <p style={{ margin: '6px 0' }}><Avatar name={patient?.name || centralId} size="sm" /> {patient ? `${patient.name}` : centralId || '—'} → <strong>{doctorObj ? `${doctorObj.name} · ${doctorObj.specialization}` : selDoctor ? `Doctor #${selDoctor}` : '—'}</strong></p>
                <p className="hint" style={{ margin: 0 }}>When: {effectiveWhen.replace('T', ' ')}{selSlot ? ` · slot ${selSlot} selected` : ''} · Arrive 15 min early with SMS token + ABHA / Aadhaar / mobile.</p>
              </div>
              <Field label="Date and time (must be future)" id="bk-w" error={past ? 'That time is in the past — pick a later slot.' : null}>
                <input id="bk-w" type="datetime-local" value={when} min={toLocalInput(new Date())} onChange={(e) => { const v = e.target.value; setWhen(v); const tm = v.slice(11, 16); if (tm !== selSlot) setSelSlot(SLOT_TIMES.includes(tm) ? tm : ''); }} style={{ minHeight: 48 }} />
              </Field>
              {bookError && <div className="alert alert-error" role="alert"><Icon name="alert" size={18} /> {bookError}</div>}
              {recovery.length > 0 && (
                <div className="alert alert-warn" role="alert"><Icon name="clock" size={18} /><div><strong>That slot just filled — nearest free:</strong><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {recovery.map((s) => (<button key={s.iso} type="button" className="btn btn-sm btn-cta" disabled={booking} onClick={() => submitBook(s.iso)}>{s.label} · {s.iso.replace('T', ' ').slice(0, 16)}</button>))}
                </div></div></div>
              )}
              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                <button type="button" className="btn btn-saffron btn-lg" disabled={booking || past} onClick={() => submitBook()}>{booking ? (<><span className="spinner" /> Booking…</>) : 'Confirm booking'}</button>
              </div>
              <p className="hint">Free cancellation from the SMS link. By confirming you agree to visit with the token on time.</p>
            </div>
          )}
        </section>

        <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
          <aside className="card" aria-label="Calendar strip">
            <SectionHeader title="This week" hint="Tap a day to prefill the booking time." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
              {days.map((d) => (
                <button key={d.iso} type="button" onClick={() => setWhen(`${d.iso}T${selSlot || when.slice(11, 16) || '10:00'}`)} style={{ borderRadius: 12, border: d.iso === effectiveWhen.slice(0, 10) ? '0' : '1px solid var(--color-border)', background: d.iso === effectiveWhen.slice(0, 10) ? 'var(--gradient-brand)' : 'var(--color-surface)', color: d.iso === effectiveWhen.slice(0, 10) ? '#fff' : 'var(--color-text)', padding: '10px 4px', cursor: 'pointer', fontWeight: 800, minHeight: 64 }} aria-label={`${d.label} ${d.num}${d.today ? ' today' : ''}`} aria-pressed={d.iso === effectiveWhen.slice(0, 10)}>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>{d.label}</div><div style={{ fontSize: 18 }}>{d.num}</div>
                </button>
              ))}
            </div>
          </aside>
          <aside className="card" aria-label="Booking summary">
            <h3>Your selection</h3>
            <p><strong>Patient ID:</strong> {centralId || '—'}</p>
            <p><strong>Doctor:</strong> {doctorObj ? `${doctorObj.name} · ${doctorObj.specialization}` : selDoctor ? `#${selDoctor}` : '—'}</p>
            <p><strong>When:</strong> {effectiveWhen.replace('T', ' ')}</p>
            <p className="hint">Confirmation comes by SMS. Keep the token — show it at the OPD desk.</p>
            <p className="hint">Emergency (chest pain / stroke / bleeding)? <Link to="/emergency">Open emergency</Link> or call <a href="tel:108">108</a>.</p>
          </aside>
        </div>
      </div>

      <section className="card" style={{ marginTop: 12 }} aria-label="Recent appointments">
        {!isAuthenticated ? (
          <EmptyState art="calendar" title="Your bookings live here after verify" body="Browse and book above with just a mobile / ABHA ID. Staff diary (all bookings) needs staff login." action={<button type="button" className="btn btn-primary" onClick={() => setStep(1)}>Start booking</button>} secondary={<Link className="btn btn-ghost" to="/login">Staff login</Link>} />
        ) : (
          <>
            <SectionHeader title="Diary — recent appointments (staff)" hint="Cancel offers Undo. Citizens see only their own via OTP in future." />
            {loading ? <Skeleton height={140} /> : recent.length === 0 ? (
              <EmptyState art="calendar" title="No appointments" body="Book the first slot with the wizard above." />
            ) : (
              <div className="table-scroll"><table className="data"><thead><tr><th>ID</th><th>When</th><th>Patient</th><th>Doctor</th><th>Status</th><th>Action</th></tr></thead><tbody>
                {recent.map((a) => (
                  <tr key={a.id}>
                    <td className="num">#{a.id}</td>
                    <td><span className="pill pill-info">{String(a.appointmentTime || '').replace('T', ' ').slice(0, 16)}</span></td>
                    <td><span className="cell-main"><Avatar name={a.patient?.name || `#${a.patient?.id}`} size="sm" /><span className="cell-name">{a.patient?.name ?? `#${a.patient?.id ?? ''}`}</span></span></td>
                    <td>{a.doctor?.name ?? `#${a.doctor?.id ?? ''}`}</td>
                    <td><StatusPill status={a.status} /></td>
                    <td>{String(a.status).toUpperCase() === 'BOOKED' && <button type="button" className="btn btn-sm" onClick={() => cancel(a.id)}>Cancel</button>}</td>
                  </tr>
                ))}
              </tbody></table></div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
