export const ROLE_LABEL = {
  SuperAdmin: 'Super Admin',
  HospitalAdmin: 'Hospital Admin',
  Doctor: 'Doctor',
  Receptionist: 'Receptionist',
};

export const ROLE_BLURB = {
  SuperAdmin: 'Network oversight and hospital onboarding',
  HospitalAdmin: 'Your hospital operations',
  Doctor: 'Your clinic, your patients',
  Receptionist: 'Front desk and appointments',
};

/** Every staff role lands on its dashboard; the dashboard adapts to the role. */
export const ROLE_HOME = {
  SuperAdmin: '/dashboard',
  HospitalAdmin: '/dashboard',
  Doctor: '/dashboard',
  Receptionist: '/dashboard',
};

export function homeFor(role) {
  return ROLE_HOME[role] || '/dashboard';
}

/**
 * Role-only navigation. Each role sees exactly its own responsibilities; the
 * public citizen site and the Emergency module are separate surfaces.
 */
export const ROLE_NAV = {
  SuperAdmin: [
    {
      label: 'Oversight',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', end: true },
        { to: '/admin/hospitals', label: 'Hospitals', icon: 'building' },
        { to: '/admin/administrators', label: 'Hospital Administrators', icon: 'idcard' },
        { to: '/admin/doctors', label: 'Doctors Overview', icon: 'stethoscope' },
        { to: '/admin/beds', label: 'Bed Availability', icon: 'bed' },
        { to: '/admin/referrals', label: 'Referrals Overview', icon: 'swap' },
      ],
    },
    {
      label: 'Insights',
      items: [
        { to: '/admin/reports', label: 'Reports & Analytics', icon: 'chart' },
        { to: '/settings', label: 'Settings', icon: 'settings' },
      ],
    },
    {
      label: 'Account',
      items: [{ to: '/profile', label: 'Profile', icon: 'user' }],
    },
  ],
  HospitalAdmin: [
    {
      label: 'Hospital',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', end: true },
        { to: '/hospital/departments', label: 'Departments', icon: 'building' },
        { to: '/hospital/doctors', label: 'Doctors', icon: 'stethoscope' },
        { to: '/hospital/patients', label: 'Patients Overview', icon: 'users' },
        { to: '/hospital/appointments', label: 'Appointments Overview', icon: 'calendar' },
      ],
    },
    {
      label: 'Operations',
      items: [
        { to: '/hospital/beds', label: 'Bed Management', icon: 'bed' },
        { to: '/hospital/referrals', label: 'Referrals', icon: 'swap' },
        { to: '/hospital/reports', label: 'Reports', icon: 'chart' },
      ],
    },
    {
      label: 'Account',
      items: [{ to: '/profile', label: 'Profile', icon: 'user' }],
    },
  ],
  Doctor: [
    {
      label: 'My clinic',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', end: true },
        { to: '/doctor/appointments', label: 'My Appointments', icon: 'calendar' },
        { to: '/doctor/patients', label: 'My Patients', icon: 'users' },
        { to: '/records', label: 'Medical Records', icon: 'file' },
        { to: '/doctor/history', label: 'Consultation History', icon: 'clock' },
      ],
    },
    {
      label: 'Account',
      items: [{ to: '/profile', label: 'Profile', icon: 'user' }],
    },
  ],
  Receptionist: [
    {
      label: 'Front desk',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', end: true },
        { to: '/reception/register', label: 'Register Patient', icon: 'idcard' },
        { to: '/reception/patients', label: 'Patient Directory', icon: 'users' },
        { to: '/reception/book', label: 'Book Appointment', icon: 'calendar' },
        { to: '/reception/appointments', label: 'Manage Appointments', icon: 'clock' },
      ],
    },
    {
      label: 'Account',
      items: [{ to: '/profile', label: 'Profile', icon: 'user' }],
    },
  ],
};

/** Route access list — mirrors ProtectedRoute usage in App.jsx. */
export const ROUTE_ACCESS = {
  '/dashboard': ['SuperAdmin', 'HospitalAdmin', 'Doctor', 'Receptionist'],
  '/admin/hospitals': ['SuperAdmin'],
  '/admin/administrators': ['SuperAdmin'],
  '/admin/doctors': ['SuperAdmin'],
  '/admin/beds': ['SuperAdmin'],
  '/admin/referrals': ['SuperAdmin'],
  '/admin/reports': ['SuperAdmin'],
  '/settings': ['SuperAdmin'],
  '/hospital/departments': ['HospitalAdmin'],
  '/hospital/doctors': ['HospitalAdmin'],
  '/hospital/patients': ['HospitalAdmin'],
  '/hospital/appointments': ['HospitalAdmin'],
  '/hospital/beds': ['HospitalAdmin'],
  '/hospital/referrals': ['HospitalAdmin'],
  '/hospital/reports': ['HospitalAdmin'],
  '/doctor/appointments': ['Doctor'],
  '/doctor/patients': ['Doctor'],
  '/doctor/history': ['Doctor'],
  '/records': ['Doctor'],
  '/reception/register': ['Receptionist'],
  '/reception/patients': ['Receptionist'],
  '/reception/book': ['Receptionist'],
  '/reception/appointments': ['Receptionist'],
  '/patients': ['Receptionist', 'HospitalAdmin'],
  '/patients/:centralId': ['Receptionist', 'HospitalAdmin', 'Doctor'],
  '/profile': ['SuperAdmin', 'HospitalAdmin', 'Doctor', 'Receptionist'],
};
