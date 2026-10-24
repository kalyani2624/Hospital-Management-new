# Govt hospital hub — Premium React portal V2 (`frontend-react/`)

> Real ministry-grade single-page app for Project 6. **One citizen, one record, every hospital.** Design per `DESIGN-V2.md` — nation-scale trust, not demo look. The old static `../frontend/` is kept untouched for double-click fallback.

## Objective

Type: explanation.

All government hospitals share one central database and one portal. Each hospital row carries a `hospital_id` back to the `hospitals` registry, and each citizen carries one `centralId` (for example `MH-2026-004213`) across every hospital. History (`GET /api/patients/{id}/history`) joins appointments, records, and referrals by patient. Central endpoints (`GET /api/central/availability`, `GET /api/central/census`) aggregate beds, doctors, and patients without fanning out. Legacy government systems use SOAP at `/ws` (WSDL at `/ws/central.wsdl`).

Single source of truth: backend in `../src/main/java/gov/hospital/hub/`, design tokens in `src/styles/global.css`, design spec in `DESIGN-V2.md`.

## System architecture

```text
Browser (:5173 React / :5500 static / file://)     Legacy SOAP client
  | REST /api/** (JSON via axios)                   | SOAP /ws (XML, central.wsdl)
  v                                                 v
React pages + api/client.js                       CensusEndpoint (JAXB)
  |                                                 |
Controllers (@Valid) + Services (@Transactional) + CentralService
  | AOP @Around LoggingAspect on gov.hospital.hub.service..*
  v
Repositories (Spring Data JPA) -> ONE database (H2 mem dev, MySQL prod)
```

## Entity relationship summary

```text
hospitals (id) 1--* departments (hospital_id)
hospitals (id) 1--* doctors (hospital_id, department_id nullable)
hospitals (id) 1--* patients (hospital_id, central_id UNIQUE)
hospitals, doctors, patients --* appointments (hospital_id, doctor_id, patient_id, appointment_time)
patients, hospitals --* referrals (patient_id, from_hospital_id, to_hospital_id)
hospitals (id) 1--* bed_inventory (hospital_id, ward_type UNIQUE per hospital)
patients, hospitals, doctors --* medical_records (patient_id, hospital_id, doctor_id nullable)
```

## Tech stack

Backend (`../pom.xml`: Spring Boot `4.1.0`, Java `21`): `webmvc`, `data-jpa`, `validation`, `aspectj`, `web-services` plus `wsdl4j` and `jaxb-runtime`, H2 plus MySQL drivers, 26 tests.

Frontend (`package.json 1.0.0`):

- `vite 5`, `react 18`, `react-router-dom 6` (hash router, refresh-safe), `axios`, `recharts`
- Hand-rolled V2 CSS with tokens (`--color-*`, Inter plus Plus Jakarta Sans plus Noto Sans Devanagari)
- Inline SVG icons (`src/components/icons.jsx`), no UI kit, no extra dependency — `npm run build` stays offline-friendly after install

Ports: backend `:8086` bound to `127.0.0.1` (`../src/main/resources/application.properties`), portal `:5173` bound to `127.0.0.1` (`vite.config.js`, `strictPort true`).

## Run together (2 terminals)

Type: how-to.

```powershell
# Terminal 1 — backend (REST :8086 plus SOAP /ws/central.wsdl)
cd "D:\API\Hospital Management System"
.\mvnw.cmd spring-boot:run
# REST: http://localhost:8086/api/central/census
# SOAP: http://localhost:8086/ws/central.wsdl

# Terminal 2 — premium portal (:5173)
cd "D:\API\Hospital Management System\frontend-react"
npm install
npm run dev
# Open http://localhost:5173/  (public landing, no login)
# Sign in at http://localhost:5173/#/login, then open http://localhost:5173/#/dashboard
```

Production build check (must pass):

```powershell
cd "D:\API\Hospital Management System\frontend-react"
npm run build   # Output: dist/ (verified pass, Vite 5, 916 modules)
```

Backend guardrail (must stay green 26 of 26 — frontend never touches backend code):

```powershell
cd "D:\API\Hospital Management System"
.\mvnw.cmd test   # Verified 26/26 pass
```

Static fallback when npm is unavailable: double-click `../frontend/index.html`, or serve it with `npx --yes live-server --port=5500` and open `http://localhost:5500/index.html`. The backend must stay on `http://localhost:8086` or set `window.HUB_API_BASE` before `app.js` loads.

## Env

| Var | Default | Notes |
|---|---|---|
| `VITE_API_BASE` | `http://localhost:8086/api` in dev, `/api` same-origin in prod | Set to ministry origin in prod (CORS in `CorsConfig.java` must allow it) |

CORS already allows `http://localhost:3000`, `http://localhost:5173`, `http://localhost:5500` (plus `127.0.0.1` variants) and `null` for double-click `file://` demos. No `*` wildcard — PHI-safe. Frontend keeps backend green.

## Demo credentials and roles

Type: how-to. No password in this demo. Session is `hub.auth` in `localStorage`.

1. Open `http://localhost:5173/#/login`.
2. Enter a display name, for example `Meera Nair — Front Desk`.
3. Pick a role with the quick-pick chips: `SuperAdmin`, `HospitalAdmin`, `Doctor`, or `Receptionist` (`src/context/AppContext.jsx#ROLES`).
4. Choose a hospital scope unless the role is `SuperAdmin`. Non-`SuperAdmin` roles lock to `hub.myHospitalId` with a scope banner.
5. Select Sign in. Sign out clears `hub.auth` and returns to `#/`.

What each role can do: `SuperAdmin` sees all hospitals and manages hospitals, beds, referrals, and records. `HospitalAdmin` and `Receptionist` manage beds for their hospital. `Doctor` and `SuperAdmin` write records. Everyone may book in this mock (`can.bookAppointments: true`) — server RBAC is owed before prod. Wrong-role deep links show a 403 panel, and records show a blurred doctor-gated composer for non-doctors.

## Pages (hash routes — refresh-safe on static hosting)

Citizen public surface — no login (`PublicChrome`: EmergencyStrip 108/102/14555 plus GovStrip plus sticky Header plus mega-footer; no `localhost` or `/ws/*.wsdl` here — those live only in Help runbook):

| Route | Page | Live APIs |
|---|---|---|
| `#/` | **Citizen landing** — hero plus booking widget (Hospital/City to Dept/Symptom to 7-day chips to Check availability deep-link), trust strip, 4 citizen stats, 3-step journey, hospital/doctor cards (Book plus Call), PM-JAY checker to NHA plus 14555, 6 services, discreet staff strip, testimonials, FAQ plus SEO schema, app/WhatsApp band | `GET /central/census`, `/central/availability`, `GET /hospitals`, `GET /doctors` |
| `#/hospitals` | Find a hospital — search plus city/type/load filters plus Load Light V2 plus Book/View/Call; create hidden unless staff SuperAdmin | `GET /hospitals`, `/central/availability` |
| `#/hospitals/:id` | Hospital detail — NABH/AB-PMJAY badges plus Book/Call plus tabs Overview/Doctors/Beds (live) plus Appointments gated (login) plus staff edit | `/hospitals/:id`, `/central/hospitals/:id/load`, `/beds/hospital/:id`, `/doctors?hospitalId=` |
| `#/doctors` | Meet our doctors — hospital/specialty/search/avail filters plus slot strips plus Book/Call; post hidden unless staff | `GET /doctors?hospitalId&specialization`, `GET /hospitals` |
| `#/appointments?hospitalId&dept&date&doctorId&centralId` | 3-step wizard (Find yourself to Hospital plus Doctor plus Slot to Confirm) plus week strip plus citizen 409 copy “That slot just filled — nearest free” plus recovery; diary hidden unless staff login | `GET /patients/central/:id`, `POST /appointments/book` (201/citizen-409), diary `GET /appointments` staff-only |
| `#/emergency` | Static emergency — Call 108/102/14555/ABDM plus 5-min steps plus triage colours plus nearest casualty from registry plus tel: links, no backend required | `GET /hospitals` (casualty list, fallback to helplines) |
| `#/schemes` | PM-JAY — ₹5L cover, 36,229 empanelled, eligibility to `beneficiary.nha.gov.in` plus 14555, 3 steps, official links, desk FAQ (never fakes eligibility locally) | — (external NHA/ORS/ABHA links only) |
| `#/reports` | Citizen first: Lab/Blood/OPD cards plus live bed table (public `/central/availability`); staff exports (census/availability/load/referral CSV plus charts) only for SuperAdmin/HospitalAdmin login | `GET /central/census`, `/central/availability` (plus staff `GET /referrals`, load) |
| `#/help` | Citizen FAQ (cost/documents/cancel/no-Aadhaar/emergency-vs-OPD/lab) plus helplines plus official portals plus **staff runbook only here**: `:8086`, `/ws/central.wsdl`, `VITE_API_BASE`, CORS, shortcuts | — (runbook shows `WS_BASE`/WSDL) |
| `#/login` | Split-screen staff login — brand panel plus role quick-pick plus 48px form plus scope plus validation plus `?next=` | `GET /hospitals` (scope list) |
| `#/signup` | Split-screen onboard (hospital 201) plus register (patient 201, 409 friendly) plus Step 1/2 progress | `POST /hospitals`, `POST /patients` |
| `#/forgot` | Split-screen reset-link (validated demo state) plus success plus back-to-login | — |
| `#/404` / any unknown | Split-screen 404 plus stethoscope art plus CentralId search plus shortcuts | — |

Staff surface (guarded by `ProtectedRoute`, session `hub.auth` in `localStorage`):

| Route | Page | Live APIs |
|---|---|---|
| `#/dashboard` | Central Command — 6 gradient KPIs plus occupancy bars plus area trend plus load table plus alerts timeline plus pressure donut plus funnel plus quick actions | `GET /central/census`, `/central/availability`, `/appointments`, `/referrals` |
| `#/patients` | Mono CentralId hero plus 409-friendly lookup plus register plus premium registry (avatar plus mono chip) — staff only | `GET/POST /patients`, `/patients/central/:centralId` |
| `#/patients/:centralId` | Gradient header plus copy plus ABHA badge plus actions plus premium timeline (filter chips, icon dots) — staff only | `/patients/central/:id` then `/:id/history` |
| `#/referrals` | Kanban (PENDING saffron / ACCEPTED teal / COMPLETED emerald) plus priority stripes plus triage drawer plus table toggle plus Undo — staff triage, never citizen self-refer | `GET/POST /referrals`, `PUT /:id/accept` |
| `#/beds` | Ward cards (occupancy ring plus Load Light V2 plus 44px bed tiles plus legend) plus admit (tight confirm, full disabled plus citizen-friendly full copy) / discharge plus 30s Undo plus upsert — roles SuperAdmin/HospitalAdmin/Receptionist; citizens read via `/central/availability` only | `GET /beds`, `/beds/hospital/:id`, `POST /beds`, `/admit`, `/discharge` |
| `#/records` | Template chips (SOAP/Discharge/Prescription) plus auto-grow composer (Doctor-gated blur plus lock) plus avatar timeline — roles SuperAdmin/Doctor; citizen lab via ORS link | `GET /records/patient/:id`, `POST /records` |
| `#/profile` | Gradient cover plus avatar plus role pill plus stats plus recent chips plus edit plus sessions plus danger zone (clear session) | `GET /hospitals` (name lookup) |
| `#/settings` | Appearance (Light/Dark/System plus contrast plus density plus preview tiles) plus Behaviour switches (48px) plus Language EN/HI plus Data (clear Recent-5, export) plus shortcuts | — (localStorage only) |

Role-based nav filtering: `beds` hidden for Doctor, `records` only SuperAdmin/Doctor. Citizen never sees `localhost` or `/ws/central.wsdl` or bulk PHI lists — those live only in Help runbook (staff). Unauthorised deep-links render a premium 403 panel with role hint. Logout clears `hub.auth` and returns to `#/`.

## Reference: REST plus SOAP API

Type: reference. Base URL is `http://localhost:8086/api`. All list endpoints accept `?page=&size=` with size capped at 20.

| Method | Path | Portal use |
|---|---|---|
| GET/POST | `/api/hospitals`, `/api/hospitals/{id}`, `PUT /{id}`, `DELETE /{id}` | Hospitals list, detail, onboard |
| GET/POST | `/api/doctors?hospitalId=&specialization=`, `/api/doctors/{id}` | Doctors list, detail |
| GET | `/api/doctors/hospital/{hospitalId}/departments` | Department filter |
| GET/POST | `/api/patients`, `GET /{id}`, `GET /central/{centralId}`, `GET /{id}/history` | Registry, lookup, timeline |
| POST | `/api/appointments/book` | Wizard booking, 201 or citizen-409 |
| PUT | `/api/appointments/{id}/cancel` | Diary cancel with undo |
| GET/POST | `/api/referrals`, `PUT /api/referrals/{id}/accept` | Kanban triage |
| GET | `/api/beds`, `/api/beds/hospital/{hospitalId}` | Ward cards |
| POST | `/api/beds` | Upsert `{hospitalId, wardType, total}` |
| POST | `/api/beds/admit?hospitalId=&wardType=`, `/discharge` | Admit (409 when full), discharge |
| GET | `/api/central/availability`, `/central/census`, `/central/hospitals/{id}/load` | Landing, dashboard, reports |
| GET/POST | `/api/records`, `/api/records/patient/{patientId}` | Notes timeline |
| POST | `/ws` | SOAP; WSDL at `/ws/central.wsdl` (`getCentralCensus`, `getHospitalLoad`, `getDoctorSchedule`) |

Sample requests:

```powershell
curl.exe http://localhost:8086/api/central/census
curl.exe -X POST http://localhost:8086/api/appointments/book `
  -H "Content-Type: application/json" `
  -d '{"patientId":1,"doctorId":2,"hospitalId":1,"appointmentTime":"2026-10-05T10:00:00"}'
curl.exe http://localhost:8086/ws/central.wsdl
```

Client helpers live in `src/api/client.js` (`getCensus`, `getAvailability`, `getHospitalLoad`, `getSoapStatus`, `listHospitals`, `bookAppointment`, `admitBed`, `toApiError`, `downloadCsv`). Errors normalise to `{status, message, fields}` for field errors (400), search-again (404), alternatives (409), and retry (500).

## How validation, errors, transactions, and logging work

Type: explanation. Portal behaviour mirrors backend contracts in `../src/main/java/gov/hospital/hub/`.

- **Validation** — controllers take `@Valid` bodies. The portal shows 400 as inline field errors with suggestions, never raw messages.
- **Errors** — `GlobalExceptionHandler` maps 400, 404, 409 (double-book, full ward, duplicate `centralId`, optimistic-lock race), and 500 with a correlation reference. The portal maps 409 to alternatives (nearest slot, existing record link, nearby hospital) and destructive actions to 30-second undo toasts.
- **Transactions** — booking and admit or discharge commit atomically. The last-bed race returns 409, which the portal shows as citizen-friendly full copy.
- **Logging (AOP)** — `LoggingAspect` logs `ENTER`, `EXIT` with timing, and `FAIL` for every `gov.hospital.hub.service..*` method via `@Around`. No portal code touches it.

## Design V2 — what changed

Tokens in `src/styles/global.css` are the single source of truth — no hard-coded hex in components:

- Best-for-hospital palette: Deep Navy `#0B2A4A` (header/sidebar/text/trust) plus Healing Teal `#0E7490` (primary actions) plus Emerald `#059669` (success/CTA) plus Warm Gold `#D97706` / `#F59E0B` (accent/saffron tick, 8% max) plus BG `#F8FAFC` light / `#071B2E` dark plus Text `#0F172A` plus Danger `#B91C1C` (emergency strip stays red). WCAG AA (navy/ink 15:1, muted 7:1, success `#047857` / warning `#B45309` / danger `#B91C1C` / info `#0369A1` on tinted washes).
- Hero `135deg #0B2A4A 0% -> #0E4A62 30% -> #0E7490 55% -> #059669 100%` rich mesh plus glass plus floating orbs (sky `#38BDF8` plus emerald `#34D399` plus gold `#F59E0B` with glow) plus EHR grid plus tricolor thread (`#0B2A4A / #F59E0B / #059669`) plus wave
- Fonts `Inter` (body) plus `Plus Jakarta Sans` (display) plus `Noto Sans Devanagari` fallback, `rounded-2xl` (16px cards, 24px hero/auth/modals), navy-tinted soft shadows
- Light `#F8FAFC -> #EFF6FF` wash / Dark `#071B2E` bg plus `#0F2E4A` surface plus `#14365E` surface-2 via `[data-theme]`, glass `blur(16px) saturate(1.2)` (`rgba(255,255,255,0.78)` light / `rgba(11,42,74,0.72)` dark)
- Motion 150/220/320ms `cubic-bezier(0.22,1,0.36,1)`, hover lift `-2px`, press `0.98`, count-up 800ms, `prefers-reduced-motion` kills all but opacity
- 44px targets, 3px focus glow, 4.5:1 text, skip links, live regions, keyboard `/` plus `Esc`
- Inline SVG icon set (`src/components/icons.jsx`, Lucide-style 24 viewBox stroke 2) — zero emoji in UI
- Sidebar 264px -> 76px icon rail (persist `hub.navCollapsed`), grouped sections, active = navy-teal-emerald gradient pill plus gold tick with glow plus shadow
- Glass topbar (search center plus bell plus avatar dropdown consolidates role/scope/theme/logout), command-bar card plus live ticker plus Recent-5, scope banner plus breadcrumbs
- KPI gradient-top cards plus icon tiles (navy-teal `#0B2A4A->#0E7490`, emerald, gold-deep `#D97706->#F59E0B`) plus delta pills plus sparklines plus count-up; premium tables (avatar plus name, mono IDs, icon pills, 52px rows, no zebra); Load Lights V2 (12px dot plus ring plus label plus % plus 8px bar emerald/gold-deep/red plus free text); styled Recharts (`#0B2A4A,#0E7490,#059669,#D97706,#0369A1,#7C3AED`, navy occupied plus emerald available bars, navy-teal-emerald area fill, glass tooltips); timeline (navy-emerald rail, colored dots with icons); kanban (priority stripe, drag lift, dashed highlight, triage drawer, Undo 30s); shaped skeletons plus illustrated empties plus What-happened/What-to-do errors plus navy dark toasts (`#0B2A4A`)
- Landing: navy gov strip (`#0B2A4A`) plus rich mesh hero plus glass live card plus overlapping counters plus trusted marquee plus 6 features (navy-teal/red/blue/blood/emerald/navy-violet tiles) plus AB-PMJAY band (navy->teal->emerald) plus 3 steps plus 3 testimonials plus availability preview plus CTA plus navy gov footer
- Auth split-screen: navy-teal-emerald brand gradient panel plus floating chips plus quote plus form card (48px inputs, role quick-pick, show/hide, inline validation, SSO Soon, demo hint)

## Signature plus a11y (per `DESIGN-V2.md`)

- Sticky glass **CentralId Command Bar** on every private page, `/` focuses, **Recent-5** chips in `localStorage hub.recentCentralIds`
- Topbar **hospital quick-search** plus **bell notifications** (pending referrals, ≥90% wards, today's appointments) plus avatar menu; persist `hub.theme`, `hub.navCollapsed`, `hub.density`, `hub.auth`
- **Breadcrumbs** under scope banner; **Load Lights V2** plus **Ashoka tricolor** (`hr.ashoka-v2`) on every header plus landing plus auth
- Skeletons shaped like content, illustrated empties with headline plus primary CTA plus secondary link, toasts `role=alert` with Undo, `?page&size=` pagination (size ≤ 20), dark mode contrast-checked, full keyboard nav, `prefers-reduced-motion`, 44px targets, focus glow
- XSS-safe: JSX escaping only, zero `dangerouslySetInnerHTML`; 400 to field error plus suggestion, 404 to search-again, 409 to alternatives (slot / existing record / nearby hospital), 500 to retry

## Screenshots hint (for the demo video)

1. `#/` landing mesh hero plus glass snapshot (backend on :8086) — 1440px wow test
2. `#/login` split-screen — pick Receptionist plus hospital to Login to lands on `#/dashboard`
3. `#/dashboard` dark mode — 6 KPIs plus charts plus timeline plus donut (looks like a real portal)
4. `#/signup` hospital tab to 201 toast; staff tab to 409 duplicate recovery with link to existing
5. Mobile 360px: drawer nav, stacked hero, topbar search second row, 2-col KPI, card-list tables

Root placeholders also expected in `../screenshots/`: `01-central-census.png`, `02-availability.png`, `03-soap-wsdl.png`.

## Security note (demo only)

Demo build with no password, restricted CORS, H2 console off, and synthetic data only. The server binds `127.0.0.1:8086` only. Do not expose beyond localhost or load real patient data. Prod requires authN/Z plus TLS plus vault password plus `ddl-auto=validate` (see `../src/main/resources/application-prod.properties`). See `.ai/reports/security-audit.md` (fail means prod-blocked, demo OK).

## Reports and further reading

- QA evidence: `.ai/reports/qa-report.md` — verdict PASS, frontend build 916 modules plus backend 26/26 pass fresh 2026-10-02
- Code review: `.ai/reports/code-review.md`
- Security audit: `.ai/reports/security-audit.md` — prod-blocked, demo OK
- Backend guide: `../README.md` — architecture, REST plus SOAP tables, run steps
- Design spec: `DESIGN-V2.md` — tokens, layout, build checklist

## Stack

Vite 5 plus React 18 plus react-router 6 (hash) plus axios plus recharts plus hand-rolled V2 CSS (tokens `--color-*`, Inter plus Plus Jakarta Sans plus Noto Sans Devanagari). Inline SVG icons (no UI kit, no extra dep) — keeps `npm run build` offline-friendly after install.
