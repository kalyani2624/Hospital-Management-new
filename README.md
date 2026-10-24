# Govt centralized hospital hub (Project 6)

> One dashboard and one database for all government hospitals. One citizen, one record, every hospital.

## What this is and why it exists

Today each government hospital keeps its own fragmented registers — paper, spreadsheets, isolated apps. A patient who visits two hospitals gets two identities and no shared history.

This hub fixes that with a single central database and a single portal:

- **Single central database** — `Hospital`, `Department`, `Doctor`, `Patient`, `Appointment`, `Referral`, `BedInventory`, and `MedicalRecord` live in one schema. Every row carries a `hospital_id` foreign key back to the `hospitals` registry.
- **Central patient `centralId`** — one ID per citizen across every hospital, for example `MH-2026-004213`. History (`GET /api/patients/{id}/history`) joins appointments, records, and referrals by patient.
- **Central availability and census** — `GET /api/central/availability` and `GET /api/central/census` aggregate beds, doctors, and patients without fanning out to hospitals.
- **SOAP bridge for legacy government systems** — `/ws` exposes `getCentralCensus`, `getHospitalLoad`, and `getDoctorSchedule`. WSDL at `/ws/central.wsdl`.
- **Two front ends, one API** — premium React portal in `frontend-react/` (recommended) plus the untouched static fallback in `frontend/` for zero-setup demos.

Type: explanation. For task steps see [Run the backend](#run-the-backend) and [Run the React portal](#run-the-react-portal). For the full surface see [Reference: REST API](#reference-rest-api) and [Reference: SOAP API](#reference-soap-api).

## System architecture

```text
Browser (React :5173 / static :5500 / file://)   Legacy SOAP client
  | REST /api/** (JSON)                            | SOAP /ws (XML, central.wsdl)
  v                                                v
Controllers (validation with @Valid)             CensusEndpoint (JAXB)
  |                                                |
Services (@Transactional) ---- CentralService (availability, census, load)
  | AOP @Around LoggingAspect on gov.hospital.hub.service..*
  v
Repositories (Spring Data JPA) -> ONE database (H2 in-memory for dev, MySQL for prod)
```

Cross-cutting concerns live outside business logic. See [How validation, errors, transactions, and logging work](#how-validation-errors-transactions-and-logging-work).

## Entity relationship summary

```text
hospitals (id) 1--* departments (hospital_id)
hospitals (id) 1--* doctors (hospital_id, department_id nullable)
hospitals (id) 1--* patients (hospital_id, central_id UNIQUE)
hospitals, doctors, patients --* appointments (hospital_id, doctor_id, patient_id, appointment_time)
patients, hospitals --* referrals (patient_id, from_hospital_id, to_hospital_id, status)
hospitals (id) 1--* bed_inventory (hospital_id, ward_type UNIQUE per hospital, @Version for races)
patients, hospitals, doctors --* medical_records (patient_id, hospital_id, doctor_id nullable)
```

`centralId` is unique across the whole hub, not per hospital. `BedInventory` uses an optimistic-lock `@Version` column so two concurrent admits on the last bed return 409 instead of overbooking.

## Tech stack

Backend (`pom.xml`: Spring Boot `4.1.0`, Java `21`):

- `spring-boot-starter-webmvc` — REST controllers under `/api/**`
- `spring-boot-starter-data-jpa` — repositories, Hibernate `ddl-auto=update` in dev
- `spring-boot-starter-validation` — `@Valid` on every create and book body
- `spring-boot-starter-aspectj` — `LoggingAspect` timing and entry logging
- `spring-boot-starter-web-services` plus `wsdl4j` and `jaxb-runtime` — SOAP endpoint at `/ws`
- `com.h2database:h2` (runtime) — default dev database `jdbc:h2:mem:central_hub`
- `com.mysql:mysql-connector-j` (runtime) — production database, see `src/main/resources/application-prod.properties`
- `spring-boot-starter-test` and `spring-boot-starter-webmvc-test` — 26 backend tests

Frontend (`frontend-react/package.json` `1.0.0`):

- `vite 5`, `react 18`, `react-router-dom 6` (hash router, refresh-safe on static hosting), `axios`, `recharts`
- Hand-rolled V2 CSS with tokens in `src/styles/global.css`, inline SVG icons, no UI kit
- Design spec: `frontend-react/DESIGN-V2.md`. Portal behaviour: `frontend-react/README.md`

Ports and config:

- Backend: `server.port=8086`, `server.address=127.0.0.1` in `src/main/resources/application.properties`
- React dev: `:5173`, `host 127.0.0.1`, `strictPort true` in `frontend-react/vite.config.js`
- API base: `VITE_API_BASE` or `http://localhost:8086/api` in dev, relative `/api` in prod (`frontend-react/src/api/client.js`)

## Run the backend

Type: how-to.

```powershell
cd "D:\API\Hospital Management System"
.\mvnw.cmd spring-boot:run
# REST: http://localhost:8086/api/central/census
# SOAP WSDL: http://localhost:8086/ws/central.wsdl
# H2 console stays DISABLED by default (blank sa password must never be exposed)
```

Verify the backend is up:

```powershell
curl.exe http://localhost:8086/api/central/census
curl.exe http://localhost:8086/api/central/availability
```

Run backend tests (must stay green):

```powershell
cd "D:\API\Hospital Management System"
.\mvnw.cmd test
# Expected: Tests run: 26, Failures: 0, Errors: 0, Skipped: 0
```

MySQL instead of H2: uncomment the MySQL block in `src/main/resources/application.properties` and restart. Production profile uses `ddl-auto=validate` and `open-in-view=false` — see `src/main/resources/application-prod.properties`.

## Run the React portal

Type: how-to. This is the recommended demo path.

```powershell
# Terminal 1 — backend on :8086
cd "D:\API\Hospital Management System"
.\mvnw.cmd spring-boot:run

# Terminal 2 — premium portal on :5173
cd "D:\API\Hospital Management System\frontend-react"
npm install
npm run dev
# Open http://localhost:5173/  (public landing, no login)
# Sign in at http://localhost:5173/#/login, then open http://localhost:5173/#/dashboard
```

Build check (must pass):

```powershell
cd "D:\API\Hospital Management System\frontend-react"
npm run build
# Output: frontend-react/dist/ (verified: 916 modules, Vite 5)
```

Environment:

| Variable | Default | Notes |
|---|---|---|
| `VITE_API_BASE` | `http://localhost:8086/api` in dev, `/api` same-origin in prod | Set to the ministry origin in prod. CORS in `config/CorsConfig.java` must allow it. |

## Run the static fallback UI

Type: how-to. Use this when Node or npm is not available.

```powershell
# Terminal 1 — backend on :8086
cd "D:\API\Hospital Management System"
.\mvnw.cmd spring-boot:run

# Option A — zero setup: double-click frontend\index.html in Chrome or Edge
# Click: index (command) -> hospitals -> doctors -> patients (?centralId=MH-2026-004213)
#   -> appointments (409 demo: book the same doctor and slot twice)
#   -> referrals (kanban) -> beds -> records -> reports (SOAP note)

# Option B — tiny static server with nicer URLs (same API)
cd "D:\API\Hospital Management System\frontend"
npx --yes live-server --port=5500
# Open http://localhost:5500/index.html
```

The static UI uses design tokens and layout from `frontend/DESIGN.md` and calls `http://localhost:8086/api/*` with `fetch`. If the backend moves, set `window.HUB_API_BASE` before `app.js` loads.

## All routes

Type: reference. Hash routes are refresh-safe on static hosting. Base for React dev is `http://localhost:5173/#`.

### Public citizen surface (no login, `PublicChrome`)

Emergency strip with 108, 102, and 14555 plus a government strip, sticky header, and mega-footer on every page. Citizen pages never show `localhost` or WSDL internals.

| Route | Page | Live APIs |
|---|---|---|
| `#/` | Citizen landing — hero, booking widget, trust strip, stats, journey, hospital and doctor cards, PM-JAY checker, services, testimonials, FAQ | `GET /central/census`, `/central/availability`, `GET /hospitals`, `GET /doctors` |
| `#/hospitals` | Find a hospital — search plus city, type, and load filters | `GET /hospitals`, `/central/availability` |
| `#/hospitals/:id` | Hospital detail — badges, tabs for overview, doctors, beds; appointments tab is login-gated | `/hospitals/:id`, `/central/hospitals/:id/load`, `/beds/hospital/:id`, `/doctors?hospitalId=` |
| `#/doctors` | Meet our doctors — hospital, specialty, search, and availability filters | `GET /doctors?hospitalId&specialization`, `GET /hospitals` |
| `#/appointments` | 3-step booking wizard with 409 recovery (`?hospitalId&dept&date&doctorId&centralId`) | `GET /patients/central/:id`, `POST /appointments/book` |
| `#/emergency` | Static emergency page — call links, 5-minute steps, triage colours, nearest casualty | `GET /hospitals` with helpline fallback, works without backend |
| `#/schemes` | PM-JAY — cover, eligibility link to `beneficiary.nha.gov.in`, helpline 14555 | External NHA, ORS, and ABHA links only |
| `#/reports` | Citizen first: lab, blood, and OPD cards plus live bed table. Staff CSV exports need login | `GET /central/census`, `/central/availability` |
| `#/help` | Citizen FAQ plus helplines. Staff runbook section only here shows `:8086`, `/ws/central.wsdl`, and CORS notes | Runbook only |

### Auth surface (standalone split-screen)

| Route | Page | Live APIs |
|---|---|---|
| `#/login` | Staff sign in — role quick-pick, hospital scope, validation, `?next=` redirect | `GET /hospitals` for the scope list |
| `#/signup` | Onboard a hospital (201) and register a patient (201, friendly 409) | `POST /hospitals`, `POST /patients` |
| `#/forgot` | Reset-link demo state with success panel | None |
| `#/404` and any unknown path | Split-screen 404 with CentralId search and shortcuts | None |

### Staff surface (guarded by `ProtectedRoute`, session `hub.auth` in `localStorage`)

| Route | Page | Who can open it | Live APIs |
|---|---|---|---|
| `#/dashboard` | Central command — 6 KPIs, occupancy, alerts, charts | Any signed-in role | `/central/census`, `/central/availability`, `/appointments`, `/referrals` |
| `#/patients` | Registry with CentralId lookup and register | Any signed-in role | `GET/POST /patients`, `/patients/central/:centralId` |
| `#/patients/:centralId` | Patient timeline — appointments, referrals, records | Any signed-in role | `/patients/central/:id`, then `/:id/history` |
| `#/referrals` | Kanban (pending, accepted, completed) plus triage drawer and 30-second undo | Any signed-in role (triage is staff work, never citizen self-referral) | `GET/POST /referrals`, `PUT /:id/accept` |
| `#/beds` | Ward cards, admit and discharge, 30-second undo, upsert | `SuperAdmin`, `HospitalAdmin`, `Receptionist` only | `GET /beds`, `/beds/hospital/:id`, `POST /beds`, `/admit`, `/discharge` |
| `#/records` | Notes composer with templates, doctor-gated | `SuperAdmin`, `Doctor` only | `GET /records/patient/:id`, `POST /records` |
| `#/profile` | Session, stats, edit, danger zone | Any signed-in role | `GET /hospitals` for name lookup |
| `#/settings` | Appearance, behaviour, language, data | Any signed-in role | `localStorage` only |

Role-based navigation hides `beds` for doctors and `records` for non-doctors. Unauthorised deep links render a 403 panel with the required roles. Sign out clears `hub.auth` and returns to `#/`.

Full portal map lives in `frontend-react/README.md`. Design tokens and page specs live in `frontend-react/DESIGN-V2.md`.

## Reference: REST API

Type: reference. Base URL is `http://localhost:8086/api`. All list endpoints accept `?page=&size=` with size capped at 20.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/hospitals?page=&size=` | List registry |
| POST | `/api/hospitals` | Create hospital, `@Valid` body |
| GET | `/api/hospitals/{id}` | One hospital or 404 |
| PUT | `/api/hospitals/{id}` | Update hospital |
| DELETE | `/api/hospitals/{id}` | Delete registry entry |
| GET | `/api/doctors?hospitalId=&specialization=&page=&size=` | Filter doctors |
| GET | `/api/doctors/{id}` | One doctor or 404 |
| POST | `/api/doctors` | Create doctor |
| GET | `/api/doctors/hospital/{hospitalId}/departments` | Department list |
| GET | `/api/patients?page=&size=` | List patients |
| GET | `/api/patients/{id}` | One patient or 404 |
| POST | `/api/patients` | Create patient, `centralId` unique or 409 |
| GET | `/api/patients/central/{centralId}` | Lookup by central ID or 404 |
| GET | `/api/patients/{id}/history` | Appointments plus records plus referrals |
| GET | `/api/appointments?page=&size=` | List appointments |
| GET | `/api/appointments/{id}` | One appointment or 404 |
| POST | `/api/appointments/book` | `@Transactional`, 409 on double-book |
| PUT | `/api/appointments/{id}/cancel` | Cancel booking |
| GET | `/api/referrals?page=&size=` | List referrals |
| POST | `/api/referrals` | Create inter-hospital transfer |
| PUT | `/api/referrals/{id}/accept` | Accept referral |
| GET | `/api/beds?page=&size=` | Bed stock |
| GET | `/api/beds/hospital/{hospitalId}` | Stock for one hospital |
| POST | `/api/beds` | Upsert `{hospitalId, wardType, total}` |
| POST | `/api/beds/admit?hospitalId=&wardType=` | Admit, 409 when full |
| POST | `/api/beds/discharge?hospitalId=&wardType=` | Discharge |
| GET | `/api/central/availability` | Free beds per hospital and ward |
| GET | `/api/central/census` | Counts for hospitals, doctors, patients, beds |
| GET | `/api/central/hospitals/{id}/load` | Load for one hospital |
| GET | `/api/records/patient/{patientId}?page=&size=` | Visit notes for a patient |
| POST | `/api/records` | Add a visit note |

Sample requests:

```powershell
# Census
curl.exe http://localhost:8086/api/central/census

# Availability
curl.exe http://localhost:8086/api/central/availability

# Register a patient (201, or 409 when centralId exists)
curl.exe -X POST http://localhost:8086/api/patients `
  -H "Content-Type: application/json" `
  -d '{"name":"Asha Patil","age":34,"gender":"F","centralId":"MH-2026-004213","hospitalId":1}'

# Book an appointment (201, or 409 when the slot is taken)
curl.exe -X POST http://localhost:8086/api/appointments/book `
  -H "Content-Type: application/json" `
  -d '{"patientId":1,"doctorId":2,"hospitalId":1,"appointmentTime":"2026-10-05T10:00:00"}'

# Admit a bed (200, or 409 when the ward is full)
curl.exe -X POST "http://localhost:8086/api/beds/admit?hospitalId=1&wardType=General"
```

Double-book returns 409 with recovery guidance:

```json
{
  "status": 409,
  "error": "Conflict",
  "message": "doctor 2 already booked at 2026-10-05T10:00",
  "path": "/api/appointments/book"
}
```

The portal turns this into citizen-friendly copy such as "That slot just filled — nearest free" plus one-click alternatives. See `frontend-react/src/pages/Appointments.jsx`.

## Reference: SOAP API

Type: reference. Endpoint is `POST /ws`. WSDL is `GET /ws/central.wsdl`. Namespace is `http://gov.hospital.hub/central` (`soap/CensusEndpoint.java`).

| Operation | Request element | What it returns |
|---|---|---|
| `getCentralCensus` | `getCentralCensusRequest` (empty) | Hospital, doctor, patient, appointment, total-bed, and occupied-bed counts |
| `getHospitalLoad` | `getHospitalLoadRequest` with `hospitalId` | Hospital name, doctors, appointments, total and occupied beds |
| `getDoctorSchedule` | `getDoctorScheduleRequest` with `doctorId` | Schedule entries with appointment ID, patient `centralId`, time, and status |

Check the WSDL:

```powershell
curl.exe http://localhost:8086/ws/central.wsdl
```

The portal reports page shows live WSDL status with byte size and latency (`frontend-react/src/api/client.js#getSoapStatus`). Staff runbook details live only in `#/help`, never on citizen pages.

## How validation, errors, transactions, and logging work

Type: explanation.

- **Validation** — every create and book controller method takes a `@Valid` body. Bean Validation failures raise `MethodArgumentNotValidException` and return 400 with `field: message` pairs. Missing primitive fields such as `age` or `total` fail Jackson deserialisation and return a generic 400 without leaking class names.
- **Errors** — one `@RestControllerAdvice` class (`exception/GlobalExceptionHandler.java`) maps failures to HTTP codes: 400 for validation and bad requests, 404 for `ResourceNotFoundException`, 409 for `DoubleBookingException`, `BedUnavailableException`, duplicate `centralId` (`IllegalStateException` and `DataIntegrityViolationException`), and optimistic-lock races, plus 500 with a correlation reference for anything unexpected. Raw SQL, constraint names, and stack traces are never echoed.
- **Transactions** — `AppointmentService.book` is `@Transactional` so double-book checks and inserts commit atomically. `BedService` admit and discharge are transactional with an optimistic-lock `@Version` so the last-bed race returns 409. The SOAP doctor-schedule read is `@Transactional(readOnly = true)` with a join-fetch so lazy patients load inside the web-service thread.
- **Logging (AOP)** — `aop/LoggingAspect.java` uses `@Around("execution(* gov.hospital.hub.service..*(..))")` to log `ENTER`, `EXIT` with timing in milliseconds, and `FAIL` with the message for every service method. No service code carries logging boilerplate.
- **Dependency injection** — constructor injection everywhere. Exactly one setter-injection demo exists: `ReferralService.setNotificationService` with `@Autowired` on the setter.
- **Pagination guardrail** — every `list()` endpoint supports `?page=&size=` with size capped at 20 to bound bulk dumps. Calls without parameters return the full list for demo compatibility.
- **Security headers and escaping** — `SecurityHeadersFilter` sets CSP, `X-Frame-Options: DENY`, `nosniff`, and `Referrer-Policy`. The static UI escapes output with `Hub.esc()` and React escapes JSX by default.

## Demo credentials and roles

Type: how-to. There is no password in this demo build. Sign in picks a local session stored as `hub.auth` in `localStorage`.

1. Open `http://localhost:5173/#/login`.
2. Enter a display name such as `Meera Nair — Front Desk`.
3. Pick a role with the quick-pick chips:
   - `SuperAdmin` — ministry-wide, sees all hospitals, can manage hospitals, beds, referrals, and records.
   - `HospitalAdmin` — locked to one hospital scope, can manage beds and accept referrals.
   - `Doctor` — locked to one hospital scope, can write records.
   - `Receptionist` — locked to one hospital scope, can manage beds and book appointments.
4. Choose a hospital scope unless the role is `SuperAdmin`.
5. Select Sign in. The scope banner shows the lock. Non-`SuperAdmin` roles stay inside `hub.myHospitalId`.

Server-side RBAC is still owed before production. The frontend `can` map in `frontend-react/src/context/AppContext.jsx` is a mock. Deep links without the right role show a 403 panel, and records show a blurred doctor-gated composer for non-doctors.

## Screenshots

Placeholders live in `screenshots/`. Add captures before a demo recording:

- `screenshots/01-central-census.png` — `GET /api/central/census` JSON or the React dashboard KPIs
- `screenshots/02-availability.png` — `GET /api/central/availability` JSON or the landing availability preview
- `screenshots/03-soap-wsdl.png` — `/ws/central.wsdl` in a browser with the three operations visible

Portal wow-test shots for the demo video:

1. `#/` landing mesh hero with the glass snapshot at 1440px, backend on `:8086`
2. `#/login` split-screen — pick `Receptionist` plus a hospital, sign in, land on `#/dashboard`
3. `#/dashboard` dark mode — 6 KPIs, charts, timeline, and donut
4. `#/signup` hospital tab showing a 201 toast, then patient tab showing 409 recovery
5. Mobile 360px — drawer navigation, stacked hero, two-column KPIs

## Security note (demo only, do not use with real data)

This is a synthetic-data demo. The server binds `127.0.0.1:8086` only, the H2 console is off by default, CORS allows only local demo origins plus `null` for double-click `file://` use, and there is no authentication or authorisation on the API.

Do not expose this build beyond localhost or load real patient data. Production requires authentication and authorisation, TLS, a vault password, exact ministry CORS origins without `null`, `ddl-auto=validate`, and `open-in-view=false` per `application-prod.properties`. See `frontend-react/.ai/reports/security-audit.md` — verdict is fail for production, OK for local demo.

## Reports and further reading

- Test evidence: `frontend-react/.ai/reports/qa-report.md` — verdict PASS, frontend build with 916 modules plus backend `26/26` tests fresh on 2026-10-02
- Code review: `frontend-react/.ai/reports/code-review.md`
- Security audit: `frontend-react/.ai/reports/security-audit.md` — prod-blocked, demo OK
- Portal guide: `frontend-react/README.md` — full page-by-API map
- Design spec: `frontend-react/DESIGN-V2.md` — tokens, layout, and build checklist
- Static fallback tokens: `frontend/DESIGN.md`
- Production guardrails: `src/main/resources/application-prod.properties`

## Changelog

- Current build: Spring Boot `4.1.0` on Java `21`, REST on `:8086`, React portal on `:5173`, static fallback kept, SOAP at `/ws`, backend tests `26/26` passing, frontend build passing.
- Breaking or migration notes: none in this demo snapshot. Production adoption must add server RBAC, TLS, and managed MySQL before handling real data.
