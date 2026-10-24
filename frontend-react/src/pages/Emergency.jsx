import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listHospitals } from '../api/client.js';
import { Avatar, Skeleton } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

export default function Emergency() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listHospitals().then((r) => setHospitals(Array.isArray(r) ? r : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="landing-body" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 56px' }}>
      <p className="eyebrow" style={{ color: 'var(--color-danger)' }}><Icon name="alert" size={14} /> Emergency — no login needed</p>
      <h1 style={{ fontSize: 'clamp(28px,4vw,44px)' }}>Chest pain, stroke, bleeding? <span style={{ color: 'var(--color-danger)' }}>Go now.</span></h1>
      <p className="lede" style={{ color: 'var(--color-muted)', maxWidth: '70ch' }}>Do not book OPD for emergencies. Call now, then go to the nearest casualty. Bring ABHA / Aadhaar / mobile if you have it — care never waits for ID.</p>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', marginTop: 16 }}>
        {[
          { n: 'Emergency', num: '108', tel: 'tel:108', hint: 'Medical / fire / police — 24×7' },
          { n: 'Ambulance', num: '102', tel: 'tel:102', hint: 'Free govt ambulance' },
          { n: 'Ayushman helpline', num: '14555', tel: 'tel:14555', hint: 'PM-JAY cashless help' },
          { n: 'ABDM / ABHA', num: '1800-11-4477', tel: 'tel:1800114477', hint: 'Health ID help, 8am–8pm' },
        ].map((c) => (
          <a key={c.num} href={c.tel} className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div className="kpi-label">{c.n}</div>
            <div className="kpi-value num" style={{ color: 'var(--color-danger)' }}>{c.num}</div>
            <div className="hint">{c.hint} · Tap to call</div>
            <span className="btn btn-danger btn-sm" style={{ marginTop: 10 }}><Icon name="phone" size={14} /> Call {c.num}</span>
          </a>
        ))}
      </div>

      <div className="cols cols-2" style={{ marginTop: 16 }}>
        <section className="card" aria-label="What to do now">
          <h2>What to do in the next 5 minutes</h2>
          <hr className="ashoka-v2" aria-hidden="true" />
          <ol style={{ paddingLeft: 18, lineHeight: 1.8 }}>
            <li><strong>Call 108</strong> — say location, age, symptom (chest pain / bleeding / breathless).</li>
            <li><strong>Keep the person still.</strong> Loosen tight clothing. Do not give food / water if drowsy.</li>
            <li><strong>Carry one ID if handy</strong> — ABHA / Aadhaar / mobile. If not, go anyway.</li>
            <li><strong>At casualty say “MLC if needed”</strong> — medico-legal cases (accident / assault) are registered by staff.</li>
          </ol>
          <div className="alert alert-warn" role="alert"><Icon name="alert" size={18} /><span><strong>Triage colours:</strong> Red (immediate) · Yellow (urgent, can wait minutes) · Green (stable). Staff will tag you at the door.</span></div>
        </section>
        <section className="card" aria-label="Nearest casualty">
          <h2>Nearest casualty — public hospitals</h2>
          <p className="hint" style={{ marginTop: 0 }}>Go to the closest casualty, not the “best” hospital. Call en route.</p>
          {loading ? <Skeleton height={140} /> : hospitals.length === 0 ? (
            <p className="hint">Hospital list is offline — call 108 and they will direct you to the nearest casualty.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
              {hospitals.slice(0, 6).map((h) => (
                <li key={h.id} style={{ display: 'flex', gap: 10, alignItems: 'center', border: '1px solid var(--color-border-subtle)', borderRadius: 12, padding: 10 }}>
                  <Avatar name={h.name} size="sm" />
                  <span style={{ flex: 1 }}><strong>{h.name}</strong><br /><small className="hint">{h.city} · Casualty 24×7</small></span>
                  <a className="btn btn-sm" href="tel:108"><Icon name="phone" size={14} /> Call</a>
                  <Link className="btn btn-sm btn-ghost" to={`/hospitals/${h.id}`}>View</Link>
                </li>
              ))}
            </ul>
          )}
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a className="btn btn-primary" href="https://wa.me/911022489877" target="_blank" rel="noreferrer"><Icon name="chat" size={16} /> WhatsApp location</a>
            <Link className="btn btn-ghost" to="/hospitals">All hospitals</Link>
          </div>
        </section>
      </div>

      <section className="card" style={{ marginTop: 14 }}>
        <h2>After emergency — follow-up is free to track</h2>
        <p className="hint">Discharge summary, lab reports and referral (if shifted) appear under Reports. Book follow-up OPD from Appointments with your mobile number.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn btn-primary" to="/appointments">Book follow-up OPD</Link>
          <Link className="btn" to="/reports">View lab / blood</Link>
        </div>
      </section>
    </div>
  );
}
