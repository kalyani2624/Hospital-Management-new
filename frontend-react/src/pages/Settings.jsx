import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Field, SectionHeader } from '../components/ui.jsx';
import Icon from '../components/icons.jsx';

function readPref(key, fallback) {
  try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
}
function writePref(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export default function Settings() {
  const { theme, setTheme, pushToast } = useApp();
  const [density, setDensity] = useState(() => readPref('hub.density', 'comfortable'));
  const [liveRefresh, setLiveRefresh] = useState(() => readPref('hub.liveRefresh', true));
  const [toastSound, setToastSound] = useState(() => readPref('hub.toastSound', false));
  const [contrast, setContrast] = useState(() => readPref('hub.contrast', false));
  const [lang, setLang] = useState(() => readPref('hub.lang', 'en'));

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density);
    writePref('hub.density', density);
  }, [density]);

  useEffect(() => {
    writePref('hub.liveRefresh', liveRefresh);
    writePref('hub.toastSound', toastSound);
    writePref('hub.contrast', contrast);
    writePref('hub.lang', lang);
    document.documentElement.style.filter = contrast ? 'contrast(1.12)' : '';
  }, [liveRefresh, toastSound, contrast, lang]);

  function resetAll() {
    ['hub.density', 'hub.liveRefresh', 'hub.toastSound', 'hub.contrast', 'hub.lang'].forEach((k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } });
    setDensity('comfortable'); setLiveRefresh(true); setToastSound(false); setContrast(false); setLang('en'); setTheme('light');
    pushToast('Settings reset to ministry defaults.');
  }

  function clearRecent() {
    try { localStorage.removeItem('hub.recentCentralIds'); } catch { /* ignore */ }
    pushToast('Recent centralIds cleared.');
  }

  return (
    <div>
      <div className="page-head"><div><h1>Settings</h1><hr className="ashoka-v2" aria-hidden="true" /><p className="hint" style={{ margin: 0 }}>Persisted in <code>localStorage</code> — survives refresh, per browser.</p></div></div>
      <div className="cols cols-2">
        <section className="card" aria-label="Appearance">
          <SectionHeader title="Appearance" hint="Theme + density + contrast with live preview." />
          <Field label="Theme" id="st-theme" hint="Same toggle as the avatar menu. Dark is a deep ocean ward.">
            <div className="seg" role="group" aria-label="Theme">
              <button type="button" className={`btn ${theme !== 'dark' ? 'btn-primary' : ''}`} aria-pressed={theme !== 'dark'} onClick={() => setTheme('light')}><Icon name="checkCircle" size={16} /> Light</button>
              <button type="button" className={`btn ${theme === 'dark' ? 'btn-primary' : ''}`} aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>Dark</button>
              <button type="button" className="btn btn-ghost" onClick={() => setTheme(window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')}>System</button>
            </div>
          </Field>
          <div style={{ marginTop: 12 }}>
            <Field label="Density" id="st-density" hint="Compact fits more rows on ward tablets.">
              <div className="seg" role="group" aria-label="Density">
                <button type="button" className={`btn ${density === 'comfortable' ? 'btn-primary' : ''}`} aria-pressed={density === 'comfortable'} onClick={() => setDensity('comfortable')}>Comfortable</button>
                <button type="button" className={`btn ${density === 'compact' ? 'btn-primary' : ''}`} aria-pressed={density === 'compact'} onClick={() => setDensity('compact')}>Compact</button>
              </div>
            </Field>
          </div>
          <label className="switch-row" htmlFor="st-contrast"><span><strong>High contrast</strong><br /><span className="hint">Bumps text to pure white/black, 2px borders, no translucency.</span></span><input id="st-contrast" type="checkbox" role="switch" checked={contrast} onChange={(e) => setContrast(e.target.checked)} /></label>
          <Field label="Language" id="st-lang" hint="English + हिन्दी toggle — Devanagari font included.">
            <div className="seg" role="group" aria-label="Language">
              <button type="button" className={`btn btn-sm ${lang === 'en' ? 'btn-primary' : ''}`} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>English</button>
              <button type="button" className={`btn btn-sm ${lang === 'hi' ? 'btn-primary' : ''}`} aria-pressed={lang === 'hi'} onClick={() => setLang('hi')}>हिन्दी (स्वास्थ्य)</button>
            </div>
          </Field>
          <div className="theme-preview" aria-label="Theme preview">
            <span className="tp-chip tp-a">Primary Aa</span>
            <span className="tp-chip tp-b">12:30 OPD</span>
            <span className="tp-chip tp-c">Available 42%</span>
          </div>
        </section>

        <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
          <section className="card" aria-label="Behaviour">
            <SectionHeader title="Behaviour" />
            <label className="switch-row" htmlFor="st-live"><span><strong>Live auto-refresh</strong><br /><span className="hint">Dash + topbar ticker poll every 60s (paused when tab hidden).</span></span><input id="st-live" type="checkbox" role="switch" checked={liveRefresh} onChange={(e) => setLiveRefresh(e.target.checked)} /></label>
            <label className="switch-row" htmlFor="st-sound"><span><strong>Toast chime</strong><br /><span className="hint">Demo beep on success toasts (off by default for wards).</span></span><input id="st-sound" type="checkbox" role="switch" checked={toastSound} onChange={(e) => setToastSound(e.target.checked)} /></label>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}><button type="button" className="btn" onClick={resetAll}>Reset to defaults</button></div>
            <h3 style={{ marginTop: 16 }}>Keyboard shortcuts</h3>
            <ul className="hint" style={{ marginTop: 4, paddingLeft: 18 }}>
              <li><kbd>/</kbd> — focus CentralId search anywhere</li>
              <li><kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> — move through every control (skip links first)</li>
              <li><kbd>Esc</kbd> — close drawer / popovers</li>
            </ul>
          </section>
          <section className="card" aria-label="Data">
            <SectionHeader title="Data" hint="Local-first controls." />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-sm" onClick={clearRecent}>Clear Recent-5</button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => pushToast('Activity export queued (demo).')}>Export my activity</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
