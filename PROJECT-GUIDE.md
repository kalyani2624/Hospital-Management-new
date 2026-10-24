# Hospital Hub project guide

This is a handoff guide for a new developer. It describes the source-controlled
project, how its pieces connect, how to run it, and what is still demo-only.
Generated files such as `target/`, `frontend-react/node_modules/`, and
`frontend-react/dist/` are intentionally excluded from the source map.

## 1. What the application does

Hospital Hub is a single Spring Boot application and central relational data
store for hospitals, departments, doctors, patients, appointments, referrals,
beds, and medical records. A patient has a central identifier that can be used
across hospitals. The backend provides:

- A REST API under `/api/**`, consumed by both browser frontends.
- A SOAP service under `/ws/**`, intended as a bridge for legacy clients.
- Development demo data seeded on startup, unless disabled.

There are two UIs:

1. `frontend-react/` — the full React/Vite portal and recommended demo UI.
2. `frontend/` — an older, simpler static HTML/JavaScript fallback UI.

## 2. High-level architecture and request flow

```text
React/Vite browser UI                 Static HTML browser UI          Legacy SOAP client
  src/pages and components              HTML + app.js                     XML
          |                                  |                              |
          +---------- HTTP REST /api/** -----+                              |
          |                                                                 |
          +------------------------ HTTP SOAP /ws/** -----------------------+
                                      |
                         Spring Boot application
                      REST controllers / SOAP endpoint
                                      |
                              service layer
                       validation / transactions
                                      |
                    Spring Data JPA repositories
                                      |
                   H2 (local demo) or MySQL (configured)
```

### REST request path

1. A React page calls a named function in `frontend-react/src/api/client.js`.
   The static UI uses `fetch` in `frontend/assets/js/app.js`.
2. In local development, Vite proxies `/api` and `/ws` to the backend at
   `http://localhost:8086`. The React client uses the same-origin `/api` base.
3. A Spring controller in `src/main/java/gov/hospital/hub/controller/` maps
   the route and delegates to the matching service.
4. Services implement business rules and use repositories to read/write JPA
   entities. `@Transactional` is used where operations need a transaction.
5. `GlobalExceptionHandler` converts known errors into a consistent API error
   response. The browser displays returned data/errors.

### SOAP request path

`WebServiceConfig` registers Spring Web Services at `/ws/*`, loads
`central.xsd`, and publishes the generated WSDL at `/ws/central.wsdl`.
`CensusEndpoint` handles the SOAP operations using the same central business
services as the REST API. Request/response Java classes represent the XSD
messages.

## 3. Repository structure

```text
Hospital-management-new/
|-- .ai/reports/                    Root-level review, QA, and research documents
|-- .mvn/wrapper/maven-wrapper.properties
|                                   Maven Wrapper download/configuration
|-- frontend/                       Static HTML/JavaScript fallback
|   |-- assets/css/styles.css       Static UI styles
|   |-- assets/js/app.js            Static UI rendering and REST calls
|   |-- index.html                  Static landing/home page
|   |-- hospitals.html              Hospital page
|   |-- doctors.html                Doctor page
|   |-- patients.html               Patient page
|   |-- appointments.html           Appointment page
|   |-- referrals.html              Referral page
|   |-- beds.html                   Bed inventory page
|   |-- records.html                Medical records page
|   |-- reports.html                Reports page
|   `-- DESIGN.md                   Static UI design notes
|-- frontend-react/                 React/Vite frontend (recommended)
|   |-- src/                        React source (catalog in section 5)
|   |-- index.html                  Vite HTML entry point
|   |-- vite.config.js              Dev server, API proxy, build configuration
|   |-- package.json                Frontend scripts and dependencies
|   |-- package-lock.json           Locked npm dependency versions
|   |-- README.md                   React portal runbook and route notes
|   |-- DESIGN-V2.md                React portal design specification
|   `-- .ai/reports/                Frontend QA, review, and security reports
|-- screenshots/                    Screenshot folder (currently placeholder)
|-- src/
|   |-- main/java/gov/hospital/hub/ Backend Java application (section 4)
|   |-- main/resources/             Spring config and SOAP schema
|   `-- test/                       Backend tests and test configuration
|-- .gitignore                      Excluded generated/local files
|-- DEMO-SEED.md                    Demo seed data and API verification examples
|-- MEDICORE-FIXES.md               Project fix notes
|-- README.md                       Main architecture, setup, APIs, and limitations
|-- PROJECT-GUIDE.md                This handoff guide
|-- pom.xml                         Maven dependencies/build configuration
|-- mvnw / mvnw.cmd                 Maven Wrapper launchers for Unix/Windows
```

`target/` is generated Maven output. `frontend-react/node_modules/` contains
installed dependencies, and `frontend-react/dist/` is the generated production
build. Do not edit these generated folders as source.

### Root-level support files

| File/folder | Responsibility |
|---|---|
| `.gitignore` | Excludes build output, local files, and other non-source artifacts from version control. |
| `.mvn/wrapper/maven-wrapper.properties` | Tells Maven Wrapper which Maven distribution to use. |
| `mvnw` / `mvnw.cmd` | Unix and Windows launchers for running Maven without a separately installed Maven executable. |
| `pom.xml` | Backend project coordinates, Java version, Spring dependencies, and Maven build plugins. |
| `README.md` | Main project description, architecture, API overview, local run instructions, and demo/security caveats. |
| `DEMO-SEED.md` | Synthetic seed-data counts and sample API verification commands. |
| `MEDICORE-FIXES.md` | Project-specific record of fixes; historical/support documentation, not runtime code. |
| `.ai/reports/code-review.md` | Code review findings/documentation; not runtime code. |
| `.ai/reports/qa-report.md` | QA findings/documentation; not runtime code. |
| `.ai/reports/security-audit.md` | Security review/documentation; not a runtime security control. |
| `.ai/reports/landing-research.md` | Landing-page research notes; not runtime code. |
| `.ai/reports/full-portal-mechanism.md` | Portal behavior/design notes; not runtime code. |
| `screenshots/README.txt` | Notes about the screenshots folder. |
| `screenshots/.gitkeep` | Keeps the currently empty screenshots folder in version control. |

## 4. Backend file guide

All Java source files are under
`src/main/java/gov/hospital/hub/`. The package name is `gov.hospital.hub`.

### Application entry point

| File | Responsibility |
|---|---|
| `HubApplication.java` | Spring Boot entry point; starts the application and component scanning. |

### REST controllers

Controllers expose HTTP routes under `/api` and delegate application work to
services. Request DTOs are currently represented by entity/request objects
where defined; `@Valid` is used for request validation.

| File | API area |
|---|---|
| `controller/HospitalController.java` | Hospital listing, lookup, and management. |
| `controller/DepartmentController.java` | Department management and hospital department lookup. |
| `controller/DoctorController.java` | Doctor listing, filtering, management, and department-related lookups. |
| `controller/PatientController.java` | Patient registration/lookups and patient history. |
| `controller/AppointmentController.java` | Booking, listing, rescheduling, and cancellation of appointments. |
| `controller/ReferralController.java` | Referral creation, listing, and state changes such as acceptance. |
| `controller/BedController.java` | Bed inventory lookup, updates, admissions, and discharges. |
| `controller/MedicalRecordController.java` | Medical record creation and patient/doctor record lookups. |
| `controller/CentralController.java` | Aggregated central census, availability, and hospital load endpoints. |

### Services

Services contain business operations between the HTTP/SOAP adapters and the
repositories. This is where domain checks and transaction boundaries belong.

| File | Responsibility |
|---|---|
| `service/HospitalService.java` | Hospital operations and validations. |
| `service/DepartmentService.java` | Department operations and hospital association checks. |
| `service/DoctorService.java` | Doctor operations, filtering, and related lookups. |
| `service/PatientService.java` | Patient operations, central ID handling, and patient history. |
| `service/AppointmentService.java` | Booking rules, conflict/double-booking checks, and appointment changes. |
| `service/ReferralService.java` | Referral operations and referral state transitions. |
| `service/BedService.java` | Bed inventory, admission/discharge capacity rules, and concurrency handling. |
| `service/MedicalRecordService.java` | Medical record operations and record lookups. |
| `service/CentralService.java` | Cross-hospital census, availability, and load aggregation; used by REST and SOAP. |
| `service/NotificationService.java` | Notification-related service boundary used by application flows. |

### Entities (database model)

These JPA entities map to relational database tables and form the shared
hospital data model.

| File | Represents |
|---|---|
| `entity/Hospital.java` | A hospital in the central registry. |
| `entity/Department.java` | A department associated with a hospital. |
| `entity/Doctor.java` | A doctor, associated with a hospital and optionally a department. |
| `entity/Patient.java` | A patient and their central identifier. |
| `entity/Appointment.java` | A patient appointment with its hospital, doctor, time, and state. |
| `entity/Referral.java` | A referral from one hospital to another for a patient. |
| `entity/BedInventory.java` | A hospital ward's bed capacity and occupancy. |
| `entity/MedicalRecord.java` | A patient's medical record, optionally associated with a doctor. |

Main relationships: a hospital has departments, doctors, patients, beds, and
appointments; appointments connect a patient, doctor, and hospital; referrals
connect patients and sending/receiving hospitals; records connect patients
with hospitals and optionally doctors. A patient's `centralId` identifies
them across the hub.

### Repositories

Spring Data JPA repositories provide database access for their corresponding
entities. Derived query methods and explicit queries live here rather than in
controllers.

| File | Entity/data accessed |
|---|---|
| `repository/HospitalRepository.java` | Hospitals |
| `repository/DepartmentRepository.java` | Departments |
| `repository/DoctorRepository.java` | Doctors |
| `repository/PatientRepository.java` | Patients |
| `repository/AppointmentRepository.java` | Appointments |
| `repository/ReferralRepository.java` | Referrals |
| `repository/BedInventoryRepository.java` | Bed inventory |
| `repository/MedicalRecordRepository.java` | Medical records |

### Configuration and cross-cutting behavior

| File | Responsibility |
|---|---|
| `config/CorsConfig.java` | Configures browser CORS. Current allowed origins are local demo origins; hosting requires deliberate exact-origin changes. |
| `config/DemoAuthorizationFilter.java` | Demo-only role/scope checks based on `X-Demo-*` request headers. These headers are not trustworthy authentication. |
| `config/DemoDataLoader.java` | Seeds synthetic demo data when enabled for a non-test profile. See `DEMO-SEED.md`. |
| `config/SecurityHeadersFilter.java` | Adds HTTP security-related response headers. |
| `config/WebServiceConfig.java` | Registers SOAP servlet, XSD, and WSDL. |
| `aop/LoggingAspect.java` | Cross-cutting service logging/timing via Spring AOP. |

### Exceptions and API errors

| File | Responsibility |
|---|---|
| `exception/ApiError.java` | Consistent error response model. |
| `exception/GlobalExceptionHandler.java` | Maps exceptions to HTTP responses and API error bodies. |
| `exception/ResourceNotFoundException.java` | Signals a requested domain resource was not found. |
| `exception/DoubleBookingException.java` | Signals an appointment booking conflict. |
| `exception/BedUnavailableException.java` | Signals that a bed/capacity operation cannot be completed. |
| `exception/ForbiddenException.java` | Signals a denied demo authorization/scope operation. |

### SOAP classes

| File | Responsibility |
|---|---|
| `soap/CensusEndpoint.java` | SOAP endpoint dispatching census, hospital-load, and doctor-schedule requests. |
| `soap/GetCentralCensusRequest.java` | SOAP request model for central census. |
| `soap/GetCentralCensusResponse.java` | SOAP response model for central census. |
| `soap/GetHospitalLoadRequest.java` | SOAP request model for a hospital load query. |
| `soap/GetHospitalLoadResponse.java` | SOAP response model for hospital load. |
| `soap/GetDoctorScheduleRequest.java` | SOAP request model for a doctor's schedule query. |
| `soap/GetDoctorScheduleResponse.java` | SOAP response model for doctor schedule. |

### Backend configuration and schema

| File | Responsibility |
|---|---|
| `src/main/resources/application.properties` | Default local profile: port `8086`, loopback binding, in-memory H2, JPA settings, and H2 console disabled. |
| `src/main/resources/application-prod.properties` | Production profile overrides, including `ddl-auto=validate` and `open-in-view=false`; database settings/secrets and safe network binding still need deployment configuration. |
| `src/main/resources/central.xsd` | XML schema used by Spring Web Services to create the central SOAP WSDL/messages. |
| `src/test/resources/application.properties` | Test overrides, including disabling demo seed data. |

### Backend tests

Test source is under `src/test/java/gov/hospital/hub/`.

| File | Coverage area |
|---|---|
| `HubApplicationTests.java` | Application context/startup integration check. |
| `AppointmentServiceTest.java` | Appointment business rules and booking behavior. |
| `BedServiceTest.java` | Bed inventory/admit/discharge behavior. |
| `CentralServiceTest.java` | Central aggregates and cross-hospital calculations. |
| `PatientServiceTest.java` | Patient service behavior. |
| `ReferralServiceTest.java` | Referral behavior/state changes. |
| `GlobalExceptionHandlerTest.java` | Exception-to-HTTP error response behavior. |
| `CensusEndpointTest.java` | SOAP census endpoint behavior. |

Run them from the repository root with `mvnw.cmd test`.

## 5. React frontend file guide

### Build and entry points

| File | Responsibility |
|---|---|
| `frontend-react/index.html` | HTML shell containing the React root element. |
| `frontend-react/src/main.jsx` | Creates the React root, imports global CSS, and renders `App`. |
| `frontend-react/src/App.jsx` | Hash-based routes and route-to-page mapping; wraps the app in the shared context provider and layouts. |
| `frontend-react/vite.config.js` | React plugin, local dev server on `127.0.0.1:5173`, `/api` and `/ws` proxy to port 8086, and build output settings. |
| `frontend-react/package.json` | npm scripts and direct dependencies. |
| `frontend-react/package-lock.json` | Exact dependency tree for repeatable npm installs. |

### API and shared application state

| File | Responsibility |
|---|---|
| `src/api/client.js` | Axios client, API base URL, API request helpers, demo identity headers, and response/error utilities. |
| `src/context/AppContext.jsx` | Shared staff/session context and UI-level role/scope state. |
| `src/config/navigation.js` | Role labels, role home routes, and navigation configuration. |
| `src/styles/global.css` | Global styles, design tokens, layout primitives, and responsive styles. |

### Layout, navigation, and reusable components

| File | Responsibility |
|---|---|
| `src/components/PublicChrome.jsx` | Public/citizen layout and shared public header/footer. |
| `src/components/Layout.jsx` | Staff app shell, navigation, and outlet for staff pages. |
| `src/components/AppLayout.jsx` | Shared/alternate application layout component. |
| `src/components/PatientLayout.jsx` | Patient portal shell/navigation. |
| `src/components/ProtectedRoute.jsx` | UI guard for staff sign-in and allowed roles. |
| `src/components/PatientRoute.jsx` | UI guard for patient portal access. |
| `src/components/RoleSidebar.jsx` | Role-dependent sidebar links. |
| `src/components/DashboardHeader.jsx` | Shared dashboard heading/header content. |
| `src/components/Breadcrumbs.jsx` | Breadcrumb navigation. |
| `src/components/AccessDenied.jsx` | UI shown when a route/role is not allowed. |
| `src/components/icons.jsx` | Inline SVG icon components. |
| `src/components/ui.jsx` | Reusable UI elements and shared display helpers. |

### Page components

`src/App.jsx` associates each route with these page components. The same page
may be reused in more than one role-specific route.

| File | Main purpose |
|---|---|
| `src/pages/Landing.jsx` | Public landing page and citizen-facing overview. |
| `src/pages/Hospitals.jsx` | Browse hospitals; also used for admin hospital management. |
| `src/pages/HospitalDetail.jsx` | Details, doctors, beds, and related information for one hospital. |
| `src/pages/Doctors.jsx` | Browse/filter doctors and admin doctor management. |
| `src/pages/Departments.jsx` | Hospital department management. |
| `src/pages/Patients.jsx` | Patient list and management/lookup. |
| `src/pages/PatientDetail.jsx` | A patient detail/history view selected by central ID. |
| `src/pages/RegisterPatient.jsx` | Reception workflow for registering a patient. |
| `src/pages/Appointments.jsx` | Find availability and create/book an appointment. |
| `src/pages/AppointmentsOverview.jsx` | Hospital-level appointment overview. |
| `src/pages/ManageAppointments.jsx` | Reception workflow to manage appointments. |
| `src/pages/DoctorAppointments.jsx` | Doctor's appointment list. |
| `src/pages/DoctorPatients.jsx` | Doctor's patient list. |
| `src/pages/PatientBook.jsx` | Patient portal appointment-booking page. |
| `src/pages/PatientAppointments.jsx` | Patient portal appointment list/actions. |
| `src/pages/PatientDashboard.jsx` | Patient portal home page. |
| `src/pages/PatientProfile.jsx` | Patient portal profile page. |
| `src/pages/PatientLogin.jsx` | Demo patient sign-in. |
| `src/pages/Referrals.jsx` | Referral list and referral workflows. |
| `src/pages/Beds.jsx` | Bed inventory and capacity workflows. |
| `src/pages/Records.jsx` | Medical record/consultation entry and lookup. |
| `src/pages/ConsultationHistory.jsx` | Doctor-oriented consultation history. |
| `src/pages/Dashboard.jsx` | Staff dashboard and operational summaries/charts. |
| `src/pages/Reports.jsx` | Reports, aggregates, charts, and exports. |
| `src/pages/Login.jsx` | Demo staff sign-in and role selection. |
| `src/pages/Signup.jsx` | Demo onboarding/registration flows. |
| `src/pages/Forgot.jsx` | Password-recovery placeholder/demo page. |
| `src/pages/Profile.jsx` | Staff profile view. |
| `src/pages/Settings.jsx` | Admin settings page. |
| `src/pages/HospitalAdministrators.jsx` | Hospital administrator management UI. |
| `src/pages/Emergency.jsx` | Public emergency information and contact actions. |
| `src/pages/Schemes.jsx` | Public scheme/health coverage information. |
| `src/pages/Help.jsx` | Help and project/API guidance for users. |
| `src/pages/NotFound.jsx` | Unknown-route page. |

### Frontend documentation and reports

| File/folder | Responsibility |
|---|---|
| `frontend-react/README.md` | React portal setup, routes, demo roles, API configuration, and UI notes. |
| `frontend-react/DESIGN-V2.md` | Visual design specification. |
| `frontend-react/.ai/reports/code-review.md` | Code review report; not part of runtime. |
| `frontend-react/.ai/reports/qa-report.md` | QA report; not part of runtime. |
| `frontend-react/.ai/reports/security-audit.md` | Security audit report; read before any deployment; not runtime enforcement. |

### React route and login notes

The app uses `HashRouter`, so routes look like `/#/hospitals`; the hash portion
is handled by React Router and typically avoids static-host rewrite rules.
Public pages use `PublicChrome`. Patient pages use `PatientRoute` and
`PatientLayout`. Staff pages use `ProtectedRoute` and `Layout`.

The frontend's staff and patient login flows are demo flows using browser
`localStorage` (keys include `hub.auth` and `hub.patient`). The API client sends
`X-Demo-*` headers for staff demo identity. This is convenient for a synthetic
demo, but is not real authentication: browser users can change local storage
and request headers. UI route guards do not secure the backend.

## 6. Static frontend file guide

The static UI shares the backend API but does not use React or Vite.

| File | Responsibility |
|---|---|
| `frontend/index.html` | Static UI entry/home page. |
| `frontend/hospitals.html` | Hospital UI. |
| `frontend/doctors.html` | Doctor UI. |
| `frontend/patients.html` | Patient UI. |
| `frontend/appointments.html` | Appointment UI. |
| `frontend/referrals.html` | Referral UI. |
| `frontend/beds.html` | Bed inventory UI. |
| `frontend/records.html` | Medical records UI. |
| `frontend/reports.html` | Reports UI. |
| `frontend/assets/js/app.js` | Shared page behavior, rendering, and REST `fetch` calls. Defaults to `http://localhost:8086/api`; can be overridden by setting `window.HUB_API_BASE` before the script loads. |
| `frontend/assets/css/styles.css` | Static frontend styling. |
| `frontend/DESIGN.md` | Static UI design documentation. |

## 7. Data model overview

The model is a central schema rather than a separate database per hospital:

```text
Hospital 1 --- many Departments
Hospital 1 --- many Doctors
Hospital 1 --- many Patients
Hospital 1 --- many BedInventory rows
Hospital 1 --- many Appointments
Patient 1 --- many Appointments
Doctor 1 --- many Appointments
Patient 1 --- many MedicalRecords
Patient 1 --- many Referrals
Referral --- source Hospital and destination Hospital
```

The Java entity mappings in `src/main/java/gov/hospital/hub/entity/` are the
authoritative detail for columns, constraints, enums, and entity relationships.
`DEMO-SEED.md` documents the synthetic seed records and sample verification
requests.

## 8. Technology stack

### Backend

- Java 21.
- Spring Boot 4.1.0, built with Maven.
- Spring MVC/WebMVC for REST controllers.
- Spring Data JPA and Hibernate for ORM/database access.
- Jakarta Bean Validation for request validation.
- Spring AOP for service logging.
- Spring Web Services, JAXB runtime, and WSDL4J for SOAP.
- H2 in-memory database by default for local demo.
- MySQL JDBC driver available for a configured persistent database.
- Spring Boot test dependencies for backend tests.

### Frontend

- Node.js/npm toolchain.
- React 18 and React DOM.
- Vite 5 plus the Vite React plugin.
- React Router DOM 6 with hash-based routing.
- Axios for API calls.
- Recharts for charts.
- Project-authored CSS and inline SVGs; no component UI framework.

### Local ports

| Process | Address |
|---|---|
| Spring Boot backend | `http://localhost:8086` |
| React/Vite development server | `http://localhost:5173` |
| SOAP WSDL | `http://localhost:8086/ws/central.wsdl` |
| Static frontend (if using a local static server) | Usually `http://localhost:5500` |

## 9. Run and test from Windows CMD

Prerequisites: Java 21 installed, and Node.js/npm installed for React. Open two
CMD windows from the repository.

**Window 1 — backend:**

```cmd
cd /d "D:\Documents\Hospital-management-new"
mvnw.cmd spring-boot:run
```

**Window 2 — React frontend:**

```cmd
cd /d "D:\Documents\Hospital-management-new\frontend-react"
npm install
npm run dev
```

Open `http://localhost:5173`. Keep both terminals open while using the app.
Vite forwards `/api` and `/ws` to the backend. For backend tests:

```cmd
cd /d "D:\Documents\Hospital-management-new"
mvnw.cmd test
```

For a production frontend bundle:

```cmd
cd /d "D:\Documents\Hospital-management-new\frontend-react"
npm run build
```

Vite writes the generated website to `frontend-react/dist/`.

## 10. Important API entry points

All REST paths are rooted at `/api`. Controllers define the complete route and
HTTP method; the list below describes the main resource areas:

| Resource base | Main purpose |
|---|---|
| `/api/hospitals` | Hospital registry and hospital queries. |
| `/api/departments` | Department management and hospital departments. |
| `/api/doctors` | Doctor records and doctor queries. |
| `/api/patients` | Patient registration, central-ID lookup, and history. |
| `/api/appointments` | Appointment search, booking, update, cancellation. |
| `/api/referrals` | Referral workflows. |
| `/api/beds` | Bed inventory and admit/discharge operations. |
| `/api/records` | Medical record workflows. |
| `/api/central` | Cross-hospital census, availability, and load aggregates. |

SOAP is rooted at `/ws`; use `/ws/central.wsdl` to inspect the published
contract. For exact endpoint methods/parameters, refer to the `@RequestMapping`
and `@*Mapping` annotations in each controller and the `@Endpoint` mappings in
`CensusEndpoint`.

## 11. Configuration, persistence, and deployment cautions

- Default `application.properties` uses `jdbc:h2:mem:central_hub`: the database
  is ephemeral and data is lost when the process stops.
- A persistent deployment needs a separately provisioned database and
  environment-based connection settings. Do not commit database passwords.
- The `prod` Spring profile is not a complete hosting configuration. For
  example, `application-prod.properties` currently binds to `127.0.0.1`, and
  the MySQL values are commented placeholders. Hosting may require a platform
  port and network binding configuration.
- `CorsConfig.java` currently allows local development origins. A deployed UI
  requires a narrowly scoped, exact HTTPS frontend origin; avoid `*`.
- The project is explicitly a synthetic-data demo. There is no production-grade
  authentication/authorization, despite demo login screens and demo role
  checks. Do not expose it with real patient information or treat UI guards or
  `X-Demo-*` headers as security controls.
- A production system would need proper identity/session/token handling,
  server-enforced authorization, TLS, secret management, database backups,
  audit controls, operational monitoring, and a security/privacy review before
  handling protected health information.

## 12. Suggested reading order for a new developer

1. Read this guide, then the root `README.md` for the longer product/API overview.
2. Read `pom.xml`, `HubApplication.java`, and the two application properties
   files to understand the backend stack and startup configuration.
3. Follow one feature end-to-end: its page in `frontend-react/src/pages/`,
   helper in `src/api/client.js`, controller, service, repository, and entity.
   Appointments or beds are good examples because they include business rules.
4. Read `GlobalExceptionHandler.java` and the feature's service tests to learn
   the error and expected-behavior conventions.
5. Read `App.jsx`, `AppContext.jsx`, `ProtectedRoute.jsx`, and
   `DemoAuthorizationFilter.java` to understand routing and demo identity
   behavior—and its security limitations.
6. Read `WebServiceConfig.java`, `central.xsd`, and `CensusEndpoint.java` only
   if integrating a SOAP client.
7. Use `DEMO-SEED.md` for sample data, expected local API responses, and
   synthetic-data workflow checks.
