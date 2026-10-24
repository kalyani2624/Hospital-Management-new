import axios from 'axios';

// Base URL: backend REST on :8086 in dev. Override with VITE_API_BASE for prod/ministry origins.
// M5 fix: prod fallback is relative `/api` (same-origin) so an unset VITE_API_BASE
// never points citizens at localhost:8086. Dev (`vite dev`) keeps localhost for CORS.
const envBase = import.meta.env && import.meta.env.VITE_API_BASE;
export const API_BASE = envBase || '/api'; // Vite proxies /api to Spring Boot in development.

export const WS_BASE = API_BASE.replace(/\/api\/?$/, '') || '';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

// DEMO authorization claims: a staff session sends its login-time identity in
// headers so the backend can enforce role + hospital scope (it cannot read
// localStorage). This mirrors the demo design (no sessions/OAuth) and is NOT
// production-grade auth — see DemoAuthorizationFilter.
api.interceptors.request.use((config) => {
  try {
    const session = JSON.parse(localStorage.getItem('hub.auth') || 'null');
    if (session && session.role) {
      config.headers['X-Demo-Role'] = session.role;
      if (session.role === 'Doctor' && session.doctorId) {
        config.headers['X-Demo-Doctor-Id'] = String(session.doctorId);
      }
      if (session.hospitalId) {
        config.headers['X-Demo-Hospital-Id'] = String(session.hospitalId);
      }
    }
  } catch {
    /* ignore — proceed without demo claims */
  }
  return config;
});

/**
 * Safe text helper — mirrors Hub.esc from the static frontend.
 * React JSX already escapes, but use this for any string concat / CSV / titles.
 */
export function esc(v) {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Normalize axios errors to { status, message, fields } for Hub-style recovery UI. */
export function toApiError(err) {
  const status = err?.response?.status ?? 0;
  const data = err?.response?.data;
  let message = `Request failed. Check connection to ${API_BASE}, then Retry.`;
  if (status === 0) message = `Backend unreachable at ${API_BASE}. ${API_BASE.startsWith('/') ? 'Check that Spring Boot is running on port 8086 and restart Vite to activate its API proxy.' : 'Start Spring Boot on :8086.'}`;
  else if (typeof data?.message === 'string' && data.message) message = data.message;
  else if (typeof data?.error === 'string' && data.error) message = data.error;
  else if (err?.message) message = err.message;
  return { status, message, raw: data, fields: data?.fieldErrors ?? data?.errors ?? null };
}

export function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"' + s.replaceAll('"', '""') + '"' : s;
}

export function downloadCsv(filename, headers, rows) {
  const lines = [headers.map(csvCell).join(',')].concat(
    rows.map((r) => r.map(csvCell).join(',')),
  );
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ---- Central ----
export const getCensus = () => api.get('/central/census').then((r) => r.data);
export const getAvailability = () => api.get('/central/availability').then((r) => r.data);
export const getHospitalLoad = (id) => api.get(`/central/hospitals/${id}/load`).then((r) => r.data);
export const getSoapStatus = async () => {
  try {
    const r = await axios.get(`${WS_BASE}/ws/central.wsdl`, { timeout: 8000, responseType: 'text' });
    return { ok: r.status === 200, status: r.status, bytes: (r.data || '').length };
  } catch (e) {
    return { ok: false, status: e?.response?.status ?? 0, message: toApiError(e).message };
  }
};

// ---- Hospitals ----
export const listHospitals = (page, size) => {
  const q = page != null && size != null ? `?page=${page}&size=${size}` : '';
  return api.get(`/hospitals${q}`).then((r) => r.data);
};
export const getHospital = (id) => api.get(`/hospitals/${id}`).then((r) => r.data);
export const createHospital = (body) => api.post('/hospitals', body).then((r) => r.data);
export const updateHospital = (id, body) => api.put(`/hospitals/${id}`, body).then((r) => r.data);

// ---- Doctors ----
export const listDoctors = (params = {}) => {
  const q = new URLSearchParams();
  if (params.hospitalId) q.set('hospitalId', params.hospitalId);
  if (params.specialization) q.set('specialization', params.specialization);
  if (params.page != null && params.size != null) { q.set('page', params.page); q.set('size', params.size); }
  const s = q.toString();
  return api.get(`/doctors${s ? `?${s}` : ''}`).then((r) => r.data);
};
export const getDoctor = (id) => api.get(`/doctors/${id}`).then((r) => r.data);
export const listDepartments = (hospitalId) =>
  api.get(`/doctors/hospital/${hospitalId}/departments`).then((r) => r.data);
export const createDoctor = (body) => api.post('/doctors', body).then((r) => r.data);
export const listHospitalDepartments = (hospitalId) =>
  api.get('/departments', { params: hospitalId ? { hospitalId } : {} }).then((r) => r.data);
export const createDepartment = (body) => api.post('/departments', body).then((r) => r.data);
export const deleteDepartment = (id) => api.delete(`/departments/${id}`).then((r) => r.data);

// ---- Patients ----
export const listPatients = (page, size) => {
  const q = page != null && size != null ? `?page=${page}&size=${size}` : '';
  return api.get(`/patients${q}`).then((r) => r.data);
};
export const getPatientByCentralId = (centralId) =>
  api.get(`/patients/central/${encodeURIComponent(centralId)}`).then((r) => r.data);
export const getPatientHistory = (id) => api.get(`/patients/${id}/history`).then((r) => r.data);
export const createPatient = (body) => api.post('/patients', body).then((r) => r.data);
export const updatePatient = (id, body) => api.put(`/patients/${id}`, body).then((r) => r.data);
export const getPatientAppointments = (id) => api.get(`/patients/${id}/appointments`).then((r) => r.data);

// ---- Appointments ----
export const listAppointments = (page, size) => {
  const q = page != null && size != null ? `?page=${page}&size=${size}` : '';
  return api.get(`/appointments${q}`).then((r) => r.data);
};
export const bookAppointment = (body) => api.post('/appointments/book', body).then((r) => r.data);
export const cancelAppointment = (id) => api.put(`/appointments/${id}/cancel`).then((r) => r.data);
export const rescheduleAppointment = (id, appointmentTime) =>
  api.put(`/appointments/${id}/reschedule`, { appointmentTime }).then((r) => r.data);

// ---- Doctor module (backend scopes each call to the login-time Doctor claim) ----
export const listAppointmentsForDoctor = (doctorId, filter = 'all') =>
  api.get(`/appointments/doctor/${doctorId}`, { params: { filter } }).then((r) => r.data);
export const completeAppointment = (id, doctorId) =>
  api.put(`/appointments/${id}/complete`, null, { params: { doctorId } }).then((r) => r.data);
export const recordsByDoctor = (doctorId) => api.get(`/records/doctor/${doctorId}`).then((r) => r.data);
export const doctorPatients = (doctorId) => api.get(`/doctors/${doctorId}/patients`).then((r) => r.data);

// ---- Referrals ----
export const listReferrals = (page, size) => {
  const q = page != null && size != null ? `?page=${page}&size=${size}` : '';
  return api.get(`/referrals${q}`).then((r) => r.data);
};
export const createReferral = (body) => api.post('/referrals', body).then((r) => r.data);
export const acceptReferral = (id) => api.put(`/referrals/${id}/accept`).then((r) => r.data);

// ---- Beds ----
export const listBeds = (page, size) => {
  const q = page != null && size != null ? `?page=${page}&size=${size}` : '';
  return api.get(`/beds${q}`).then((r) => r.data);
};
export const bedsByHospital = (hospitalId) =>
  api.get(`/beds/hospital/${hospitalId}`).then((r) => r.data);
export const upsertBed = (body) => api.post('/beds', body).then((r) => r.data);
export const admitBed = (hospitalId, wardType) =>
  api.post(`/beds/admit?hospitalId=${hospitalId}&wardType=${encodeURIComponent(wardType)}`).then((r) => r.data);
export const dischargeBed = (hospitalId, wardType) =>
  api.post(`/beds/discharge?hospitalId=${hospitalId}&wardType=${encodeURIComponent(wardType)}`).then((r) => r.data);

// ---- Records ----
export const recordsByPatient = (patientId, page, size) => {
  const q = page != null && size != null ? `?page=${page}&size=${size}` : '';
  return api.get(`/records/patient/${patientId}${q}`).then((r) => r.data);
};
export const createRecord = (body) => api.post('/records', body).then((r) => r.data);

// ---- Helpers used across pages ----
export function loadOf(total, occupied) {
  const t = Number(total) || 0;
  const o = Number(occupied) || 0;
  const pct = t > 0 ? Math.round((o / t) * 100) : 0;
  const level = pct >= 100 ? 'full' : pct >= 80 ? 'tight' : 'available';
  const label = pct >= 100 ? 'Full' : pct >= 80 ? 'Tight' : 'Available';
  return { pct, level, label };
}

export function displayName(entity) {
  if (!entity) return '—';
  return entity.name ?? entity.hospitalName ?? entity.centralId ?? `#${entity.id ?? ''}`;
}

export function hospitalNameOf(h, hospitalsById) {
  if (h == null) return '—';
  if (typeof h === 'object') return h.name ?? `#${h.id}`;
  return hospitalsById?.get?.(Number(h)) ?? `Hospital #${h}`;
}
