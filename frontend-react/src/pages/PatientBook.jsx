import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookAppointment, cancelAppointment, listAppointments, listDoctors, listHospitals, toApiError } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { EmptyState, ErrorBanner, Field, Skeleton } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

const SLOT_TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '17:00', '17:30', '18:00'];
const DEPTS = ['General', 'Cardiology', 'Orthopaedic', 'Pediatrics', 'Gynaecology', 'Eye', 'Dental', 'Dermatology', 'ENT', 'Neurology'];

function buildDays() {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(Date.now() + i * 86400000);
    return { label: d.toLocaleDateString('en-IN', { weekday: 'short' }), num: d.getDate(), iso: d.toISOString().slice(0, 10), today: i === 0 };
  });
}

export default function PatientBook() {
  const { patient, isPatient, pushToast } = useApp();
  const [step, setStep] = useState(1);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selHospital, setSelHospital] = useState(patient?.registeredHospital?.id ?? '');
  const [dept, setDept] = useState('');
  const [selDoctor, setSelDoctor] = useState('');
  const [day, setDay] = useState(() => buildDays()[1].iso);
  const [selSlot, setSelSlot] = useState('');
  const [reason, setReason] = useState('');
  const [allTodays, setAllTodays] = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [listError, setListError] = useState(null);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState(null);
  const [recovery, setRecovery] = useState([]);

  const days = useMemo(buildDays, []);

  useEffect(() => {
    if (!isPatient) return;
    let live = true;
    setLoadingLists(true);
    setListError(null);
    Promise.all([listHospitals(), listDoctors(), listAppointments().catch(() => [])])
      .then(([hs, ds, appts]) => { if (!live) return; setHospitals(Array.isArray(hs) ? hs : []); setDoctors(Array.isArray(ds) ? ds : []); setAllTodays(Array.isArray(appts) ? appts.filter((a) => a.patient?.id && a.status === 'BOOKED') : []); })
      .catch((err) => { if (live) setListError(toApiError(err).message); })
      .finally(() => { if (live) setLoadingLists(false); });
    return () => { live = false; };
  }, [isPatient]);

  const doctorObj = useMemo(() => doctors.find((d) => String(d.id) === String(selDoctor)), [doctors, selDoctor]);
  const taken = useMemo(() => {
    if (!selDoctor || !day) return new Set();
    const dayIso = (t) => String(t || '').slice(0, 10);
    const tm = (t) => String(t || '').slice(11, 16);
    return new Set(allTodays.filter((a) => String(a.doctor?.id) === String(selDoctor) && dayIso(a.appointmentTime) === day).map((a) => tm(a.appointmentTime)));
  }, [allTodays, selDoctor, day]);
  const availableSlots = SLOT_TIMES.filter((t) => !taken.has(t) && new Date(`${day}T${t}`).getTime() > Date.now());

  function pickDay(d) { setDay(d.iso); setSelSlot(''); setBookError(null); setRecovery([]); }

  function pickSlot(t) {
    setSelSlot(t);
    setBookError(null);
    setRecovery([]);
  }

  async function submitBook(retryIso) {
    setBookError(null);
    setRecovery([]);
    if (!selDoctor) { setBookError('Choose a doctor first.'); return; }
    if (!selSlot && !retryIso) { setBookError('Pick a time slot.'); return; }
    const when = retryIso || `${day}T${selSlot}:00`;
    if (new Date(when).getTime() < Date.now()) { setBookError('That time is in the past — pick a later slot.'); return; }
    setBooking(true);
    try {
      const hospId = selHospital || doctorObj?.hospital?.id || hospitals[0]?.id;
      if (!hospId) throw new Error('Pick a hospital first.');
      const saved = await bookAppointment({ patientId: patient?.id, doctorId: Number(selDoctor), hospitalId: Number(hospId), appointmentTime: when, reason: reason.trim() || undefined });
      pushToast(
        `Booked — appointment #${saved.id} at ${String(when).replace('T', ' ').slice(0, 16)}. Keep the token.`,
        { actionLabel: 'Cancel', onAction: async () => { try { await cancelAppointment(saved.id); pushToast('Appointment cancelled.'); } catch { /* ignore */ } }, ms: 30000 },
      );
      setReason('');
      setSelDoctor('');
      setSelSlot('');
      setStep(1);
    } catch (e) {
      const ae = toApiError(e);
      if (ae.status === 409) {
        const base = new Date(retryIso || `${day}T${selSlot}:00`);
        setRecovery([
          { label: '+30 min', iso: new Date(base.getTime() + 30 * 60000).toISOString().slice(0, 16) },
          { label: '+1 hour', iso: new Date(base.getTime() + 3600 * 1000).toISOString().slice(0, 16) },
          { label: '+2 hours', iso: new Date(base.getTime() + 2 * 3600 * 1000).toISOString().slice(0, 16) },
          { label: 'Tomorrow, same time', iso: new Date(base.getTime() + 24 * 3600 * 1000).toISOString().slice(0, 16) },
        ]);
        setBookError('That slot just filled — pick a nearest free slot below. No data was lost.');
      } else if (ae.status === 400) setBookError(`Please check the form — ${ae.message}`);
      else if (ae.status === 404) setBookError('We could not find your patient record. Contact the hospital desk.');
      else setBookError('Booking failed right now. Please retry — if urgent, call 108.');
    } finally {
      setBooking(false);
    }
  }

  if (!isPatient) return null;
  const confirmed = patient && patient.id;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 style={{ fontSize: 'clamp(24px,3vw,32px)', margin: 0 }}>Book an appointment</h1>
          <p className="hint" style={{ marginTop: 4 }}>Booking for <strong>{patient?.name}</strong> ({patient?.centralId}). Once confirmed you can manage it from <Link to="/patient/appointments">My Appointments</Link>.</p>
        </div>
      </div>

      <ErrorBanner error={listError} />

      <section className="card">
        <div className="steps" aria-label="Booking progress">
          {['Hospital + Doctor', 'Date + Slot', 'Confirm'].map((label, i) => (
            <div key={label} className={`step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`} aria-current={step === i + 1 ? 'step' : undefined}>
              <span className="n"><span className="step-dot">{step > i + 1 ? '✓' : i + 1}</span> Step {i + 1}</span><br />{label}
            </div>
          ))}
        </div>
        <div style={{ height: 4, borderRadius: 4, background: 'var(--color-border-subtle)', overflow: 'hidden', marginBottom: 12 }} aria-hidden="true">
          <div style={{ width: `${(step / 3) * 100}%`, height: '100%', background: 'var(--gradient-brand)', transition: 'width 320ms var(--ease)' }} />
        </div>

        {loadingLists ? (
          <Skeleton height={220} />
        ) : step === 1 ? (
          <div>
            <div className="form-grid form-grid-2">
              <Field label="Hospital" id="pb-h" required hint="Where do you want to be seen?">
                <select id="pb-h" value={String(selHospital)} onChange={(e) => { setSelHospital(e.target.value); setSelDoctor(''); setSelSlot(''); }} style={{ minHeight: 48 }}>
                  <option value="">— choose hospital —</option>
                  {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name} · {h.city}</option>)}
                </select>
              </Field>
              <Field label="Department" id="pb-dept" hint="Filters doctors below.">
                <select id="pb-dept" value={dept} onChange={(e) => setDept(e.target.value)} style={{ minHeight: 48 }}>
                  <option value="">All departments</option>
                  {DEPTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Doctor" id="pb-d" required hint="Slots shown reflect real booked appointments where available.">
              <select id="pb-d" value={selDoctor} onChange={(e) => setSelDoctor(e.target.value)} style={{ minHeight: 48 }}>
                <option value="">— choose doctor —</option>
                {doctors.filter((d) => !selHospital || String(d.hospital?.id) === String(selHospital)).filter((d) => !dept || d.specialization === dept).map((d) => <option key={d.id} value={d.id}>{d.name} · {d.specialization}</option>)}
              </select>
            </Field>
            {!confirmed && <div className="alert alert-warn" role="alert"><Icon name="alert" size={18} /> Complete <Link to="/patient/profile">your profile</Link> first so we can attach visits to your record.</div>}
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-primary" disabled={!selDoctor} onClick={() => setStep(2)}>Next <Icon name="arrowRight" size={14} /></button>
              <Link className="btn btn-ghost" to="/patient">Back to dashboard</Link>
            </div>
          </div>
        ) : step === 2 ? (
          <div>
            <p style={{ fontWeight: 800, margin: '0 0 8px' }}>Pick a day</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 14 }}>
              {days.map((d) => (
                <button key={d.iso} type="button" onClick={() => pickDay(d)} style={{ borderRadius: 12, border: d.iso === day ? '0' : '1px solid var(--color-border)', background: d.iso === day ? 'var(--gradient-brand)' : 'var(--color-surface)', color: d.iso === day ? '#fff' : 'var(--color-text)', padding: '10px 4px', cursor: 'pointer', fontWeight: 800, minHeight: 60 }} aria-pressed={d.iso === day} aria-label={`${d.label} ${d.num}${d.today ? ' (today)' : ''}`}>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>{d.label}</div><div style={{ fontSize: 18 }}>{d.num}</div>
                </button>
              ))}
            </div>
            <p style={{ fontWeight: 800, margin: '0 0 8px' }}>Pick a slot <span className="hint" style={{ fontWeight: 400 }}>(greyed = already booked)</span></p>
            <div className="slot-strip" role="group" aria-label="Slot picker">
              {SLOT_TIMES.map((t) => {
                const isTaken = !availableSlots.includes(t); 
                return (
                  <button key={t} type="button" className="slot" disabled={isTaken} aria-disabled={isTaken} aria-pressed={selSlot === t} onClick={() => pickSlot(t)} title={isTaken ? 'Already booked for this doctor' : `Pick ${t}`}>
                    {t}{isTaken ? ' ✓' : ''}
                  </button>
                );
              })}
            </div>
            {availableSlots.length === 0 && <div className="alert alert-warn" role="alert"><Icon name="clock" size={18} /> No free slots shown — try another day or department.</div>}
            <Field label="Reason for visit (optional)" id="pb-reason" hint="Helps the OPD desk route you.">
              <textarea id="pb-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Fever since 3 days, cough" style={{ fontFamily: 'inherit' }} />
            </Field>
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button type="button" className="btn btn-primary" disabled={!selSlot} onClick={() => setStep(3)}>Review <Icon name="arrowRight" size={14} /></button>
            </div>
          </div>
        ) : (
          <div>
            <div className="card" style={{ background: 'var(--color-surface-2)', marginBottom: 12 }}>
              <strong>Summary — check before confirming</strong>
              <p style={{ margin: '6px 0' }}>
                <strong>{patient?.name}</strong> → <strong>{doctorObj ? `${doctorObj.name} · ${doctorObj.specialization}` : `Doctor #${selDoctor}`}</strong>
              </p>
              <p className="hint" style={{ margin: '0 0 4px' }}>When: <strong>{day} at {selSlot}</strong> · {hospitals.find((h) => String(h.id) === String(selHospital))?.name || '—'}</p>
              {reason.trim() ? <p className="hint" style={{ margin: 0 }}>Reason: {reason.trim()}</p> : null}
            </div>
            {bookError && <div className="alert alert-error" role="alert"><Icon name="alert" size={18} /> {bookError}</div>}
            {recovery.length > 0 && (
              <div className="alert alert-warn" role="alert">
                <Icon name="clock" size={18} /><div><strong>That slot just filled — nearest free:</strong>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    {recovery.map((s) => <button key={s.iso} type="button" className="btn btn-sm btn-cta" disabled={booking} onClick={() => submitBook(`${s.iso}:00`.slice(0, 19))}>{s.label} · {String(s.iso).replace('T', ' ').slice(0, 16)}</button>)}
                  </div>
                </div>
              </div>
            )}
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
              <button type="button" className="btn btn-saffron btn-lg" disabled={booking || !selSlot} onClick={() => submitBook()}>{booking ? (<><span className="spinner" /> Booking…</>) : 'Confirm booking'}</button>
            </div>
            <p className="hint">Free cancellation from My Appointments. Arrive with your token 15 minutes early.</p>
          </div>
        )}
      </section>

      {!loadingLists && hospitals.length === 0 && (
        <EmptyState title="No hospitals loaded" body="Contact the system admin if this looks wrong." />
      )}
    </div>
  );
}