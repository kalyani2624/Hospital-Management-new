# QA Report
Verdict: PASS
Date: 2026-10-02 (UTC+05:30) — PROJECT 6 Govt Hospital Hub — Re-check after fixes (H1 slot merge, M1-M5, L1-L8). QA boundary respected: TEST files + report only, app code read + built + live-probed, no source edits.

> Deep check: Backend `D:\API\Hospital Management System` (Spring Boot :8086, 26 tests) + Frontend-react `D:\API\Hospital Management System\frontend-react` (Vite :5173, HashRouter 22 routes). Fresh evidence: `mvn test` 26/26 PASS (22.994s), `npm run build` PASS 917 modules with lazy chunk-split (initial 428kB vs old 858kB single), live REST+SOAP probes on 127.0.0.1:8086 (reused PID 39660 `java -jar target/hospital-hub-0.0.1-SNAPSHOT.jar --server.port=8086`, H2 in-memory, QA rows hospitals=2/doctors=1/patients=1/appointments=1/referrals=1 — left running, no kill to avoid disrupting dev).

## Tests Run

### 1. Backend — `mvn test` — PASS (26/26)
- Workdir `D:\API\Hospital Management System`, cmd `& ".\mvnw.cmd" test`, result `Tests run: 26, Failures: 0, Errors: 0, Skipped: 0`, `BUILD SUCCESS Total time: 22.994 s Finished at: 2026-10-02T16:33:18+05:30`.
- Breakdown: `AppointmentServiceTest 2`, `BedServiceTest 4`, `CensusEndpointTest 2`, `CentralServiceTest 3`, `GlobalExceptionHandlerTest 7`, `HubApplicationTests 1`, `PatientServiceTest 3`, `ReferralServiceTest 4`.
- Log markers: `PatientService.create FAIL already exists`, `HospitalService.get FAIL hospital 999999 not found`, `ReferralService.refer FAIL must differ`, `NOTIFY: Referral`.

### 2. Frontend-react — `npm run build` — PASS (chunk-split verified)
- Workdir `frontend-react`, cmd `npm run build`, result `vite v5.4.21 building for production... 917 modules transformed. built in 9.22s`, exit 0.
- Outputs (fresh hash):
  - `dist/index.html 1.94 kB | gzip 0.94 kB`
  - `dist/assets/index-CLIImeiF.css 57.48 kB | gzip 10.89 kB`
  - `dist/assets/index-5oC-coLS.js 428.07 kB | gzip 127.18 kB` (initial, was 858kB single — ~50% leaner)
  - `dist/assets/PieChart-BVkzgv_t.js 400.93 kB | gzip 108.78 kB` (shared Recharts)
  - `dist/assets/Dashboard-BOpGpEtA.js 23.12 kB | gzip 7.88 kB` (lazy)
  - `dist/assets/Reports-CNIVAoLA.js 11.66 kB | gzip 4.50 kB` (lazy)
- `HashRouter` `App.jsx:1,37`, `vite.config.js:7-15` dev/preview `:5173 host 127.0.0.1 strictPort`, `chunkSizeWarningLimit 900`.
- L8 fix verified: `App.jsx:2,28-29,33,49,61` `lazy(Dashboard/Reports)` + `Suspense ChartFallback`. Citizen initial chunk no longer pulls Recharts.

### 3. Backend live REST+SOAP probes — PASS (fresh on PID 39660)
Reused existing `:8086` (started 16:25:15, `target/hospital-hub-0.0.1-SNAPSHOT.jar`). Poll `GET /api/central/census` `200 {"hospitals":2,...}` after QA rows. All via `Invoke-WebRequest http://127.0.0.1:8086`:

| # | Probe | Evidence |
|---|-------|----------|
| 3.1 | `GET /api/central/census` | `200 {"hospitals":2,"doctors":1,"patients":1,"appointments":1,"referrals":1,"totalBeds":1,"occupiedBeds":0}` |
| 3.2 | `GET /api/central/availability` | `200 []` (empty before beds seed, then 1 row after upsert) |
| 3.3 | `GET /api/hospitals?page=0&size=2` | `200` paged list |
| 3.4 | `GET /ws/central.wsdl` | `200 len~6312 hasCensus True` (WSDL lists getCentralCensus/HospitalLoad/DoctorSchedule) |
| 3.5 | CORS `GET /api/hospitals Origin:127.0.0.1:5173` | `ACAO=http://127.0.0.1:5173`, `X-Content-Type-Options=nosniff`, `X-Frame-Options=DENY` |
| 3.6 | `GET /api/hospitals/999999` | `404` |
| 3.7 | `POST /api/hospitals QA Hosp FIX2` | `201 id=1 {"name":"QA Hosp FIX2","city":"Thane","type":"DISTRICT","totalBeds":50}` |
| 3.8 | `POST /api/hospitals QA Hosp B` | `201 id=2 CENTRAL 30 beds` |
| 3.9 | `GET /api/central/hospitals/1/load` | `200 {"hospitalId":1,"hospitalName":"QA Hosp FIX2","doctors":0,"appointments":0,"totalBeds":0,"occupiedBeds":0}` len=106 |
| 3.10 | `POST /api/patients CENT-QA-FIX2` | `201 {"centralId":"CENT-QA-FIX2","name":"QA Patient","id":1}` |
| 3.11 | `POST /api/patients` duplicate | `409` |
| 3.12 | `POST /api/doctors Dr QA2 General hosp1` | `201 id=1` |
| 3.13 | `GET /api/doctors?hospitalId=1` | `200 [Dr QA2]` |
| 3.14 | `POST /api/appointments/book future 2026-10-04T16:34:54` | `201 {"status":"BOOKED","id":1}` |
| 3.15 | `POST /api/appointments/book` same slot | `409` |
| 3.16 | `POST /api/appointments/book` past `2020-01-01` | `400` |
| 3.17 | `PUT /api/appointments/1/cancel` | `200 CANCELLED` |
| 3.18 | `POST /api/referrals {1->2}` | `201 PENDING id=1` |
| 3.19 | `PUT /api/referrals/1/accept` | `200 ACCEPTED` |
| 3.20 | `POST /api/referrals {1->1}` | `400 must differ` |
| 3.21 | `POST /api/beds {1 ICU total:1}` | `201 available:1` |
| 3.22 | `POST /api/beds/admit` | `200 occupied:1 available:0` |
| 3.23 | `POST /api/beds/admit` full | `409` |
| 3.24 | `POST /api/beds/discharge` | `200 occupied:0` |
| 3.25 | `POST /api/records Viral fever` | `201` |
| 3.26 | `GET /api/patients/1/history` | `200 len=1736` |
| 3.27 | `GET /api/records/patient/1` | `200 len=613` |
| 3.28 | SOAP `POST /ws getCentralCensus` clean XML | `200 hasHospitals=True len=450 <ns2:hospitals>2</...>` |
| 3.29 | SOAP `POST /ws getHospitalLoad id=1` | `200 hasName=True <ns2:hospitalName>QA Hosp FIX2</...>` |
| 3.30 | SOAP `POST /ws getDoctorSchedule id=1` | `200 hasSched=True patientCentralId present` (proves join-fetch fix) |
| 3.31 | SOAP malformed (escaped `\"`) | `400` correctly (validates envelope) |

### 4. Frontend static checks — PASS
- `dangerouslySetInnerHTML`: 0 hits. `innerHTML`: 0 hits. `esc()` `client.js:22-29` + `csvCell` quoting — PASS.
- `localhost`: 5 hits only — `client.js:5` comment, `:7` regex + `:8` dev fallback (code, not UI), `Help.jsx:29,31` comment + regex guard. Citizen UI 0 hardcoded `localhost:8086` strings — PASS.
- `tel:` 22 hits: `PublicChrome 108/102/14555`, `Emergency 108/102/14555/1800114477`, `Doctors Call 102`, `Hospitals/HospitalDetail/Landing 108`, `Help helplines`, `Appointments 108` — PASS.
- Skeletons/toasts: `ui.jsx:117-136 Skeleton/SkeletonCards`, every async page `Skeleton`, `AppContext pushToast` + `Layout toast-region aria-live` + ticker `aria-live polite` — PASS.
- Command Bar `/`: `Layout.jsx:108-114` `/` focus, `Esc` close, `centralid-search` + Recent-5 + ticker occupancy/pending + Live Pause — PASS.
- Role filter: `NAV_SECTIONS roles` + `filter roles.includes`, `beds SuperAdmin/HospitalAdmin/Receptionist`, `records SuperAdmin/Doctor`, `403 panel`, `lockedHospitalId + scope banner` — PASS.
- Dark mode: `hub.theme + data-theme`, `global.css:79-117` tokens, `Settings Light/Dark/System`, avatar toggle — PASS.
- Responsive: `global.css` 50+ queries, `kpi-grid/doc-grid/bed-matrix/kanban/hero/auth-split`, `table-scroll + sticky thead`, `clamp()`, 44px targets — PASS (manual resize still owed).
- Contrast AA: `global.css:1-4` claims AA, `:26` `--color-success #047857` (5.48:1), `:328-330` `.btn-cta bg var(--color-success)` + comment `old #059669 3.77 large-only`. Spot: `muted #475569 ~7.5`, `text #0F172A ~17`, `white on #0E7490 ~5.3`, `white on #B91C1C ~6.4`, focus 3px + reduced-motion + skip-links — PASS (axe run still owed, see risks).

## Per-Page Verdict Table (HashRouter `App.jsx:39-78`)

| Route / Surface | File | Requirement | Verdict | Evidence |
|---|---|---|---|---|
| `#/` Landing | `Landing.jsx` | hero + booking widget + stats + PMJAY + services + FAQ | PASS | Hero mesh, `book-widget` dept map + 7-day chips → `/appointments?hospitalId&dept&date`, count-up, scheme-band, FAQ JSON-LD. No localhost UI. |
| `#/hospitals` | `Hospitals.jsx:31-75,158` | list + filters + load + create + truthful paging | PASS (M3 FIXED) | `listHospitals()` no args → full registry (backend `HospitalController:35-36` no-params full list), filter client-side, `paged slice(safePage*size)`, `hasMore=(safePage+1)*size<filtered.length`, count `X matches — showing A–B`. Live `?page&size` + `load` verified. |
| `#/hospitals/:id` | `HospitalDetail.jsx:29-36,71` | detail + tabs + load + edit | PASS | Gradient header + `LoadLight` + `load.doctors/appointments`, tabs, staff edit gated, Book/Call, 404 `ErrorBanner`. |
| `#/doctors` | `Doctors.jsx:47-75,136-142,149` | filters + slots + post + avail=1 works + estimated label | PASS (M1+M2 FIXED) | `filtered` checks `q` + `availOnly→hasFreeSlotToday` `:51`, `slotStrip(seed)` `:66-71` with `n%9==8 fully-booked` so filter testable, `hasFreeSlotToday` `:73-75`. Cards: `Next available: Today/Tomorrow (estimated) ⓘ Estimated` `:136`, `TODAY · Estimated demo pill` `:138`, slot `aria-label available (estimated)` `:140`, `Demo pattern — live slot confirmed` `:142`, hint `:93`. Backend has no slot API — label explicit, booking 409-safe. |
| `#/patients` | `Patients.jsx:27-31,35-48,50-67` | centralId search + register + registry | PASS | Mono search + `No record → Register`, `409 already exists → Open existing`, `Pagination`. Live 201/409/history verified. |
| `#/patients/:centralId` | `PatientDetail.jsx` | history timeline + filter + copy | PASS | Header + copy, unified `appointments+records+referrals` desc, filter pills, `StatusPill`. Live history len 1736. |
| `#/appointments` wizard + 409 | `Appointments.jsx:83-88,124-131,135-163,214-247,254-271` | 3-step + slots feed payload + 409 recovery + diary | PASS (H1 FIXED) | `effectiveWhen = selSlot ? date+TselSlot : when` `:85-88`, `pickSlot(t) setSelSlot + setWhen(date+T)` `:125-131`, `submitBook` uses `effectiveWhen→fromLocalInput→iso` `:138,148`, past guard on `effectiveWhen` `:139`, summary `When: effectiveWhen · slot selSlot` `:233`, side `When: effectiveWhen` `:268`, slot `title Selected — booking will use date T` `:217`, hint `:220`, datetime-local sync `:236`, calendar preserves slot `:258`. Live 201/409/400/cancel verified. |
| `#/referrals` kanban + table | `Referrals.jsx:20-21,93,114-143,155` | drag PENDING→ACCEPTED + table + triage + persist view | PASS (L4 FIXED) | `useState(()=>localStorage hub.refView)` `:21`, toggle persists `:93`, kanban 3 cols draggable PENDING + ACCEPTED→accept + COMPLETED guard, Table SR, `from==to` guard + backend 400, `Pagination`. Live PENDING→ACCEPTED verified. |
| `#/beds` matrix + undo | `Beds.jsx:48-74,143-145` | occupancy board + admit/discharge + undo + per-row busy | PASS (L6 FIXED) | `% ring + LoadLight + Available/Tight/Full` labels, admit disabled when full, tight confirm, optimistic + rollback, Undo 30s, upsert gated. Per-row `disabled={busy===key}` `:144-145` (was global). Live admit/discharge/full-409 verified. |
| `#/records` gated | `Records.jsx:73-75,87,91,95,101-105,108` | Doctor-gated + all inputs disabled + SOAP label + timeline | PASS (L5 FIXED) | Warn + blur overlay `:87`, templates `disabled` `:91`, patient/hospital/doctor selects `disabled={!can.writeRecords} aria-disabled` `:95,101-102`, diagnosis/prescription `disabled` `:104-105`, save gated `:108`. Timeline + `View in timeline`. Live 201 + byPatient verified. Template `SOAP:` prefix doubles as SOAP badge hint, full WSDL badge lives in Reports/Help by design. |
| `#/reports` CSV + SOAP | `Reports.jsx:48-49,73-79,150-166,182-196` | citizen cards + staff CSV + SOAP badge | PASS (L1 FIXED) | Citizen Lab/Blood/OPD + live availability PASS, staff 4 CSVs + bar/donut + audit PASS. SOAP badge: `soap state` `:49`, `getSoapStatus probe staff-only` `:74-79`, `Interop & audit` section `:182-196` with `SOAP checking… / WSDL status bytes / unreachable` pills + `getCentralCensus·HospitalLoad·DoctorSchedule` + link `Help→Runbook`. Live WSDL 200 proven. |
| `#/emergency` tel | `Emergency.jsx:23-26,60` | no-login + tel + casualty | PASS | `108/102/14555/1800-11-4477 tel:` + Call buttons, 5-min steps, casualty `tel:108`, Skeleton. |
| `#/schemes` PMJAY | `Schemes.jsx` | ₹5L + steps + links + FAQ | PASS | KPIs ₹5L/36k/45.5Cr/14555, 3 steps, NHA/ABHA/ORS links, anti-agent warn, FAQ, `tel:14555`. |
| `#/login` | `Login.jsx` | validation + guards + next | PASS | Role chips, regex name/email/role/hospital/centralId, hospital required unless SuperAdmin, `?next=` preserved. |
| `#/signup` | `Signup.jsx:15-18,29-37,50-64,118-122` | hospital + staff tabs + 201/409 + 1:1 payload | PASS (M4 FIXED) | `hForm {name,city,type,totalBeds}` only `:18` (address/phone removed), comment `:15-17`, `validateHospital 1–5000` `:29-37`, `createHospital({name,city,type,totalBeds})` `:57` 1:1 to `Hospital.java`, hint `Address/phone managed at desk` `:121`. Staff `MH-YYYY-XXXXXX` regex + 201/409 recovery. Live 201 omits dropped fields by design. |
| `#/forgot` | `Forgot.jsx` | email validation + sent | PASS | Empty + regex guards, success + demo note + login link. |
| `#/dashboard` KPIs + charts | `Dashboard.jsx` | 6 KPIs + 4 charts + alerts | PASS (L8 lazy) | `KpiCard 6` + Bar/Area/Pie + funnel + alerts + `<details> data table`, 60s refresh, `SkeletonCards`. Lazy chunk `Dashboard-BOpGpEtA.js 23kB` + shared `PieChart 400kB`. |
| `#/profile` | `Profile.jsx` | session + edit + recent | PASS | Gradient + role pill + hospital/centralId, KPIs, Recent-5, sessions + Revoke, logout, edit persists. |
| `#/settings` | `Settings.jsx` | theme/density/contrast/lang | PASS | Theme/Dark/System + density + high-contrast + EN/HI + preview, toggles, shortcuts, Reset + Clear Recent-5. |
| `#/help` | `Help.jsx:29-33,91-108` | FAQ + helplines + runbook no localhost citizen | PASS (L2 FIXED) | Searchable FAQ, `tel:` helplines, portals. Runbook: `isLocalBase` `:31`, `displayBase='' when public+local` `:32`, `wsdlHref=/ws/central.wsdl relative` `:33`, public note `relative paths + Staff login reveals origins` `:93`, `displayBase/api + /ws` `:96,103`, relative WSDL link `:107`. Citizen sees `/api/... /ws/...`, staff sees full `WS_BASE`. |
| `#/404` + `*` | `NotFound.jsx` + `App.jsx:76-77` | 404 + recovery | PASS | `404` art + pathname echo + landing/dashboard + CentralId search. `*` catches. |
| Public chrome | `PublicChrome.jsx:23-179` | strip + gov + header + megafooter | PASS | `EmergencyStrip 108/102/14555 + Call/WhatsApp + EN/HI/MR + A-/A/A+ + contrast`, `GovStrip`, `PublicHeader`, `MegaFooter`. 0 localhost strings. |
| Staff chrome | `Layout.jsx:200-211,317-319` | sidenav + topbar + cmdbar + footer env-aware | PASS (L3 FIXED) | Sidenav rail/collapse + role nav + pending badge + user-chip, topbar LIVE + search + notifs + avatar + scope banner + Breadcrumbs, cmdbar CentralId + ticker, footer. `sidenav-note Central DB + SOAP /ws + API {API_BASE} + SOAP {WS_BASE}` `:210` (was hardcoded localhost), footer `API {API_BASE}` `:318`. No hardcoded `http://localhost:8086/api`. `API_BASE` from `client.js:8` env-aware. |
| API client | `client.js:6-10,64-74` | VITE_API_BASE + SOAP probe + CSV | PASS (M5 FIXED) | `envBase=VITE_API_BASE` `:6`, `isDev=DEV||hostname localhost` `:7`, `API_BASE=envBase||(isDev?localhost:8086/api:/api)` `:8` — prod fallback relative `/api` (was localhost), `WS_BASE` derived `:10`, `getSoapStatus WSDL probe` `:67-74` used by Reports badge. Comment documents fix `:4-5`. |
| Contrast AA | `global.css:1-4,9-10,26,328-330` | AA normal text | PASS (L7 FIXED) | Base `#047857 5.48:1` `:26`, `.btn-cta bg var(--color-success)` `:328` + comment `old #059669 3.77 large-only` `:329`, hover `emerald-dark` `:330`. Prior audit 10/11 ≥4.5 + muted ~7.5. Focus 3px + reduced-motion + skip-links. Axe run still owed. |
| Chunk split | `App.jsx:28-29 + dist/` | initial lean + lazy charts | PASS (L8 FIXED) | Was single `858kB gzip 243kB`. Now `index 428kB gzip 127kB` + `PieChart 400kB` shared + `Dashboard 23kB` + `Reports 11kB`. Citizen landing/hospitals/doctors load without Recharts. |

## Bugs Found (severity: critical/high/medium/low, file:line)
- No open HIGH/MEDIUM. H1, M1-M5 verified FIXED (see table). No critical (crash/data-loss/breach) open.
- No open LOW. L1-L8 verified FIXED:
  - L1 Reports SOAP badge `Reports.jsx:48-49,73-79,182-196` — live `WSDL 200` pill + ops list.
  - L2 Help localhost `Help.jsx:29-33,93,96,103,107` — public relative, staff full.
  - L3 Layout localhost `Layout.jsx:4,210,318` — interpolates `API_BASE/WS_BASE`.
  - L4 RefView persist `Referrals.jsx:20-21,93` — initializer reads `hub.refView`.
  - L5 Records disabled `Records.jsx:87,91,95,101-105` — all inputs `disabled + aria-disabled` + overlay.
  - L6 Beds per-row `Beds.jsx:144-145` — `busy===key` per row.
  - L7 Contrast `global.css:26,328-330` — base `#047857 5.48 PASS`.
  - L8 Chunk split `App.jsx:28-29 + dist 5 chunks` — initial 428kB (was 858kB).
- Residual polish (informational, not gating):
  - `PieChart-BVkzgv_t.js 400kB` shared chunk still large — consider `recharts` treeshake or `manualChunks vendor` if it grows; currently under 900 warn limit.
  - `dist` hash changed (`CLIImeiF/5oC-coLS/CNIVAoLA/BOpGpEtA/BVkzgv_t`); serve via `preview --port 5173` with backend `:8086` or numbers stay skeletons by design.

## Regression Risks
- H2 in-memory: QA rows `QA Hosp FIX2/CENT-QA-FIX2/Dr QA2` live in PID 39660 only; restart wipes. Before manual E2E re-seed or reuse `MH-2026-004213`. Frontend degrades to skeletons + `ErrorBanner` + `Backend unreachable` by design (`catch(()=>[])`).
- Demo auth `localStorage hub.auth` client-only; server has no JWT. `can.*` mock. Do not treat role gates as security — backend must enforce RBAC before prod.
- 409 contract via `toApiError status/message` (`client.js:32-41`); backend message rename breaks recovery copy. Keep `GlobalExceptionHandlerTest + AppointmentServiceTest` green.
- `size` cap 20 server-side (`HospitalController:39` + all list controllers); frontend `hasMore=rows>=size` heuristic — exact-multiple pages show spurious Next. `Hospitals.jsx` now client-paginates full list (no-params full), others still server-paged. Add `X-Total-Count` if registry >200.
- Charts + `useCountUp` animate on mount; axe/Lighthouse + keyboard (`/`, `Esc`, skip-links) + SR walkthrough still owed before release.
- Backend `open-in-view true` + `H2 mem` + `server.address 127.0.0.1` are demo guardrails (`application.properties`), prod uses `application-prod.properties` MySQL + `ddl-auto=validate`.
- Chain gate: `qa-report PASS (fresh) → code-review APPROVED (fresh) → security-audit PASS (fresh)`; stale PASS (older than code) = FAIL. Report path for loop: `D:\API\Hospital Management System\.ai\reports\qa-report.md` (this file).

Report path: `D:\API\Hospital Management System\.ai\reports\qa-report.md`

---

# QA Report — Seed Demo Data Verification (2026-10-08 UTC)
Verdict: PASS
Scope: `D:\API\Hospital Management System` DemoDataLoader (`@Profile("!test")`) — reviewer walkthrough per `DEMO-SEED.md`. QA boundary respected: TEST files + report only, app code read + built + live-probed, no source edits.

## Tests Run
### 1. `mvn test` hermetic 26/26 — PASS
- Cmd: `.\mvnw.cmd test` in `D:\API\Hospital Management System`
- Result: `Tests run: 26, Failures: 0, Errors: 0, Skipped: 0` — `BUILD SUCCESS`
- Breakdown: `AppointmentServiceTest 2, BedServiceTest 4, CensusEndpointTest 2, CentralServiceTest 3, GlobalExceptionHandlerTest 7, HubApplicationTests 1, PatientServiceTest 3, ReferralServiceTest 4`
- Hermetic guard verified:
  - `src/main/java/gov/hospital/hub/config/DemoDataLoader.java:44-46` — `@Profile("!test")` + `@ConditionalOnProperty(name="hub.seed-demo", havingValue="true", matchIfMissing=true)`
  - `src/test/resources/application.properties:4` — `hub.seed-demo=false` (actual guard since tests run on default profile)
  - `src/main/resources/application.properties` — no `hub.seed-demo` key → `matchIfMissing=true` → seed ON for fresh boot, OFF for tests. Correct.
- No seed leakage in tests: `HubApplicationTests` boots JPA/H2 without `Demo seed done` hospitals=3; test logs show only QA-row failures (`PatientService.create FAIL already exists`, `HospitalService.get FAIL 999999`, `ReferralService.refer FAIL must differ`) — expected negative-path coverage.

### 2. Boot census fresh — PASS (before QA mutation)
- Live boot probed at `http://127.0.0.1:8086` (pre-existing java PIDs 7996/17928/31452/34656, H2 `central_hub`, started 09:33–09:46, still serving during QA)
- `GET /api/central/census` → `200 {"hospitals":3,"doctors":6,"patients":8,"appointments":6,"referrals":2,"totalBeds":575,"occupiedBeds":322}` — exact match to `DEMO-SEED.md` fresh-boot expectation.
- After QA book probe (id 7 CANCELLED) census is `{"hospitals":3,"doctors":6,"patients":8,"appointments":7,"referrals":2,"totalBeds":575,"occupiedBeds":322}` — +1 is QA-created cancelled row, not seed drift. Fresh restart would return to 6.
- Cross-checks:
  - `GET /api/hospitals` (no params) → 3 rows: AIIMS Delhi CENTRAL 500 (id1), Safdarjung DISTRICT 300 (id2), RML CENTRAL 250 (id3) — all Delhi.
  - `GET /api/doctors?page=0&size=20` → 6 rows ids 1..6 (Meera/Kabir/Vikram/Priya/Amit/Sunita) matching `seedDoctors` order.
  - `GET /api/patients?page=0&size=20` → 8 rows CENT-001..008 ids 1..8 phones 9876500001..08.
  - `GET /api/central/availability` → 3 hospitals with wards GENERAL+ICU each, totals 250/180/145, occupied 150/102/70 — consistent with `seedBeds` (200/120 +50/30, 150/90 +30/12, 120/60 +25/10).
  - `GET /api/referrals` → 2 rows: id1 ACCEPTED (CENT-001 AIIMS→Safdarjung Cardiology review), id2 PENDING (CENT-005 RML→AIIMS Ortho opinion) — proves PENDING→ACCEPTED path.
  - `GET /api/doctors/hospital/1/departments` → 2 rows Cardiology(id1)+General Medicine(id4); `/hospital/2` → Orthopaedics — 4 depts total per spec.

### 3. CENT-001 lookup — PASS
- `GET /api/patients/central/CENT-001` → `200 {"centralId":"CENT-001","name":"Asha Patil","age":34,"gender":"F","phone":"9876500001","registeredHospital":{"name":"AIIMS Delhi",...,"id":1},"id":1}` — stable id 1.

### 4. History + records — PASS
- `GET /api/patients/1/history` → `200` with `patient CENT-001` + `appointments[1 BOOKED 2026-10-10T10:00:00 Dr Meera]` + `medicalRecords[1 Hypertension review / Amlodipine 5mg OD visit 2026-09-28]` + `referrals[1 ACCEPTED]` — unified timeline present.
- `GET /api/records/patient/1` → `200` 1 row Hypertension review (of 3 total records: Hypertension, Type2 Diabetes, Fracture follow-up per `seedRecords`).

### 5. Book 201 → 409 → cancel — PASS
- Free slot per `DEMO-SEED.md`: doctor 1 at `+9d 10:00:00` (`2026-10-17T10:00:00`, never seeded; base is +2d, seeded slots +0..+3d):
  - `POST /api/appointments/book {"patientId":7,"doctorId":1,"hospitalId":1,"appointmentTime":"2026-10-17T10:00:00"}` via file `@$env:TEMP\book.json` (avoids inline quoting 400) → `201 {"id":7,"status":"BOOKED","patient CENT-007 Divya Reddy",...}` — second precision, @Future valid, UNIQUE(doctor,time) respected.
  - Same POST again → `409 {"status":409,"error":"Conflict","message":"doctor 1 already booked at 2026-10-17T10:00",...}` — exact contract.
  - `PUT /api/appointments/7/cancel` → `200 {"id":7,"status":"CANCELLED"}` — diary cleanup works.

### 6. Beds admit/discharge — PASS
- `POST /api/beds/admit?hospitalId=1&wardType=General` → `200 {"wardType":"GENERAL","total":200,"occupied":121,"available":79}` (120→121)
- `POST /api/beds/discharge?hospitalId=1&wardType=General` → `200 {"total":200,"occupied":120,"available":80}` (121→120)
- `GET /api/beds/hospital/1` → GENERAL 200/120 + ICU 50/30 — `occupied<total and >0` guard holds so both 200s succeed.
- `GET /api/beds/hospital/1` version bump 0→1→2 confirms optimistic locking path exercised without conflict.

### 7. Frontend shows seeded data — PASS
- `frontend-react` Vite `5.4.21` + `npm run build` → `PASS 917 modules transformed, built in 9.01s`, chunks `index-5oC-coLS.js 428kB / PieChart 400kB / Dashboard 23kB / Reports 11kB / index-CLIImeiF.css 57kB` — same hashes as prior PASS, no regression.
- `src/api/client.js:8` — `API_BASE=envBase||(isDev?localhost:8086/api:/api)` dev fallback to `:8086`, prod relative `/api`; `WS_BASE` derived. No hardcoded localhost in citizen UI.
- Wiring to seeded endpoints verified by grep:
  - `Dashboard.jsx:25` `getCensus()+getAvailability()+listAppointments()+listReferrals()` → census cards + occupancy.
  - `Landing.jsx:68` `getCensus()` → hero stats (would show 3/6/8).
  - `PatientDetail.jsx:23` `getPatientByCentralId(centralId)` → CENT-001 page; `Patients.jsx:41` same for search.
  - `Appointments.jsx:149` `bookAppointment({patientId,doctorId,hospitalId,appointmentTime})` → 201/409 UI; `Beds.jsx:54,72` `admitBed/dischargeBed` → matrix.
  - `HospitalDetail.jsx:29` `getHospital+getHospitalLoad+bedsByHospital+listDoctors` → detail tabs.
- Live API backing those pages returns seeded rows (see §2–6), so frontend `dev --port 5173 --host 127.0.0.1` / `preview` against `:8086` will render AIIMS/Safdarjung/RML, CENT-001..008, 6 doctors, referrals kanban (1 ACCEPTED + 1 PENDING). No mock fallback needed. Full browser screenshot walkthrough still owed (see risks) but contract is proven.

## Bugs Found (severity: critical/high/medium/low, file:line)
- No new bugs. All seed counts stable, IDs 1..n in fixed save order on H2 mem, MySQL idempotent skip (`hospitals.count()>0` + `CENT-001` guard `DemoDataLoader.java:77-84`) intact.
- Informational only (not gating, carry from prior report):
  - Census `appointments` is 7 post-QA (includes CANCELLED id7); fresh boot is 6. Not a bug —AÇÃO document for reviewer rerun: restart boot to see 6, or filter BOOKED.
  - `GET /api/doctors` without `?page&size` returns single row (paged default) — frontend always passes `hospitalId` or `page/size`, and `GET /api/hospitals` without params returns full list by design. No change needed.

## Regression Risks
- H2 in-memory: seed lives in running JVM only; restart wipes including QA id7. MySQL restart skips seed when hospitals exist — reviewer must drop DB for fresh 3/6/8/6/2.
- Midnight rollover guard in `seedAppointments` (`DemoDataLoader.java:162-164`) keeps slots future-dated; if CI clock skews, @Future 400 could flake — monitor.
- 409 message `doctor 1 already booked at ...` is UI-facing (`toApiError`); renaming breaks `Appointments.jsx` recovery copy. Keep `GlobalExceptionHandlerTest + AppointmentServiceTest` green.
- Frontend `dist` hashes pinned (`CLIImeiF/5oC-coLS/CNIVAoLA/BOpGpEtA/BVkzgv_t`); serve via `preview --port 5173` with backend `:8086` or pages show skeletons by design (`catch(()=>[])`).
- Chain gate: `qa-report PASS (fresh) → code-review APPROVED (fresh) → security-audit PASS (fresh)`; stale PASS = FAIL. This report path: `D:\API\Hospital Management System\.ai\reports\qa-report.md`.

Report path: `D:\API\Hospital Management System\.ai\reports\qa-report.md`
