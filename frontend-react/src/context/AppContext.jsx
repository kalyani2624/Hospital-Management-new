import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AppCtx = createContext(null);

export const ROLES = ['SuperAdmin', 'HospitalAdmin', 'Doctor', 'Receptionist'];

// Patient portal identities come from the backend Patient table (no password in
// the demo build). A patient session is stored separately from staff sessions.
const PATIENT_KEY = 'hub.patient';

function read(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
function clear(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

let toastSeq = 1;

export function AppProvider({ children }) {
  const navigate = useNavigate();
  const [auth, setAuthState] = useState(() => read('hub.auth', null));
  const [patient, setPatientState] = useState(() => read(PATIENT_KEY, null));
  const [role, setRoleState] = useState(() => read('hub.auth', null)?.role || read('hub.role', 'SuperAdmin'));
  const [hospitalScope, setHospitalScopeState] = useState(() => read('hub.hospitalScope', 'all'));
  const [myHospitalId, setMyHospitalIdState] = useState(() => read('hub.myHospitalId', ''));
  const [theme, setThemeState] = useState(() => read('hub.theme', 'light'));
  const [toasts, setToasts] = useState([]);
  const [recent, setRecent] = useState(() => read('hub.recentCentralIds', []));
  const timers = useRef([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    write('hub.theme', theme);
  }, [theme]);

  const pushToast = useCallback((message, opts = {}) => {
    const id = toastSeq++;
    const t = { id, message, actionLabel: opts.actionLabel, onAction: opts.onAction };
    setToasts((prev) => [...prev.slice(-3), t]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, opts.ms ?? 6000);
    timers.current.push(timer);
    return id;
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const setRole = useCallback((r) => {
    setRoleState(r);
    write('hub.role', r);
  }, []);
  const setHospitalScope = useCallback((s) => {
    setHospitalScopeState(s);
    write('hub.hospitalScope', s);
  }, []);
  const setMyHospitalId = useCallback((v) => {
    setMyHospitalIdState(v);
    write('hub.myHospitalId', v);
  }, []);
  const setTheme = useCallback((t) => {
    setThemeState(t === 'dark' ? 'dark' : 'light');
  }, []);

  // ---- Staff (demo local session; server RBAC to be enforced before prod) ----
  const login = useCallback((user) => {
    const session = {
      name: String(user?.name || 'Demo User').trim() || 'Demo User',
      email: String(user?.email || '').trim(),
      role: ROLES.includes(user?.role) ? user.role : 'Receptionist',
      hospitalId: user?.hospitalId != null && user?.hospitalId !== '' ? String(user.hospitalId) : '',
      hospitalName: String(user?.hospitalName || ''),
      centralId: String(user?.centralId || '').trim(),
      // Doctor module identity: chosen from the seeded doctors at sign-in. The
      // backend enforces this claim (DemoAuthorizationFilter); it is still
      // demo-only — a real deployment needs sessions/OAuth.
      doctorId: user?.doctorId != null && user?.doctorId !== '' ? String(user.doctorId) : '',
      doctorName: String(user?.doctorName || ''),
      specialization: String(user?.specialization || ''),
      loginAt: new Date().toISOString(),
    };
    setAuthState(session);
    write('hub.auth', session);
    setRoleState(session.role);
    write('hub.role', session.role);
    // A patient session and a staff session are mutually exclusive.
    setPatientState(null);
    clear(PATIENT_KEY);
    if (session.hospitalId) {
      setMyHospitalIdState(session.hospitalId);
      write('hub.myHospitalId', session.hospitalId);
    }
    return session;
  }, []);

  /** Re-point the Doctor identity inside an existing staff session (Profile picker). */
  const setDoctorClaim = useCallback((claim = {}) => {
    setAuthState((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        doctorId: claim.doctorId != null && claim.doctorId !== '' ? String(claim.doctorId) : '',
        doctorName: String(claim.doctorName || ''),
        specialization: String(claim.specialization || ''),
        hospitalId: claim.hospitalId != null && claim.hospitalId !== '' ? String(claim.hospitalId) : prev.hospitalId,
        hospitalName: String(claim.hospitalName || prev.hospitalName || ''),
      };
      write('hub.auth', next);
      return next;
    });
  }, []);

  // ---- Patient portal (demo build: sign-in by mobile / centralId, no password) ----
  const loginPatient = useCallback((p) => {
    const session = {
      id: p?.id,
      centralId: String(p?.centralId || ''),
      name: String(p?.name || 'Patient'),
      age: p?.age,
      gender: String(p?.gender || ''),
      phone: String(p?.phone || ''),
      dob: p?.dob || null,
      address: String(p?.address || ''),
      email: String(p?.email || ''),
      registeredHospital: p?.registeredHospital || null,
      loginAt: new Date().toISOString(),
    };
    setPatientState(session);
    write(PATIENT_KEY, session);
    // Patient portal is not a staff console.
    setAuthState(null);
    clear('hub.auth');
    setRoleState('Receptionist');
    return session;
  }, []);

  const updatePatientSession = useCallback((patch = {}) => {
    setPatientState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch, loginAt: prev.loginAt };
      write(PATIENT_KEY, next);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    setAuthState(null);
    clear('hub.auth');
    setPatientState(null);
    clear(PATIENT_KEY);
  }, []);

  const updateProfile = useCallback((patch = {}) => {
    setAuthState((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        name: patch.name != null ? String(patch.name) : prev.name,
        email: patch.email != null ? String(patch.email) : prev.email,
        hospitalId: patch.hospitalId != null ? String(patch.hospitalId) : prev.hospitalId,
        hospitalName: patch.hospitalName != null ? String(patch.hospitalName) : prev.hospitalName,
      };
      write('hub.auth', next);
      return next;
    });
  }, []);

  const rememberCentralId = useCallback((centralId) => {
    const id = String(centralId || '').trim();
    if (!id) return;
    setRecent((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 5);
      write('hub.recentCentralIds', next);
      return next;
    });
  }, []);

  const goCentralId = useCallback(
    (centralId) => {
      const id = String(centralId || '').trim();
      if (!id) return;
      rememberCentralId(id);
      navigate(`/patients/${encodeURIComponent(id)}`);
    },
    [navigate, rememberCentralId],
  );

  // Non-SuperAdmin roles are locked to their assigned hospital.
  const lockedHospitalId =
    role === 'SuperAdmin' ? null : myHospitalId !== '' && myHospitalId != null ? String(myHospitalId) : null;

  const effectiveScopeId =
    role === 'SuperAdmin'
      ? hospitalScope === 'all'
        ? null
        : String(hospitalScope)
      : lockedHospitalId;

  // Role responsibilities (the API enforces the same boundaries via demo headers).
  const can = useMemo(
    () => ({
      manageHospitals: role === 'SuperAdmin',
      manageDoctors: role === 'HospitalAdmin',
      manageDepartments: role === 'HospitalAdmin',
      manageBeds: role === 'HospitalAdmin',
      manageReferrals: role === 'HospitalAdmin',
      acceptReferrals: role === 'HospitalAdmin',
      viewReports: role === 'SuperAdmin' || role === 'HospitalAdmin',
      manageSettings: role === 'SuperAdmin',
      writeRecords: role === 'Doctor',
      // Only the front desk books/cancels/reschedules; patients use the portal
      // and doctors only see their assigned diary / complete consultations.
      bookAppointments: role === 'Receptionist',
      registerPatients: role === 'Receptionist',
    }),
    [role],
  );

  const value = {
    auth, isAuthenticated: !!auth, login, logout, updateProfile, setDoctorClaim,
    patient, isPatient: !!patient, loginPatient, updatePatientSession,
    role, setRole,
    hospitalScope, setHospitalScope,
    myHospitalId, setMyHospitalId,
    lockedHospitalId, effectiveScopeId, can,
    theme, setTheme: setTheme,
    toasts, pushToast, dismissToast,
    recent, rememberCentralId, goCentralId,
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
