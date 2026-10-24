import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/icons.jsx';

const STEPS = [
  { n: '1', t: 'Check if you are eligible', d: 'On beneficiary.nha.gov.in → “Am I Eligible” → mobile OTP → search by state + Aadhaar / ration / family ID / mobile in SECC list. Or call 14555. Free, 2 minutes.' },
  { n: '2', t: 'Find an empanelled hospital', d: 'Search hospitals.pmjay.gov.in or ask the Ayushman Mitra desk. 36,000+ hospitals (govt + private). Show Aadhaar at desk.' },
  { n: '3', t: 'Get cashless treatment', d: 'Biometric / Aadhaar verification → e-card claim → zero payment at discharge. If anyone asks for money, refuse and call 14555 immediately.' },
];

const FAQ = [
  { q: 'What is covered?', a: '₹5 lakh per family per year for secondary + tertiary hospitalisation. Seniors 70+ get a separate ₹5 lakh top-up under Vay Vandana. OPD medicines alone are not covered.' },
  { q: 'ABHA vs PM-JAY — different?', a: 'Yes. ABHA (14-digit) is your digital health ID for records. PM-JAY is the cashless scheme. Get both — they are separate.' },
  { q: 'What documents?', a: 'Aadhaar + ration / family ID + mobile. At hospital: Aadhaar biometric at Ayushman Mitra desk.' },
  { q: 'Hospital asked for money — what now?', a: 'Refuse to pay, take a receipt of anything paid, note the hospital name + date, and call 14555 (24×7 toll-free). You can also complain on beneficiary.nha.gov.in.' },
];

export default function Schemes() {
  const [open, setOpen] = useState(0);
  return (
    <div className="landing-body" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 56px' }}>
      <p className="eyebrow" style={{ color: 'var(--color-primary)' }}>Schemes · Ayushman Bharat PM-JAY</p>
      <h1 style={{ fontSize: 'clamp(28px,4vw,44px)' }}>₹5 lakh cashless care, <span style={{ color: 'var(--color-emerald)' }}>per family, per year.</span></h1>
      <p className="lede" style={{ color: 'var(--color-muted)', maxWidth: '72ch' }}>45.5 crore cards, 12.69 crore hospitalisations as of Aug 2026. Check eligibility in 2 minutes — free on the national portal, app, or helpline. We never check eligibility locally; we only guide you to the official NHA flow.</p>
      <div className="hero-cta">
        <a className="btn btn-saffron btn-lg" href="https://beneficiary.nha.gov.in/" target="_blank" rel="noreferrer">Check eligibility on NHA <Icon name="arrowRight" size={16} /></a>
        <a className="btn btn-lg" href="tel:14555"><Icon name="phone" size={16} /> Call 14555 (toll-free)</a>
      </div>

      <div className="kpi-grid" style={{ marginTop: 18 }}>
        {[
          { l: 'Cover per family', v: '₹5,00,000', s: 'per year, cashless' },
          { l: 'Empanelled hospitals', v: '36,229', s: '19,483 govt + 16,746 private' },
          { l: 'Cards issued', v: '45.5 Cr', s: 'as of Aug 2026' },
          { l: 'Helpline', v: '14555', s: '24×7 toll-free' },
        ].map((c, i) => (
          <div key={c.l} className="card kpi-card">
            <div className="kpi-top"><span className={`kpi-icon ${['saffron', 'teal', 'emerald', 'blue'][i]}`}><Icon name={['shield', 'building', 'users', 'phone'][i]} size={20} /></span></div>
            <div className="kpi-label" style={{ marginTop: 8 }}>{c.l}</div>
            <div className="kpi-value num">{c.v}</div>
            <div className="hint">{c.s}</div>
          </div>
        ))}
      </div>

      <section style={{ marginTop: 24 }} aria-labelledby="pmjay-how">
        <h2 id="pmjay-how">How to use PM-JAY — 3 steps</h2>
        <hr className="ashoka-v2" aria-hidden="true" />
        <ol className="how-grid">
          {STEPS.map((s) => (
            <li key={s.n} className="card"><span className="how-n">{s.n}</span><br /><strong>{s.t}</strong><p className="hint">{s.d}</p></li>
          ))}
        </ol>
      </section>

      <div className="cols cols-2" style={{ marginTop: 16 }}>
        <section className="card">
          <h2>Official links — always free</h2>
          <ul style={{ lineHeight: 2 }}>
            <li><a href="https://beneficiary.nha.gov.in/" target="_blank" rel="noreferrer">beneficiary.nha.gov.in — eligibility + card</a></li>
            <li><a href="https://hospitals.pmjay.gov.in/" target="_blank" rel="noreferrer">hospitals.pmjay.gov.in — empanelled list + GPS</a></li>
            <li><a href="https://healthid.abdm.gov.in/" target="_blank" rel="noreferrer">ABHA — create 14-digit health ID</a></li>
            <li><a href="https://ors.gov.in/" target="_blank" rel="noreferrer">ORS — OPD + lab + blood</a></li>
          </ul>
          <div className="alert alert-warn" role="note"><Icon name="alert" size={18} /><span>Never pay an “agent” for a PM-JAY card. Eligibility check and card are free.</span></div>
        </section>
        <section className="card" aria-label="PMJAY FAQ">
          <h2>Asked at Ayushman desk</h2>
          <div className="faq-list" style={{ marginTop: 8 }}>
            {FAQ.map((f, i) => (
              <div key={f.q} className="faq">
                <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}><span>{f.q}</span><span aria-hidden="true" style={{ transform: open === i ? 'rotate(45deg)' : 'none', display: 'inline-block' }}><Icon name="plus" size={16} /></span></button>
                {open === i && <p className="hint">{f.a}</p>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link className="btn btn-primary btn-sm" to="/hospitals">Find empanelled hospital</Link>
            <Link className="btn btn-sm btn-ghost" to="/help">ABHA help</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
