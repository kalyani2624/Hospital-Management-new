import { useEffect, useState } from 'react';
import { loadOf } from '../api/client.js';
import Icon from './icons.jsx';

/* Count-up numbers 800ms, respects reduced-motion */
export function useCountUp(target, duration = 800) {
  const [val, setVal] = useState(0);
  const num = Number(String(target).replace(/[^0-9.-]/g, '')) || 0;
  const isNum = /^-?[\d,.]+$/.test(String(target).trim());
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !isNum) {
      setVal(num);
      return;
    }
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(num * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [num, duration, isNum]);
  if (!isNum) return target;
  return val.toLocaleString('en-IN');
}

export function Avatar({ name, size = 'md', ring = false }) {
  const initials = String(name || 'U').replace(/^Dr\.?\s*/i, '').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
  return (
    <span className={`avatar avatar-${size} ${ring ? 'avatar-ring' : ''}`} aria-hidden="true">
      {initials}
    </span>
  );
}

export function LoadLight({ total, occupied, showBar = true }) {
  const { pct, level, label } = loadOf(total, occupied);
  const free = Math.max(0, (Number(total) || 0) - (Number(occupied) || 0));
  return (
    <span className="load-wrap" title={`Occupied ${occupied} of ${total}`}>
      <span className={`load-light load-${level}`}>
        <span className="load-dot" aria-hidden="true" />
        {label}
      </span>
      <span className="load-meta num">{pct}% · {free}/{total} free</span>
      {showBar && (
        <span className="load-bar" role="img" aria-label={`${label} ${pct} percent occupied`}>
          <span className={`load-fill ${level}`} style={{ width: `${pct}%`, display: 'block' }} />
        </span>
      )}
    </span>
  );
}

export function OccupancyBar({ total, occupied }) {
  const { pct, level } = loadOf(total, occupied);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span className="occ-track" aria-hidden="true">
        <span className={`occ-fill ${level === 'available' ? '' : level}`} style={{ width: `${pct}%`, display: 'block' }} />
      </span>
      <span className="num" style={{ fontWeight: 700 }}>{pct}%</span>
    </span>
  );
}

const PILL_ICON = { BOOKED: 'clock', PENDING: 'clock', CANCELLED: 'xCircle', COMPLETED: 'checkCircle', ACCEPTED: 'checkCircle', AVAILABLE: 'checkCircle', TIGHT: 'alert', FULL: 'xCircle' };
export function StatusPill({ status }) {
  const s = String(status || '').toUpperCase();
  const cls = s === 'BOOKED' || s === 'PENDING' ? 'pill-pending' : s === 'CANCELLED' ? 'pill-cancelled' : s === 'AVAILABLE' || s === 'COMPLETED' || s === 'ACCEPTED' ? 'pill-completed' : 'pill-info';
  return (
    <span className={`pill ${cls}`}>
      <Icon name={PILL_ICON[s] || 'checkCircle'} size={14} /> {s || '—'}
    </span>
  );
}

const KPI_HUES = ['teal', 'emerald', 'saffron', 'blue', 'violet', 'rose'];
const KPI_ICONS = ['building', 'stethoscope', 'users', 'calendar', 'swap', 'bed'];
export function KpiCard({ label, value, delta, hue, icon, spark, index = 0 }) {
  const animated = useCountUp(value);
  const h = hue || KPI_HUES[index % KPI_HUES.length];
  const ic = icon || KPI_ICONS[index % KPI_ICONS.length];
  return (
    <div className="card kpi-card kpi">
      <div className="kpi-top">
        <span className={`kpi-icon ${h}`} aria-hidden="true"><Icon name={ic} size={20} /></span>
        {delta && <span className={`delta-pill ${String(delta).includes('▲') ? 'delta-up' : String(delta).includes('▼') ? 'delta-down' : 'delta-up'}`}>{delta}</span>}
      </div>
      <div className="kpi-label" style={{ marginTop: 10 }}>{label}</div>
      <div className="kpi-value num">{animated}</div>
      {spark && (
        <svg className="spark" width="100%" height="28" viewBox="0 0 120 28" aria-hidden="true" preserveAspectRatio="none">
          <polyline points={spark} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
        </svg>
      )}
    </div>
  );
}

/** Compact stat tile used by the role dashboards (same visual language as KpiCard). */
export function StatCard({ label, value, hint, icon = 'chart', hue = 'teal', index = 0 }) {
  const animated = useCountUp(value);
  return (
    <div className="card kpi-card stat-card">
      <div className="kpi-top">
        <span className={`kpi-icon ${hue}`} aria-hidden="true"><Icon name={icon} size={20} /></span>
      </div>
      <div className="kpi-label" style={{ marginTop: 8 }}>{label}</div>
      <div className="kpi-value num">{animated}</div>
      {hint && <p className="hint" style={{ margin: '4px 0 0' }}>{hint}</p>}
    </div>
  );
}

export function SectionHeader({ title, hint, actions, eyebrow }) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && <p className="eyebrow" style={{ color: 'var(--color-primary)', marginBottom: 4 }}><span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--color-saffron)', display: 'inline-block' }} /> {eyebrow}</p>}
        <h2 style={{ margin: 0 }}>{title}</h2>
        {hint && <p className="hint" style={{ margin: '4px 0 0' }}>{hint}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function Skeleton({ height = 60, count = 1, label = 'Loading' }) {
  return (
    <div role="status" aria-label={label}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height, marginBottom: 8 }} />
      ))}
      <span className="hint">Loading…</span>
    </div>
  );
}

export function SkeletonCards({ count = 6 }) {
  return (
    <div className="kpi-grid" role="status" aria-label="Loading statistics">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card kpi-card"><div className="skeleton" style={{ height: 18, width: '40%' }} /><div className="skeleton" style={{ height: 34, marginTop: 8 }} /><div className="skeleton" style={{ height: 14, width: '60%', marginTop: 8 }} /></div>
      ))}
    </div>
  );
}

export function ErrorBanner({ error, onRetry, hint }) {
  if (!error) return null;
  const msg = typeof error === 'string' ? error : error.message || 'Something went wrong.';
  return (
    <div className="alert alert-error" role="alert">
      <Icon name="alert" size={20} />
      <div style={{ flex: 1 }}>
        <strong>What happened:</strong> {msg}
        {hint ? <div className="hint" style={{ marginTop: 4 }}>What to do: {hint}</div> : null}
        {onRetry ? (
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-sm" onClick={onRetry}><Icon name="refresh" size={14} /> Retry</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const EMPTY_ICON = { hospital: 'building', doctor: 'stethoscope', patient: 'users', calendar: 'calendar', referral: 'swap', bed: 'bed', record: 'file', search: 'search', default: 'heart' };
export function EmptyState({ title, body, action, secondary, art = 'default' }) {
  return (
    <div className="empty">
      <div className="empty-art" aria-hidden="true"><Icon name={EMPTY_ICON[art] || EMPTY_ICON.default} size={44} /></div>
      <h3 style={{ marginBottom: 4 }}>{title}</h3>
      <p className="hint" style={{ marginTop: 0, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>{body}</p>
      {(action || secondary) && <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>{action}{secondary}</div>}
    </div>
  );
}

export function Pagination({ page, size, onPage, onSize, hasMore }) {
  return (
    <div className="pager" aria-label="Pagination">
      <button type="button" className="btn btn-sm" disabled={page <= 0} onClick={() => onPage(page - 1)}>
        <Icon name="chevronLeft" size={14} /> Prev
      </button>
      <span className="hint num">Page {page + 1} · size {size}</span>
      <button type="button" className="btn btn-sm" disabled={!hasMore} onClick={() => onPage(page + 1)}>
        Next <Icon name="chevronRight" size={14} />
      </button>
      <label className="hint" htmlFor="page-size">Per page</label>
      <select id="page-size" value={String(size)} onChange={(e) => onSize(Number(e.target.value))} style={{ width: 90 }}>
        {[5, 10, 20].map((n) => (<option key={n} value={n}>{n}</option>))}
      </select>
    </div>
  );
}

export function Field({ label, hint, error, children, id, required }) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}{required && <span style={{ color: 'var(--color-saffron)' }} aria-hidden="true"> *</span>}</label>
      {children}
      {hint ? <div className="field-hint" id={id ? `${id}-hint` : undefined}>{hint}</div> : null}
      {error ? <div className="field-error" role="alert"><Icon name="alert" size={14} /> {error}</div> : null}
    </div>
  );
}

/* ===== Reusable dashboard primitives (MediCore) ===== */

/** Friendly alias matching the design-system vocabulary. */
export function StatusBadge({ status }) {
  return <StatusPill status={status} />;
}

/** Friendly alias matching the design-system vocabulary. */
export function FormField(props) {
  return <Field {...props} />;
}

export function LoadingSpinner({ label = 'Loading…', inline = false }) {
  if (inline) {
    return (
      <span role="status" aria-label={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--color-muted)' }}>
        <span className="spinner" aria-hidden="true" /> {label}
      </span>
    );
  }
  return (
    <div role="status" aria-label={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 0' }}>
      <span className="spinner" aria-hidden="true" />
      <p className="hint" style={{ margin: 0 }}>{label}</p>
    </div>
  );
}

export function SearchBar({ value, onChange, onSearch, placeholder = 'Search…', className = '' }) {
  return (
    <form
      className={`search-bar ${className}`}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch?.(value);
      }}
    >
      <Icon name="search" size={16} />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {value ? (
        <button type="button" className="btn-icon" aria-label="Clear search" onClick={() => onChange('')}>
          <Icon name="xCircle" size={16} />
        </button>
      ) : null}
    </form>
  );
}

/**
 * Generic data table.
 * columns: [{ key, label, render?(row), width?, align? }]
 * rows: array. loading / empty props render states; actions is an array of
 * { label, icon?, onClick(row), tone?('danger') } rendered per row.
 */
export function DataTable({ columns, rows = [], loading = false, emptyTitle = 'No records yet', emptyBody = 'Nothing to show here.', keyOf = (r) => r.id, actions = [], rowClass } ) {
  if (loading) return <Skeleton height={52} count={5} />;
  if (!rows.length) {
    return <EmptyState title={emptyTitle} body={emptyBody} art="search" />;
  }
  return (
    <div className="table-scroll" style={{ overflowX: 'auto' }}>
      <table className="data">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ width: c.width, textAlign: c.align }}>{c.label}</th>
            ))}
            {actions.length > 0 ? <th style={{ width: 96 }}>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={keyOf(row)} className={rowClass?.(row)}>
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align }}>
                  {c.render ? c.render(row) : String(row[c.key] ?? '—')}
                </td>
              ))}
              {actions.length > 0 ? (
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-start' }}>
                    {actions.map((a, i) => (
                      <button
                        key={i}
                        type="button"
                        className={a.tone === 'danger' ? 'btn btn-sm btn-ghost-danger' : 'btn btn-sm btn-ghost'}
                        onClick={() => a.onClick(row)}
                        disabled={typeof a.disabled === 'function' ? a.disabled(row) : a.disabled}
                        title={typeof a.title === 'function' ? a.title(row) : a.title}
                      >
                        {a.icon ? <Icon name={a.icon} size={13} /> : null} {a.label}
                      </button>
                    ))}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, width = 520 }) {
  if (!open) return null;
  return (
    <div className="modal-mask" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="modal-dialog" role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width, width: '100%' }}>
        <div className="modal-head">
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button type="button" className="btn-icon" aria-label="Close dialog" onClick={onClose}><Icon name="xCircle" size={20} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title = 'Are you sure?', body = 'This action cannot be undone.', confirmLabel = 'Confirm', danger = true, onConfirm, onCancel, busy = false }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-sm" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className={`btn btn-sm ${danger ? 'btn-danger' : ''}`} onClick={onConfirm} disabled={busy}>
            {busy ? '…' : confirmLabel}
          </button>
        </div>
      }
    >
      <p style={{ margin: 0 }}>{body}</p>
    </Modal>
  );
}
