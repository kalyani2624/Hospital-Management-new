# MediCore source-code fixes — 24 October 2026

## Changes made
- Backend CORS now permits the demo staff request headers (`X-Demo-Role`, `X-Demo-Doctor-Id`, `X-Demo-Hospital-Id`) for configured local origins.
- Vite development server proxies `/api` and `/ws` to Spring Boot at `http://localhost:8086`, and the React API client defaults to relative `/api`. Restart Vite after updating. This addresses the cross-origin/API reachability issue seen in staff dashboards.
- Added a dedicated `/#/patient/register` page that opens the existing patient registration form directly. Updated Patient Portal registration links and introductory text.
- Patient appointment booking now reports failures to load hospitals/doctors rather than silently showing empty lists. Past time slots are disabled, and changing hospitals clears the selected doctor.
- Super Admin Hospitals page now displays administration-oriented heading and description and no longer shows public booking buttons in that role. The public hospital finder is retained separately.
- Updated the Vite document title to `MediCore — Smart Hospital Management System`.
- Emergency component and route left untouched.

## Run on Windows
1. In `D:\Downloads\Hospital-management-new`, start the backend with `mvn spring-boot:run` and keep it running. If port 8086 is occupied, stop the old instance first.
2. In a **new** terminal, run `cd frontend-react`, `npm install`, and `npm run dev`.
3. Visit the exact Vite URL, typically `http://127.0.0.1:5173/#/patient/login`.
4. Register at `/#/patient/register`; test patient dashboard, appointment booking and My Appointments.
5. Test staff routes `/#/admin/hospitals` and `/#/admin/referrals` with a demo Super Admin login.
6. Run `npm run build` and `mvn test` locally. Inspect browser DevTools Console/Network if a request fails.

## Verification and remaining limitations
- JSX syntax of the five edited React source files was checked with Babel parser and passed.
- Full Vite build could not be completed here: the uploaded dependencies were Windows-specific and reinstalling the Linux-compatible optional Rollup dependency timed out.
- Full Maven tests and live end-to-end browser flows were not executed here. These must be run locally.
- Patient login still uses mobile/Central Patient ID only and localStorage. **No backend password authentication exists** in the supplied project; do not treat the demo login or demo staff role headers as production-grade security.
- The demo H2 in-memory database is reset on backend restart unless separately configured.
