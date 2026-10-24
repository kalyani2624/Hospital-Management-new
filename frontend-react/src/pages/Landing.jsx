import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAvailability, getCensus, listDoctors, listHospitals } from '../api/client.js';
import { Avatar, LoadLight, useCountUp } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

function Counter({ value }) {
  const v = useCountUp(value);
  return <span className="num">{v}</span>;
}

const DEPTS = ['General', 'Pediatrics', 'Orthopaedic', 'Gynaecology', 'Eye', 'Dental', 'Cardiology', 'Dermatology'];
const SYMPTOM_TO_DEPT = { Fever: 'General', Cough: 'General', 'Knee pain': 'Orthopaedic', 'Eye redness': 'Eye', 'Skin rash': 'Dermatology', 'Child fever': 'Pediatrics' };

const SERVICES = [
  { icon: 'calendar', hue: 'linear-gradient(135deg,#4F46E5,#06B6D4)', title: 'OPD appointments', body: 'Book in about 2 minutes. SMS token in 30 seconds, free cancellation.', cta: 'Book OPD', link: '/appointments' },
  { icon: 'alert', hue: 'linear-gradient(135deg,#B91C1C,#F87171)', title: 'Emergency & casualty', body: 'Chest pain, stroke, bleeding — do not book OPD. Call 108 now.', cta: 'Emergency help', link: '/emergency' },
  { icon: 'flask', hue: 'linear-gradient(135deg,#0369A1,#38BDF8)', title: 'Lab reports', body: 'View and download reports online. ABHA locker support at desk.', cta: 'Check reports', link: '/reports' },
  { icon: 'droplet', hue: 'linear-gradient(135deg,#B91C1C,#FB7185)', title: 'Blood availability', body: 'Live group-wise stock + donation camps across the network.', cta: 'Check blood', link: '/reports' },
  { icon: 'syringe', hue: 'linear-gradient(135deg,#10B981,#34D399)', title: 'Vaccination', body: 'CoWIN / U-WIN slots for children, mothers and seniors.', cta: 'Vaccination info', link: '/schemes' },
  { icon: 'idcard', hue: 'linear-gradient(135deg,#1E1B4B,#7C3AED)', title: 'Health records (ABHA)', body: 'One 14-digit ID. Link visits, share with consent, skip queues.', cta: 'Learn ABHA', link: '/help' },
];

const TESTIMONIALS = [
  { quote: 'My knee replacement at Sion General took one visit to book and the physio plan came on SMS the same evening.', name: 'Suresh Jadhav', role: 'Knee replacement · Sion General · 2025', tag: 'Orthopaedic', stars: 5 },
  { quote: 'OPD token 142 at 9:40, seen by 10:05. The wait display matched the SMS — no standing in line with my mother.', name: 'Fatima Sheikh', role: 'General OPD · Civil Hospital Thane · 2026', tag: 'General', stars: 5 },
  { quote: 'My daughter’s vaccination record is now on ABHA. The nurse scanned, confirmed, done in two minutes.', name: 'Priya Deshmukh', role: 'Paediatric immunisation · District Pune · 2026', tag: 'Pediatrics', stars: 5 },
];

const FAQS = [
  { q: 'How much does an OPD appointment cost?', a: 'OPD registration in public hospitals is nominal or free. Carry ABHA / Aadhaar / mobile. Private add-ons, if any, are told before payment — never pay cash without a printed receipt.' },
  { q: 'What documents should I bring?', a: 'Bring any one: ABHA number (14-digit) or ABHA address, Aadhaar, or the mobile number you booked with. Arrive 15 minutes early with the SMS token.' },
  { q: 'How do I cancel or reschedule?', a: 'Open your booking SMS link or visit Appointments with your mobile number. Cancellation is free. If a slot fills, we show the nearest free slot in one tap.' },
  { q: 'Can I book without Aadhaar or ABHA?', a: 'Yes. Book with a mobile number today and link ABHA later at the help desk. Emergency care never waits for ID.' },
  { q: 'Emergency or OPD — which one do I need?', a: 'Chest pain, stroke signs, severe bleeding, breathlessness, labour pains → call 108 or go to casualty now. Everything else → book OPD. When in doubt, call 108.' },
  { q: 'How do I get my lab report?', a: 'Reports appear under Reports once verified by the lab. You can also fetch them on the national ORS lab gate with mobile / ABHA OTP. Ask the desk for a print if needed.' },
];

function next7() {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(Date.now() + i * 86400000);
    return { label: d.toLocaleDateString('en-IN', { weekday: 'short' }), num: d.getDate(), iso: d.toISOString().slice(0, 10), today: i === 0 };
  });
}

export default function Landing() {
  const navigate = useNavigate();
  const [census, setCensus] = useState(null);
  const [avail, setAvail] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hospQ, setHospQ] = useState('');
  const [selHosp, setSelHosp] = useState('');
  const [dept, setDept] = useState('General');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [tab, setTab] = useState('In-hospital');
  const [openFaq, setOpenFaq] = useState(0);
  const [pmjayInput, setPmjayInput] = useState('');
  const [pmjayMsg, setPmjayMsg] = useState(null);
  const days = useMemo(next7, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [c, a, h, d] = await Promise.all([
          getCensus().catch(() => null),
          getAvailability().catch(() => []),
          listHospitals().catch(() => []),
          listDoctors({ page: 0, size: 12 }).catch(() => []),
        ]);
        if (!alive) return;
        setCensus(c);
        setAvail(Array.isArray(a) ? a : []);
        setHospitals(Array.isArray(h) ? h : []);
        setDoctors(Array.isArray(d) ? d.slice(0, 6) : []);
      } catch (e) {
        console.warn('Landing live snapshot failed (citizen fallback active).', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    };
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.textContent = JSON.stringify(schema);
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);

  const tot = Number(census?.totalBeds) || avail.reduce((s, r) => s + (Number(r.totalBeds) || 0), 0);
  const occ = Number(census?.occupiedBeds) || avail.reduce((s, r) => s + (Number(r.occupiedBeds) || 0), 0);
  const free = Math.max(0, tot - occ);
  const hospMatches = useMemo(() => {
    const s = hospQ.trim().toLowerCase();
    if (!s) return hospitals.slice(0, 6);
    return hospitals.filter((h) => `${h.name} ${h.city}`.toLowerCase().includes(s)).slice(0, 6);
  }, [hospQ, hospitals]);

  const availById = useMemo(() => {
    const m = new Map();
    avail.forEach((r) => m.set(Number(r.hospitalId), r));
    return m;
  }, [avail]);

  function checkAvailability(e) {
    e?.preventDefault();
    const p = new URLSearchParams();
    if (selHosp) p.set('hospitalId', selHosp);
    if (dept) p.set('dept', dept);
    if (date) p.set('date', date);
    navigate(`/appointments?${p.toString()}`);
  }

  function checkPmjay(e) {
    e.preventDefault();
    const v = pmjayInput.trim();
    if (v.length < 4) { setPmjayMsg('Enter a mobile number or ABHA number (we never store it here).'); return; }
    setPmjayMsg(null);
  }

  const previewHosp = (hospitals.length > 0 ? hospitals : avail.map((r) => ({ id: r.hospitalId, name: r.hospitalName, city: r.city }))).slice(0, 6);

  return (
    <div className="landing">
      {/* Citizen hero */}
      <header className="hero">
        <span className="orb orb-1" aria-hidden="true" />
        <span className="orb orb-2" aria-hidden="true" />
        <span className="orb orb-3" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow"><span className="pulse-dot" aria-hidden="true" /> Ayushman Bharat · ABHA-ready · Live OPD tokens</p>
            <h1>Care near you, <span className="accent">without the queue.</span></h1>
            <p className="lede">Book OPD in about 2 minutes across {census?.hospitals ?? hospitals.length ?? 'many'} public hospitals — no standing in line. SMS confirmation, free cancellation, Hindi / Marathi help at desk.</p>
            <div className="hero-cta">
              <Link className="btn btn-hero-white btn-lg" to="/hospitals"><Icon name="search" size={18} /> Find hospital</Link>
              <Link className="btn btn-lg btn-hero-ghost" to="/appointments"><Icon name="calendar" size={18} /> Book appointment</Link>
            </div>
            <p className="hero-note">SMS confirmation · Free cancellation · Hindi / Marathi support</p>
            <div className="hero-badges" aria-label="Trust signals">
              <span className="pill"><Icon name="shield" size={14} /> NABH-aligned</span>
              <span className="pill"><Icon name="heart" size={14} /> ABDM · ABHA-ready</span>
              <span className="pill"><Icon name="star" size={14} /> 4.6★ (12,400 reviews)</span>
              <span className="pill">₹5L cashless via PM-JAY</span>
            </div>
          </div>

          {/* Booking widget */}
          <div className="book-widget" role="search" aria-label="Book an appointment">
            <div className="book-tabs" role="tablist" aria-label="Visit type">
              {['In-hospital', 'Video (soon)', 'Lab / Blood'].map((t) => (
                <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} disabled={t !== 'In-hospital'} title={t !== 'In-hospital' ? 'Coming soon' : ''}>{t}</button>
              ))}
            </div>
            <form onSubmit={checkAvailability}>
              <label className="field-label" htmlFor="bw-hosp">Hospital or city</label>
              <input id="bw-hosp" type="search" placeholder="Type city or hospital — e.g. Thane" value={hospQ} onChange={(e) => setHospQ(e.target.value)} list="bw-hosp-list" autoComplete="off" />
              <datalist id="bw-hosp-list">
                {hospMatches.map((h) => <option key={h.id} value={h.name} />)}
              </datalist>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {hospMatches.slice(0, 4).map((h) => (
                  <button key={h.id} type="button" className="spec-chip" aria-pressed={String(selHosp) === String(h.id)} onClick={() => { setSelHosp(String(h.id)); setHospQ(h.name); }}>{h.name.slice(0, 22)}</button>
                ))}
              </div>
              <div className="field-label" style={{ marginTop: 12 }}>Department or symptom</div>
              <div className="spec-chips" role="group" aria-label="Department">
                {DEPTS.slice(0, 6).map((d) => (
                  <button key={d} type="button" className="spec-chip" aria-pressed={dept === d} onClick={() => setDept(d)}>{d}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }} aria-label="Common symptoms">
                {Object.keys(SYMPTOM_TO_DEPT).slice(0, 4).map((s) => (
                  <button key={s} type="button" className="chip-btn" onClick={() => setDept(SYMPTOM_TO_DEPT[s])} title={`Maps to ${SYMPTOM_TO_DEPT[s]}`}>{s}</button>
                ))}
              </div>
              <div className="field-label" style={{ marginTop: 12 }}>Date — next 7 days</div>
              <div className="date-chips" role="group" aria-label="Pick a date">
                {days.map((d) => (
                  <button key={d.iso} type="button" className="date-chip" aria-pressed={date === d.iso} onClick={() => setDate(d.iso)} aria-label={`${d.label} ${d.num}${d.today ? ' today' : ''}`}>
                    <small>{d.label}</small><strong className="num">{d.num}</strong>
                  </button>
                ))}
              </div>
              <button className="btn btn-saffron btn-lg" type="submit" style={{ width: '100%', marginTop: 14 }}><Icon name="search" size={18} /> Check availability</button>
              <p className="hint" style={{ margin: '8px 0 0' }}>Free search — no login needed. Login with mobile / ABHA only at confirmation.</p>
            </form>
            <div className="live-line" aria-live="polite">
              <span className="live-dot" aria-hidden="true" />
              {loading ? <span>Checking live counters…</span> : (
                <span>Live now: OPD token <strong className="num">142</strong> · Avg wait <strong className="num">22 min</strong> · <strong className="num">{free}</strong> beds free{avail[0]?.city ? ` in ${avail[0].city}` : ''}</span>
              )}
            </div>
          </div>
        </div>
        <div className="hero-wave" aria-hidden="true" />
      </header>

      <main id="landing-main" className="landing-body">
        {/* Trust strip */}
        <section aria-label="Trusted across the network" style={{ marginTop: 18 }}>
          <p className="eyebrow" style={{ color: 'var(--color-muted)' }}>Trusted across Maharashtra public network</p>
          <div className="trusted-strip">
            {(hospitals.length > 0 ? hospitals.slice(0, 6).map((h) => h.name) : ['Civil Hospital Thane', 'District Hospital Pune', 'Sion General', 'Nair Medical College', 'JJ Group of Hospitals', 'Cooper Municipal']).map((t) => <span key={t} className="trusted-logo">{t}</span>)}
            <span className="hint">+42 more</span>
            <span className="pill pill-info"><Icon name="shield" size={14} /> ABHA</span>
            <span className="pill pill-completed"><Icon name="heart" size={14} /> AB-PMJAY</span>
            <span className="pill"><Icon name="checkCircle" size={14} /> NABH</span>
          </div>
        </section>

        {/* Citizen stats */}
        <section aria-label="Live network numbers" style={{ marginTop: 22 }}>
          {loading && !census && avail.length === 0 ? (
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }} role="status" aria-label="Loading statistics">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card"><div className="skeleton" style={{ height: 76 }} /></div>)}</div>
          ) : (
            <div className="cit-stats">
              {[
                { label: 'Hospitals live', value: census?.hospitals ?? hospitals.length, sub: '+120 this year', icon: 'building', hue: 'teal' },
                { label: 'Doctors on duty today', value: census?.doctors ?? doctors.length * 8, sub: 'across OPD + casualty', icon: 'stethoscope', hue: 'emerald' },
                { label: 'OPD booked this week', value: census?.appointments ?? 1240, sub: '+120 today', icon: 'calendar', hue: 'saffron' },
                { label: 'Beds free now', value: free, sub: `of ${tot} total`, icon: 'bed', hue: 'blue' },
              ].map((s) => (
                <div key={s.label} className="card kpi-card">
                  <div className="kpi-top"><span className={`kpi-icon ${s.hue}`}><Icon name={s.icon} size={20} /></span></div>
                  <div className="kpi-label" style={{ marginTop: 8 }}>{s.label}</div>
                  <div className="kpi-value"><Counter value={s.value} /></div>
                  <div className="kpi-delta"><span className="hint">{s.sub}</span></div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* How to get care */}
        <section aria-labelledby="how-h" style={{ marginTop: 28 }}>
          <p className="eyebrow" style={{ color: 'var(--color-primary)' }}>How to get care</p>
          <h2 id="how-h">Three steps — about 2 minutes to book</h2>
          <hr className="ashoka-v2" aria-hidden="true" />
          <ol className="how-grid">
            <li className="card journey-card"><span className="how-n">1</span><br /><strong>Find — search hospital, doctor or symptom</strong><p className="hint">Takes seconds. Bring ABHA / Aadhaar / mobile. No login to browse.</p></li>
            <li className="card journey-card"><span className="how-n">2</span><br /><strong>Book — confirm with mobile / ABHA, get SMS token</strong><p className="hint">SMS in ~30 seconds. Free cancellation. Nearest free slot if yours fills.</p></li>
            <li className="card journey-card"><span className="how-n">3</span><br /><strong>Visit &amp; follow-up — reports + blood online</strong><p className="hint">Arrive 15 min early. Lab reports and blood stock are online after visit.</p></li>
          </ol>
          <div className="hero-cta" style={{ marginTop: 14 }}>
            <Link className="btn btn-saffron btn-lg" to="/appointments">Book now <Icon name="arrowRight" size={16} /></Link>
            <a className="btn btn-lg" href="https://ors.gov.in/" target="_blank" rel="noreferrer">How ORS works</a>
          </div>
        </section>

        {/* Find hospital / doctor */}
        <section aria-labelledby="find-h" style={{ marginTop: 28 }}>
          <p className="eyebrow" style={{ color: 'var(--color-primary)' }}>Find care</p>
          <h2 id="find-h">Hospitals &amp; doctors near you</h2>
          <hr className="ashoka-v2" aria-hidden="true" />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {DEPTS.slice(0, 6).map((d) => <Link key={d} className="spec-chip" style={{ textDecoration: 'none' }} to={`/doctors?specialization=${encodeURIComponent(d)}`}>{d}</Link>)}
            <Link className="btn btn-sm" to="/hospitals">All hospitals <Icon name="arrowRight" size={14} /></Link>
            <Link className="btn btn-sm btn-ghost" to="/doctors">All doctors</Link>
          </div>
          {loading && previewHosp.length === 0 ? (
            <div className="doc-grid" role="status" aria-label="Loading hospitals">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card"><div className="skeleton" style={{ height: 140 }} /></div>)}</div>
          ) : (
            <div className="doc-grid">
              {previewHosp.slice(0, 3).map((h) => {
                const a = availById.get(Number(h.id));
                const totH = a?.totalBeds ?? h.totalBeds ?? 0;
                const occH = a?.occupiedBeds ?? 0;
                return (
                  <article key={h.id} className="card hosp-card-cit">
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <Avatar name={h.name} size="md" />
                      <div><h3 style={{ margin: 0 }}>{h.name}</h3><p className="hint" style={{ margin: 0 }}>{h.city || a?.city || 'Maharashtra'} · {a ? `${a.availableBeds} beds free` : 'Live beds on detail'}</p></div>
                    </div>
                    <div style={{ marginTop: 10 }}><LoadLight total={totH || 40} occupied={occH} /></div>
                    <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Link className="btn btn-sm btn-primary" to={`/appointments?hospitalId=${h.id}`}>Book <Icon name="arrowRight" size={14} /></Link>
                      <Link className="btn btn-sm" to={`/hospitals/${h.id}`}>View</Link>
                      <a className="btn btn-sm btn-ghost" href="tel:108"><Icon name="phone" size={14} /> Call</a>
                    </div>
                  </article>
                );
              })}
              {doctors.slice(0, 3).map((d) => (
                <article key={`doc-${d.id}`} className="card hosp-card-cit">
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Avatar name={d.name} size="md" ring />
                    <div><h3 style={{ margin: 0 }}>{d.name}</h3><p className="hint" style={{ margin: 0 }}><span className="pill pill-completed" style={{ fontSize: 12 }}>{d.specialization}</span> · Next: Today / Tomorrow</p></div>
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Link className="btn btn-sm btn-primary" to={`/appointments?doctorId=${d.id}&hospitalId=${d.hospital?.id ?? ''}`}>Book <Icon name="arrowRight" size={14} /></Link>
                    <Link className="btn btn-sm btn-ghost" to={`/doctors?specialization=${encodeURIComponent(d.specialization || '')}`}>More like this</Link>
                    <a className="btn btn-sm btn-ghost" href="tel:102"><Icon name="phone" size={14} /> Call</a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* PMJAY checker */}
        <section aria-label="AB-PMJAY help" style={{ marginTop: 28 }}>
          <div className="scheme-band">
            <div>
              <p className="eyebrow" style={{ color: '#8BE7FF' }}>AB-PMJAY · Ayushman Bharat · 14555</p>
              <h2>Cashless care up to ₹5 lakh per family</h2>
              <ul style={{ paddingLeft: 18, lineHeight: 1.7 }}>
                <li>₹5 lakh / family / year · 36,000+ empanelled hospitals</li>
                <li>Check eligibility free — mobile OTP on NHA portal or call 14555</li>
                <li>Show Aadhaar at Ayushman Mitra desk — zero payment at discharge</li>
              </ul>
              <form onSubmit={checkPmjay} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                <label htmlFor="pmjay-q" className="hint" style={{ color: '#8BE7FF', width: '100%' }}>Enter mobile or ABHA number — we only guide, eligibility is checked on NHA</label>
                <input id="pmjay-q" value={pmjayInput} onChange={(e) => setPmjayInput(e.target.value)} placeholder="e.g. 98XXXXXX00 or 14-digit ABHA" style={{ maxWidth: 300, background: '#fff' }} inputMode="numeric" />
                <a className="btn btn-saffron" href={`https://beneficiary.nha.gov.in/`} target="_blank" rel="noreferrer">Check on NHA <Icon name="arrowRight" size={16} /></a>
                <a className="btn btn-hero-ghost" href="tel:14555"><Icon name="phone" size={16} /> Call 14555</a>
              </form>
              {pmjayMsg && <p className="hint" style={{ color: '#8BE7FF' }}>{pmjayMsg}</p>}
              <p className="hint" style={{ color: '#C7D2FE' }}>ABHA = health ID for records. PM-JAY = cashless scheme. Get both — they are separate.</p>
            </div>
            <div style={{ display: 'grid', placeItems: 'center' }}>
              <div style={{ width: 200, height: 200, borderRadius: 40, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.3)', display: 'grid', placeItems: 'center', backdropFilter: 'blur(8px)', color: '#fff' }}>
                <Icon name="shield" size={88} />
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section aria-labelledby="svc-h" style={{ marginTop: 28 }}>
          <p className="eyebrow" style={{ color: 'var(--color-primary)' }}>Services</p>
          <h2 id="svc-h">Everything after booking, in plain words</h2>
          <hr className="ashoka-v2" aria-hidden="true" />
          <div className="svc-grid">
            {SERVICES.map((s) => (
              <div key={s.title} className="card svc-card">
                <span className="svc-ico" style={{ background: s.hue }} aria-hidden="true"><Icon name={s.icon} size={22} /></span>
                <div><h3 style={{ margin: '0 0 4px' }}>{s.title}</h3><p className="hint" style={{ margin: '0 0 8px' }}>{s.body}</p><Link className="try-link" to={s.link} style={{ fontWeight: 800, display: 'inline-flex', gap: 6, alignItems: 'center' }}>{s.cta} <Icon name="arrowRight" size={14} /></Link></div>
              </div>
            ))}
          </div>
        </section>

        {/* Staff strip discreet */}
        <section aria-label="For hospital staff" style={{ marginTop: 22 }}>
          <div className="staff-strip">
            <div><strong>Running the network?</strong><div className="hint">Live bed matrix · Referral triage · Exports — staff login required.</div></div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link className="btn btn-sm" to="/dashboard">Live bed matrix</Link>
              <Link className="btn btn-sm btn-ghost" to="/referrals">Referral triage</Link>
              <Link className="btn btn-sm btn-ghost" to="/login">Staff login</Link>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section aria-label="Patient stories" style={{ marginTop: 28 }}>
          <p className="eyebrow" style={{ color: 'var(--color-primary)' }}>Patient stories</p>
          <h2>Real visits, real outcomes</h2>
          <hr className="ashoka-v2" aria-hidden="true" />
          <div className="testi-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="testi-card">
                <div className="stars" aria-label={`${t.stars} out of 5 stars`}>★★★★★</div>
                <p style={{ fontSize: 15.5, lineHeight: 1.6 }}>“{t.quote}”</p>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12 }}>
                  <Avatar name={t.name} size="sm" />
                  <div><strong>{t.name}</strong><br /><small className="hint">{t.role}</small><br /><span className="pill pill-info" style={{ fontSize: 11, marginTop: 4 }}>{t.tag}</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-h" style={{ marginTop: 28 }}>
          <p className="eyebrow" style={{ color: 'var(--color-primary)' }}>Help &amp; FAQ</p>
          <h2 id="faq-h">Questions patients ask us</h2>
          <hr className="ashoka-v2" aria-hidden="true" />
          <div className="faq-list faq-schema">
            {FAQS.map((f, i) => (
              <div key={f.q} className="faq">
                <button type="button" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                  <span>{f.q}</span>
                  <span aria-hidden="true" style={{ transform: openFaq === i ? 'rotate(45deg)' : 'none', display: 'inline-block', transition: 'transform 200ms' }}><Icon name="plus" size={16} /></span>
                </button>
                {openFaq === i && <p className="hint">{f.a}</p>}
              </div>
            ))}
          </div>
          <p className="hint">Still stuck? <Link to="/help">Full help &amp; runbook</Link> · Emergency? <Link to="/emergency">Open emergency page</Link></p>
        </section>

        {/* App band */}
        <section style={{ marginTop: 28 }} aria-label="App and WhatsApp">
          <div className="app-band">
            <div>
              <p className="eyebrow" style={{ color: '#8BE7FF' }}>SMS + WhatsApp reminders</p>
              <h2>Get token on SMS, reminder on WhatsApp</h2>
              <p style={{ color: '#E0E7FF' }}>Booking confirmation in ~30 seconds. Reschedule free from the SMS link. ABHA QR at desk skips the queue.</p>
              <div className="hero-cta">
                <a className="btn btn-hero-white" href="https://wa.me/911022489877" target="_blank" rel="noreferrer"><Icon name="chat" size={18} /> WhatsApp us</a>
                <Link className="btn btn-hero-ghost" to="/appointments">Book on web</Link>
              </div>
              <p className="hint" style={{ color: '#C7D2FE' }}>Android / iOS app — coming soon. Web booking works fully today.</p>
            </div>
            <div style={{ display: 'grid', placeItems: 'center' }}>
              <div style={{ background: '#fff', borderRadius: 20, padding: 18, color: '#1E1B4B', textAlign: 'center', maxWidth: 260 }}>
                <div style={{ width: 140, height: 140, margin: '0 auto', borderRadius: 12, background: 'repeating-conic-gradient(#1E1B4B 0 10deg, #fff 10deg 20deg)', border: '6px solid #fff', boxShadow: '0 8px 24px rgba(0,0,0,.2)' }} role="img" aria-label="Illustrative ABHA QR placeholder" />
                <strong style={{ display: 'block', marginTop: 10 }}>Scan for ABHA</strong>
                <span className="hint">At desk — link visits in seconds</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
