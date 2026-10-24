import { useState } from 'react';
import { Link } from 'react-router-dom';
import { WS_BASE } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import Icon from '../components/icons.jsx';

const CITIZEN_FAQS = [
  { q: 'How much does an OPD appointment cost?', a: 'OPD registration in public hospitals is nominal or free. Any private add-on is told before payment — never pay cash without a printed receipt.' },
  { q: 'What documents should I bring?', a: 'Any one: ABHA number (14-digit) or ABHA address, Aadhaar, or the mobile number you booked with. Arrive 15 minutes early with the SMS token.' },
  { q: 'How do I cancel or reschedule?', a: 'Use the SMS link or open Appointments with your mobile number. Cancellation is free. If your slot fills, we show the nearest free slot in one tap.' },
  { q: 'Can I book without Aadhaar or ABHA?', a: 'Yes — book with a mobile number and link ABHA later at the help desk. Emergency care never waits for ID. Call 108 for chest pain, stroke, bleeding.' },
  { q: 'Emergency or OPD — which one?', a: 'Chest pain, stroke signs, severe bleeding, breathlessness, labour pains → call 108 or go to casualty now. Everything else → book OPD.' },
  { q: 'How do I get my lab report or check blood stock?', a: 'Verified reports appear under Reports. You can also fetch them on the national ORS lab gate with mobile / ABHA OTP. Blood stock is live under Reports.' },
];

const STAFF_FAQS = [
  { q: 'What is the staff demo login? Is there a password?', a: 'No password in this build. Go to Staff login, enter any display name, pick a role (SuperAdmin sees everything; HospitalAdmin / Doctor / Receptionist lock to one hospital), pick a hospital scope, and Login. Session lives in localStorage as hub.auth.' },
  { q: 'Why am I locked to one hospital?', a: 'Only SuperAdmin is ministry-wide. Every other role reads the assigned hospital and the scope banner says which facility you are viewing.' },
  { q: 'Booking shows “That slot just filled” — did it fail?', a: 'No data was lost. Another booking took the slot seconds earlier. Tap one of the nearest-free buttons to re-book instantly — same patient, same doctor.' },
  { q: 'Who can write clinical notes or triage referrals?', a: 'Records: SuperAdmin and Doctor only — others see a locked composer. Referrals and beds are staff-only; citizens read live availability but never admit or accept transfers themselves.' },
];

export default function Help() {
  const { isAuthenticated, role } = useApp();
  const [open, setOpen] = useState(0);
  const [q, setQ] = useState('');
  const allFaqs = [...CITIZEN_FAQS, ...STAFF_FAQS];
  const filtered = allFaqs.filter((f) => !q.trim() || (f.q + f.a).toLowerCase().includes(q.trim().toLowerCase()));
  // L2 fix: public citizens must never see localhost:8086. Show relative paths
  // until staff login, then show the full WS_BASE for IT copy-paste.
  const isLocalBase = /localhost|127\.0\.0\.1/.test(WS_BASE);
  const displayBase = (!isAuthenticated && isLocalBase) ? '' : WS_BASE;
  const wsdlHref = (!isAuthenticated && isLocalBase) ? '/ws/central.wsdl' : `${WS_BASE}/ws/central.wsdl`;

  return (
    <div className="landing-body" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 56px' }}>
      <p className="eyebrow" style={{ color: 'var(--color-primary)' }}>Help &amp; FAQ</p>
      <h1 style={{ fontSize: 'clamp(26px,3.4vw,38px)' }}>Help — for patients &amp; staff</h1>
      <hr className="ashoka-v2" aria-hidden="true" />
      <p className="hint" style={{ marginTop: 0 }}>Patients first. Staff runbook for the IT cell lives at the bottom. Emergency? <Link to="/emergency">Open emergency</Link> or call <a href="tel:108">108</a>.</p>

      <div className="card" style={{ background: 'var(--gradient-brand)', color: '#fff', border: 0, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="kpi-icon" style={{ background: 'rgba(255,255,255,0.2)' }}><Icon name="search" size={20} /></span>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label className="field-label" htmlFor="help-q" style={{ color: '#fff' }}>Search help — try cost, cancel, ABHA, login</label>
            <input id="help-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. cancel, ABHA, login" style={{ background: '#fff' }} />
          </div>
          <span className="pill" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}><Icon name="phone" size={14} /> 108 · 102 · 14555</span>
        </div>
      </div>

      <div className="cols cols-2">
        <section className="card" aria-label="Frequently asked questions">
          <h2>FAQ — patients &amp; staff</h2>
          <div className="faq-list" style={{ marginTop: 8 }}>
            {filtered.length === 0 ? (<p className="hint">No match — try “cancel”, “ABHA” or “login”.</p>) : filtered.map((f) => {
              const idx = allFaqs.indexOf(f);
              return (
                <div key={f.q} className="faq">
                  <button type="button" aria-expanded={open === idx} onClick={() => setOpen(open === idx ? -1 : idx)}>
                    <span>{f.q}</span>
                    <span aria-hidden="true" style={{ transform: open === idx ? 'rotate(45deg)' : 'none', display: 'inline-block', transition: 'transform 200ms' }}><Icon name="plus" size={16} /></span>
                  </button>
                  {open === idx && <p className="hint">{f.a}</p>}
                </div>
              );
            })}
          </div>
        </section>

        <div>
          <section className="card" aria-label="Helplines">
            <h2>Helplines — tap to call</h2>
            <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
              {[['Emergency', '108', 'tel:108'], ['Ambulance', '102', 'tel:102'], ['Ayushman (PM-JAY)', '14555', 'tel:14555'], ['ABHA / ABDM', '1800-11-4477', 'tel:1800114477']].map(([l, n, href]) => (
                <div key={n} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--color-border-subtle)', borderRadius: 12, padding: 10 }}>
                  <span><strong>{l}</strong><br /><small className="hint">{n}</small></span>
                  <a className="btn btn-sm btn-danger" href={href}><Icon name="phone" size={14} /> Call</a>
                </div>
              ))}
            </div>
            <h3 style={{ fontSize: 15, marginTop: 12 }}>Official portals</h3>
            <ul style={{ lineHeight: 2, margin: 0, paddingLeft: 18 }}>
              <li><a href="https://beneficiary.nha.gov.in/" target="_blank" rel="noreferrer">PM-JAY eligibility (NHA)</a></li>
              <li><a href="https://healthid.abdm.gov.in/" target="_blank" rel="noreferrer">Create ABHA health ID</a></li>
              <li><a href="https://ors.gov.in/" target="_blank" rel="noreferrer">ORS — OPD / lab / blood</a></li>
            </ul>
          </section>

          <section className="card" style={{ marginTop: 12 }} aria-label="Runbook for IT cell">
            <h2>Runbook — for IT cell {isAuthenticated ? `(${role})` : '(staff)'}</h2>
            {!isAuthenticated && <p className="hint" style={{ marginTop: 0 }}><Icon name="alert" size={14} /> Public view shows relative paths. <Link to="/login?next=%2Fhelp">Staff login</Link> reveals full backend origins for copy-paste.</p>}
            <p className="hint" style={{ marginTop: 0 }}>Technical details live only here — never on citizen cards or footers.</p>
            <ol className="hint" style={{ paddingLeft: 18, marginTop: 4, lineHeight: 1.7 }}>
              <li>Backend: Spring Boot on <code>:8086</code> → REST <code>{displayBase}/api/central/census</code> · SOAP <code>{displayBase}/ws/central.wsdl</code></li>
              <li>Portal: <code>npm install</code> then <code>npm run dev</code> → portal on <code>:5173</code></li>
              <li>Build check: <code>npm run build</code> → <code>dist/</code> (must PASS before handoff)</li>
              <li>Backend guardrail: <code>mvn test</code> must stay green 26/26 — frontend never touches backend code.</li>
              <li>CORS: allow portal origin via <code>VITE_API_BASE</code>; never use <code>*</code> (PHI-safe).</li>
            </ol>
            <h3 style={{ fontSize: 15, marginTop: 12 }}>SOAP bridge</h3>
            <p><span className="pill pill-info"><Icon name="swap" size={14} /> Legacy interop</span> <code>{displayBase}/ws/central.wsdl</code> — operations getCentralCensus · getHospitalLoad · getDoctorSchedule.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              <Link className="btn btn-sm btn-primary" to="/login">Staff login</Link>
              <Link className="btn btn-sm" to="/dashboard">Staff console</Link>
              <a className="btn btn-sm" href={wsdlHref} target="_blank" rel="noreferrer">Open WSDL</a>
            </div>
            <h3 style={{ fontSize: 15, marginTop: 12 }}>Shortcuts</h3>
            <div className="table-scroll"><table className="data" style={{ minWidth: 0 }}><thead><tr><th>Key</th><th>Action</th></tr></thead><tbody><tr><td><kbd>/</kbd></td><td>Focus CentralId search (staff console)</td></tr><tr><td><kbd>Esc</kbd></td><td>Close drawer / popovers</td></tr><tr><td><kbd>Tab</kbd></td><td>Move through controls</td></tr></tbody></table></div>
          </section>
        </div>
      </div>
    </div>
  );
}
