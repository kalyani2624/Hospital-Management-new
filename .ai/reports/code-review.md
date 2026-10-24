# Code Review
Verdict: APPROVED

> PROJECT 6 Govt Hospital Hub — Final sign-off deep check 2026-10-02 after H1/M fix.
> Inputs read: `.ai/reports/qa-report.md` Verdict PASS (26/26 + build 917 modules) dated 2026-10-02 re-check after H1 slot merge, M1-M5, L1-L8. Plus direct source sampling this review: `frontend-react/src/App.jsx`, `src/api/client.js`, `src/pages/Appointments.jsx:83-88,124-131`, `src/pages/Doctors.jsx:47-75`, `src/pages/Hospitals.jsx:31-75`, `src/pages/Reports.jsx:48-49,73-79,182-196`, `src/pages/Help.jsx:29-33`, `src/components/Layout.jsx:210,318`, `src/pages/Beds.jsx:143-145`, `src/pages/Records.jsx:87-108`, `src/pages/Referrals.jsx:20-21,93`, `src/pages/Signup.jsx:15-18,57`, `src/styles/global.css:1-4,26,328-330`, `src/pages/Landing.jsx`, `src/pages/Dashboard.jsx:1-60`, `src/main/java/gov/hospital/hub/config/CorsConfig.java:23-35`.
> Review-only boundary respected: no source edits. No fixes implemented.

## QA Report Consumed
- QA Verdict PASS accepted — `mvn test` 26/26 PASS (22.994s: Appointment 2, Bed 4, CensusEndpoint 2, Central 3, GlobalExceptionHandler 7, HubApplicationTests 1, Patient 3, ReferralService 4), `npm run build` PASS 917 modules 9.22s, initial 428kB gzip 127kB (was 858kB single) + PieChart 400kB shared + Dashboard 23kB + Reports 11kB lazy.
- Live REST+SOAP probes PASS on PID 39660 :8086 — census 2/1/1/1/1, availability, paged hospitals, WSDL 6312 bytes, CORS ACAO 127.0.0.1:5173 + nosniff + DENY, 404/201/409/400/cancel/accept/must-differ/admit-full-discharge/history-1736 + SOAP census/load/schedule all 200, malformed 400.
- Zero open HIGH/MEDIUM per QA §Bugs Found. H1, M1-M5, L1-L8 all verified FIXED. Agree — no re-file.

## Per-Page Verdict Table — Confirm All PASS (HashRouter App.jsx:39-78)
| Route / Surface | File | Requirement | Verdict | Evidence (this review) |
|---|---|---|---|---|
| `#/` Landing | `Landing.jsx` | hero + booking widget + stats + PMJAY + services + FAQ | PASS | Hero mesh + orbs + book-widget dept map + 7-day chips → `/appointments?hospitalId&dept&date`, count-up, scheme-band ₹5L, FAQ JSON-LD. No localhost UI. |
| `#/hospitals` | `Hospitals.jsx:31-75,158` | list + filters + load + truthful paging | PASS (M3 FIXED) | `listHospitals()` no args full registry, client filter + `paged slice(safePage*size)`, `hasMore` truthful, count `X matches — showing A–B`. |
| `#/hospitals/:id` | `HospitalDetail.jsx` | detail + tabs + load + edit | PASS | QA live `load id=1` 200 len 106 + gradient header + LoadLight. No drift. |
| `#/doctors` | `Doctors.jsx:47-75,136-142` | filters + avail=1 + estimated label | PASS (M1+M2 FIXED) | `availOnly→hasFreeSlotToday` :51, `slotStrip n%9==8` testable, `Next available (estimated) ⓘ` + `TODAY · Estimated demo pill` + `Demo pattern — live slot confirmed`. Booking 409-safe. |
| `#/patients` | `Patients.jsx` | centralId search + register + 409 | PASS | QA live 201 CENT-QA-FIX2 + duplicate 409. |
| `#/patients/:centralId` | `PatientDetail.jsx` | history timeline + filter + copy | PASS | QA live history len 1736. |
| `#/appointments` wizard + 409 | `Appointments.jsx:83-88,124-131,135-163` | 3-step + slot merges + 409 recovery | PASS (H1 FIXED) | `effectiveWhen = selSlot ? date+TselSlot : when` :85-88, `pickSlot merges into when` :125-131, summary + payload both use `effectiveWhen`, 201/409/400/cancel live verified. Slot title `Selected — booking will use date T`. |
| `#/referrals` kanban + table | `Referrals.jsx:20-21,93` | drag PENDING→ACCEPTED + persist view | PASS (L4 FIXED) | `useState(()=>localStorage hub.refView)` :21, toggle persists :93, kanban 3 cols + from==to guard + backend 400. Live PENDING→ACCEPTED. |
| `#/beds` matrix + undo | `Beds.jsx:143-145` | occupancy + per-row busy + undo | PASS (L6 FIXED) | Per-row `disabled={busy===key}` :144-145 (was global), % ring + LoadLight + Tight/Full labels, optimistic + rollback + Undo 30s. Live admit/discharge/full-409. |
| `#/records` gated | `Records.jsx:87,91,95,101-105,108` | Doctor-gated + all disabled | PASS (L5 FIXED) | Warn + blur overlay :87, templates + selects + diagnosis/rx all `disabled + aria-disabled`, save gated :108. Live 201 + byPatient. SOAP prefix doubles as badge hint by design. |
| `#/reports` CSV + SOAP | `Reports.jsx:48-49,73-79,182-196` | citizen cards + staff CSV + SOAP badge | PASS (L1 FIXED) | `soap state` :49, `getSoapStatus staff-only probe` :74-79, `Interop & audit` pills `checking / WSDL bytes / unreachable` + ops list + Help link. Live WSDL 200. |
| `#/emergency` tel | `Emergency.jsx` | no-login + tel + casualty | PASS | QA: 108/102/14555/1800-11-4477 tel + 5-min steps. 21 page files present (glob 21). |
| `#/schemes` PMJAY | `Schemes.jsx` | ₹5L + steps + links | PASS | QA: KPIs + 3 steps + NHA/ABHA/ORS + tel:14555. |
| `#/login` | `Login.jsx` | validation + guards + next | PASS | QA: role chips + regex + hospital required + ?next= preserved. |
| `#/signup` | `Signup.jsx:15-18,29-37,57` | hospital 1:1 payload + staff 201/409 | PASS (M4 FIXED) | `hForm {name,city,type,totalBeds}` only :18 + comment :15-17, `validate 1-5000` :29-37, `createHospital 1:1` :57, hint `Address/phone at desk`. Staff MH-YYYY-XXXXXX + 201/409. |
| `#/forgot` | `Forgot.jsx` | email validation + sent | PASS | QA: empty + regex guards + success + demo note. |
| `#/dashboard` KPIs + charts | `Dashboard.jsx` | 6 KPIs + 4 charts + alerts | PASS (L8 lazy) | `KpiCard 6` + Bar/Area/Pie + funnel + alerts + details table, 60s refresh + hidden guard. Lazy `Dashboard-BOpGpEtA 23kB` + shared PieChart. Sampled :1-60 wiring intact. |
| `#/profile` | `Profile.jsx` | session + edit + recent | PASS | QA: gradient + role pill + Recent-5 + Revoke + edit persists. |
| `#/settings` | `Settings.jsx` | theme/density/contrast/lang | PASS | QA: Light/Dark/System + density + high-contrast + EN/HI + preview + Reset. |
| `#/help` | `Help.jsx:29-33,93,96,103,107` | FAQ + runbook no localhost citizen | PASS (L2 FIXED) | `isLocalBase` :31, `displayBase=''` public :32, `wsdlHref relative` :33, public note + `displayBase/api + /ws` :96,103 + relative WSDL :107. |
| `#/404` + `*` | `NotFound.jsx + App.jsx:76-77` | 404 + recovery | PASS | 404 art + pathname echo + landing/dashboard + CentralId search. |
| Public chrome | `PublicChrome.jsx` | strip + gov + megafooter | PASS | QA: EmergencyStrip 108/102/14555 + GovStrip + 0 localhost. |
| Staff chrome | `Layout.jsx:210,318` | sidenav + cmdbar + footer env-aware | PASS (L3 FIXED) | `sidenav-note API {API_BASE} + SOAP {WS_BASE}` :210, footer `API {API_BASE}` :318. No hardcoded localhost:8086. Verified this review. |
| API client | `client.js:6-10,64-74` | VITE_API_BASE + SOAP probe + CSV | PASS (M5 FIXED) | `envBase` :6, `isDev` :7, `API_BASE=envBase||(isDev?localhost:/api)` :8 prod relative, `WS_BASE` derived :10, `getSoapStatus` :67-74. Verified. |
| Contrast AA | `global.css:1-4,26,328-330` | AA normal text | PASS (L7 FIXED) | Base `#047857 5.48:1` :26, `.btn-cta bg var(--color-success)` :328 + comment old 3.77 :329. Verified. |
| Chunk split | `App.jsx:28-29 + dist/` | initial lean + lazy | PASS (L8 FIXED) | `lazy(Dashboard/Reports)` :28-29 + Suspense fallback :32, initial 428kB vs 858kB. Verified. |

## Backend + Frontend Wiring Intact — PASS
- Frontend `App.jsx:1,37` HashRouter, 22 routes (public + auth + staff + 404/*), `AppProvider` wrap, lazy charts with ChartFallback.
- `client.js` full REST surface intact: central/census+availability+load+SOAP probe, hospitals CRUD, doctors + departments, patients + history, appointments book/cancel, referrals create/accept, beds list/byHospital/upsert/admit/discharge, records byPatient/create + `loadOf/displayName/hospitalNameOf` helpers + `esc/csvCell/toApiError`.
- Backend `CorsConfig.java:23-35` `/api/**` allowlist 3000/5173/5500 + 127 variants + null, no `*`, verified this review. QA live probes prove wiring: census/availability/paged/SOAP WSDL/CORS headers/404/201/409/400/cancel/accept/must-differ/admit-full/discharge/history + SOAP 3 ops.
- No backend drift: 26/26 breakdown matches baseline.

## Premium Theme Intact — PASS
- `global.css:1-4` DESIGN V2 Premium tokens-first, Deep Navy #0B2A4A + Teal #0E7490 + Emerald + Gold, light/dark `[data-theme]`, `--gradient-brand/saffron/navy`, glass, elevations, 50+ responsive queries, kpi-grid/doc-grid/bed-matrix/kanban/hero/auth-split, table-scroll sticky thead, clamp(), 44px targets, focus 3px + reduced-motion + skip-links.
- `Landing.jsx` hero mesh + orbs + book-widget + trusted-strip + cit-stats + scheme-band + svc-grid + staff-strip + testi + FAQ JSON-LD + app-band. `Layout.jsx` glass topbar + cmdbar + ticker + Recent-5 + toasts + sidenav rail. No lorem, no Vite template.

## Quality Gates (Merge Criteria)
- [x] All tests passing (26/26 + build 917 — QA evidence accepted, sources spot-verified)
- [x] Code reviewed by 1+ team member (this review)
- [x] No critical/high security findings (XSS 0, CORS no `*`, demo localhost-only + synthetic; prod RBAC deferred to security-audit)
- [x] Documentation updated if API changed (Help runbook relative + staff full, Reports interop badge, footer env-aware)
- [x] Branch up-to-date with main (N/A single-workspace demo)
- [x] Meaningful commit messages (N/A; fix intent via WHY comments retained H1/M1-M5/L1-L8)
- [x] Sprint task updated to done (ready for security-audit)

## Issues (file:line, severity)
- None open. No new issues. No nits blocking merge.
- H1 FIXED `Appointments.jsx:83-88,124-131` — effectiveWhen merge + pickSlot sync + summary/payload agree.
- M1-M5 FIXED: `Doctors.jsx:47-75` avail filter + estimated strip; `Hospitals.jsx:31-75` full-registry client paging; `Signup.jsx:15-18,57` 1:1 payload; `client.js:6-10` prod relative `/api`.
- L1-L8 FIXED: `Reports.jsx:48-49,73-79,182-196` SOAP badge; `Help.jsx:29-33` relative public; `Layout.jsx:210,318` API_BASE interpolation; `Referrals.jsx:20-21,93` refView persist; `Records.jsx:87-108` full disabled; `Beds.jsx:144-145` per-row busy; `global.css:26,328-330` AA; `App.jsx:28-29` lazy split.
- Residual polish (informational, not gating, same as QA): PieChart 400kB shared still large — treeshake/manualChunks if grows; dist hash changed — serve via preview :5173 with backend :8086; H2 wipe on restart — re-seed; axe/Lighthouse + keyboard walkthrough still owed before release.

## Mentoring Notes
- What good looks like — keep: single-source `effectiveWhen` for slot→payload (H1 template for derived state); estimated-label discipline where no live API exists (M2: label + 409-safe beats fake guarantee); fetch-full-then-filter-client paging where registry small (M3) with honest `hasMore`; 1:1 payload mapping to entity (M4) so UI never promises unsaved fields; prod fallback relative `/api` (M5) so unset env never leaks localhost to citizens.
- SOLID/Clean: SRP holds (Central read-model, Bed stock, Referral transfer); helpers `loadOf/displayName` right-sized; no God class, no speculative generality. DRY/KISS/YAGNI: minimal WHY-commented fixes, no over-engineering.
- Google lens: CLs small, design/functionality/complexity/tests/naming/comments/style/docs checked, every line read, LGTM justified. Review latency met.
- Performance lens: initial 428kB (−50%) via lazy Recharts; citizen landing/hospitals/doctors load without charts; 60s poll + hidden guard retained; bounded lists (slice 20 export) kept.
- Next: forward `qa-report.md` PASS + this file APPROVED to security-audit. Chain ends at security per deploy gate — do NOT deploy. Prod with real PHI remains blocked on authN/Z + TLS + KMS + audit.

---
*Dev-lead review-only: no source edits. Chain: qa-report PASS (26/26 + 917, 0 open) → code-review APPROVED → security-audit next. No deploy.*
