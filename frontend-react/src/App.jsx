import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PatientRoute from './components/PatientRoute.jsx';
import PatientLayout from './components/PatientLayout.jsx';
import PublicLayout from './components/PublicChrome.jsx';
import { AppProvider } from './context/AppContext.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Forgot from './pages/Forgot.jsx';
import NotFound from './pages/NotFound.jsx';
import PatientLogin from './pages/PatientLogin.jsx';
import PatientDashboard from './pages/PatientDashboard.jsx';
import PatientBook from './pages/PatientBook.jsx';
import PatientAppointments from './pages/PatientAppointments.jsx';
import PatientProfile from './pages/PatientProfile.jsx';
import Hospitals from './pages/Hospitals.jsx';
import HospitalDetail from './pages/HospitalDetail.jsx';
import Doctors from './pages/Doctors.jsx';
import Patients from './pages/Patients.jsx';
import PatientDetail from './pages/PatientDetail.jsx';
import Appointments from './pages/Appointments.jsx';
import Referrals from './pages/Referrals.jsx';
import Beds from './pages/Beds.jsx';
import Records from './pages/Records.jsx';
import DoctorAppointments from './pages/DoctorAppointments.jsx';
import DoctorPatients from './pages/DoctorPatients.jsx';
import ConsultationHistory from './pages/ConsultationHistory.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import Help from './pages/Help.jsx';
import Emergency from './pages/Emergency.jsx';
import Schemes from './pages/Schemes.jsx';
import HospitalAdministrators from './pages/HospitalAdministrators.jsx';
import Departments from './pages/Departments.jsx';
import AppointmentsOverview from './pages/AppointmentsOverview.jsx';
import RegisterPatient from './pages/RegisterPatient.jsx';
import ManageAppointments from './pages/ManageAppointments.jsx';
// L8 perf: Dashboard + Reports pull Recharts (~large). Lazy-split so the initial
// citizen chunk stays lean; staff charts load on demand with a skeleton fallback.
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));

function ChartFallback() {
  return <div role="status" aria-label="Loading charts" style={{ padding: 24 }}><div className="skeleton" style={{ height: 260 }} /><p className="hint">Loading charts…</p></div>;
}

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <Routes>
          {/* Citizen public surface — no login, ORS mental model */}
          <Route element={<PublicLayout />}>
            <Route index element={<Landing />} />
            <Route path="hospitals" element={<Hospitals />} />
            <Route path="hospitals/:id" element={<HospitalDetail />} />
            <Route path="doctors" element={<Doctors />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="emergency" element={<Emergency />} />
            <Route path="schemes" element={<Schemes />} />
            <Route path="reports" element={<Suspense fallback={<ChartFallback />}><Reports /></Suspense>} />
            <Route path="help" element={<Help />} />
          </Route>

          {/* Auth shell — standalone split-screen */}
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="patient/register" element={<Signup patientOnly />} />
          <Route path="forgot" element={<Forgot />} />

          {/* Patient portal — demo mobile-number sign-in (localStorage hub.patient) */}
          <Route path="patient/login" element={<PatientLogin />} />
          <Route element={<PatientRoute />}>
            <Route element={<PatientLayout />}>
              <Route path="patient" element={<PatientDashboard />} />
              <Route path="patient/book" element={<PatientBook />} />
              <Route path="patient/appointments" element={<PatientAppointments />} />
              <Route path="patient/profile" element={<PatientProfile />} />
            </Route>
          </Route>

          {/* Staff surface — demo session via localStorage hub.auth */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="dashboard" element={<Suspense fallback={<ChartFallback />}><Dashboard /></Suspense>} />

              {/* Super Admin */}
              <Route element={<ProtectedRoute roles={['SuperAdmin']} />}>
                <Route path="admin/hospitals" element={<Hospitals />} />
                <Route path="admin/administrators" element={<HospitalAdministrators />} />
                <Route path="admin/doctors" element={<Doctors />} />
                <Route path="admin/beds" element={<Beds />} />
                <Route path="admin/referrals" element={<Referrals />} />
                <Route path="admin/reports" element={<Suspense fallback={<ChartFallback />}><Reports /></Suspense>} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Hospital Admin */}
              <Route element={<ProtectedRoute roles={['HospitalAdmin']} />}>
                <Route path="hospital/departments" element={<Departments />} />
                <Route path="hospital/doctors" element={<Doctors />} />
                <Route path="hospital/patients" element={<Patients />} />
                <Route path="hospital/appointments" element={<AppointmentsOverview />} />
                <Route path="hospital/beds" element={<Beds />} />
                <Route path="hospital/referrals" element={<Referrals />} />
                <Route path="hospital/reports" element={<Suspense fallback={<ChartFallback />}><Reports /></Suspense>} />
              </Route>

              {/* Receptionist */}
              <Route element={<ProtectedRoute roles={['Receptionist']} />}>
                <Route path="reception/register" element={<RegisterPatient />} />
                <Route path="reception/patients" element={<Patients />} />
                <Route path="reception/book" element={<Appointments />} />
                <Route path="reception/appointments" element={<ManageAppointments />} />
              </Route>

              {/* Doctor */}
              <Route element={<ProtectedRoute roles={['Doctor']} />}>
                <Route path="doctor/appointments" element={<DoctorAppointments />} />
                <Route path="doctor/patients" element={<DoctorPatients />} />
                <Route path="doctor/history" element={<ConsultationHistory />} />
                <Route path="records" element={<Records />} />
              </Route>

              {/* Shared lookups (guarded by role usage; pages self-scope) */}
              <Route path="patients" element={<Patients />} />
              <Route path="patients/:centralId" element={<PatientDetail />} />
              <Route path="referrals" element={<Referrals />} />
              <Route path="beds" element={<Beds />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>

          <Route path="404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppProvider>
    </HashRouter>
  );
}
