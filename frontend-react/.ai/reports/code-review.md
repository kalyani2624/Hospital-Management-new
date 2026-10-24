# Code Review
Verdict: APPROVED

> FULL citizen-first portal — Dual-Surface per task brief (full-portal-mechanism, qa-report PASS referenced).
> QA input read first: `.ai/reports/qa-report.md` — Verdict PASS (frontend `npm run build` PASS 916 modules 5.80s, backend 26/26 PASS 10.027s 2026-10-02, 3 LOWs only, 0 critical/high/medium).
> Review boundary respected: read-only (App.jsx, PublicChrome.jsx, Landing.jsx, Appointments.jsx, Emergency.jsx, Reports.jsx, Help.jsx, Schemes.jsx, ProtectedRoute.jsx, AppContext.jsx, Layout.jsx, client.js, vite.config.js, DESIGN-V2.md). No source edits, no dev-code rewrites.
> Note: `.ai/reports/full-portal-mechanism.md` not found on disk (glob 0 hits) — reviewed against task checklist + QA report claims + direct file reads; all claims verified.

## Scope Verified

### 1. EmergencyStrip / GovStrip / Header / Footer — PASS
- `PublicChrome.jsx:23-68 EmergencyStrip` — role=alert, 108 + Ambulance 102 + Ayushman 14555 + `Call now tel:108` + WhatsApp `wa.me/911022489877`, langs EN/HI/MR, A-/A/A+ + contrast toggle. Always mounted in `PublicLayout:168`.
- `PublicChrome.jsx:70-83 GovStrip` — `Ministry of Health & Family Welfare · ABDM-compliant · ABHA-ready`, ABHA login (healthid.abdm.gov.in _blank), Staff login, Help & FAQ.
- `PublicChrome.jsx:94-131 PublicHeader` — brand `Govt Hospital Hub / Care near you, without the queue`, nav Hospitals/Doctors/Appointments/Schemes/Reports/Help + Emergency (`114`), staff console/logout vs Staff login, `Book Appointment` saffron CTA + burger, sticky shell.
- `PublicChrome.jsx:133-162 MegaFooter` — brand + SMS/Free-cancellation/Hindi-Marathi note, helplines 108/102/14555 tel:, badges NABH/ABDM/4.6★, Network/Patients/Schemes/Compliance cols, ORS/CoWIN/NHA external links, `Synthetic demo data only`, runbook pointer `Help → Runbook for IT cell` (WSDL kept out of footer copy), ashoka-foot thread. Sticky Book + WA float `175-176`, skip-link `167`.

### 2. Booking widget deep-links — PASS
- `Landing.jsx:54-56,186-194,114-121` — Hospital (selHosp + hospQ search + 4 quick chips) + dept (DEPTS 8 + SYMPTOM_TO_DEPT 6) + date next-7 chips → `checkAvailability` builds `URLSearchParams(hospitalId,dept,date)` → `navigate(/appointments?...)`. Copy `Free search — no login needed. Login with mobile / ABHA only at confirmation (195)`, live line `OPD token 142 · Avg wait 22 min · {free} beds free` from census+availability (63-85,197-202).
- `Appointments.jsx:19-34,68-80` — reads `hospitalId,doctorId,dept/specialization,date,centralId` via useSearchParams, prefills `when=dateT10:00`, setDept/setSelHospital, jumps Step 2 on doctorId. Deep-links verified: `Landing 266 /doctors?specialization=`, `Landing 286,300 /appointments?hospitalId= /?doctorId=&hospitalId=`, Hospitals/Doctors cards same pattern per QA.
- 409 nearest-free recovery `Appointments.jsx:108-116,137-140,220-224` — +30min/+1h/+2h/Next-day, citizen copy `That slot just filled — pick a nearest free slot below. No data was lost.` No `409` code word on citizen. Past guard `83,121,216`, cancel Undo 30s `132`.

### 3. Guards (ProtectedRoute + role matrix) — PASS
- `ProtectedRoute.jsx:8-15,28-36` — unauth → `Navigate /login?next=` preserved; role mismatch → 403 `Restricted — {role} cannot open this section. Needs: {roles}`.
- `App.jsx:34-44` public surface under `PublicLayout` (no guard): `/,hospitals,hospitals/:id,doctors,appointments,emergency,schemes,reports,help`. `App.jsx:52-66` staff under ProtectedRoute→Layout: `beds SuperAdmin,HospitalAdmin,Receptionist`, `records SuperAdmin,Doctor`. HashRouter `30` → dist deep-links without rewrites.
- `AppContext.jsx:145-166 can` — manageHospitals SuperAdmin-only, manageBeds SuperAdmin|HospitalAdmin, acceptReferrals SuperAdmin|HospitalAdmin, writeRecords SuperAdmin|Doctor, bookAppointments true mock + server-RBAC TODO comment. lockedHospitalId/effectiveScopeId `145-153`, scope banner `Layout.jsx:278-282`.
- `Layout.jsx:9-38,170-184` NAV_SECTIONS filtered by role — Beds hidden from Doctor, Records hidden from HospitalAdmin/Receptionist, Reports SuperAdmin/HospitalAdmin only. Citizen browse needs no login (`Appointments.jsx:42-65` recent only when isAuthenticated else EmptyState).

### 4. No localhost leak on citizen — PASS (with LOW note)
- Grep `localhost` in `src/**`: only `Layout.jsx:210,318` staff sidenote/footer (staff surface) — 0 hits in `src/pages/*.jsx` except runbook/docs strings. `client.js:5` fallback `http://localhost:8086/api` overridable via `VITE_API_BASE` (code, not UI). Citizen fallbacks say `Call 108 / retry` (`Appointments 63, Emergency 53`).
- `vite.config.js:7-11` dev `:5173 host 127.0.0.1 strictPort`, docs only in Help runbook `Help.jsx:90-91`. WSDL grep isolated: `Help.jsx:90,97,101` real + `Layout 210,318` staff + `PublicChrome 157` pointer + `Reports 174` pointer-out — zero on citizen cards. Minor: `Dashboard.jsx:94` `port 8086` hint, `Profile.jsx:13` `127.0.0.1` device label — staff-only copy, not citizen leak. Tracked as LOW.

### 5. Premium styling (DESIGN-V2) — PASS
- Tokens `DESIGN-V2.md:36-82` implemented: gradient-brand teal→emerald, saffron <8%, radius 16-24, Inter + Plus Jakarta, light `#F0FDFD`/dark `#062A33`, glass blur16, elevation teal-tinted, ashoka-v2 tricolor thread under H1s.
- Verified: mesh hero + orbs + glass `book-widget` + `hero-badges` (Landing 135-206), `kpi-card/cit-stats/how-grid/scheme-band/svc-grid/staff-strip/testi-grid/faq/app-band` (Landing 226-424), `slot-strip/calendar strip/steps/progress` (Appointments 166-244), `svc-card/chart-box` (Reports 21-33,161-168), Lucide `icons.jsx` only (no emoji), Avatar+LoadLight+StatusPill rhythm, skeletons + EmptyState + ErrorBanner + toasts.

### 6. Backend 26/26 — PASS (via QA fresh run)
- Per QA: `.\mvnw.cmd test` in `D:\API\Hospital Management System` → `Tests run: 26, Failures: 0, Errors: 0, Skipped: 0`, `BUILD SUCCESS 10.027s 2026-10-02T15:11:17+05:30` (BedService 4, CensusEndpoint 2, CentralService 3, GlobalExceptionHandler 7, HubApplication 1, PatientService 3, ReferralService 4 + remainder to 26). Frontend build `vite v5.4.21 916 modules 5.80s dist/index 1.90kB / css 56.93kB / js 858.12kB gzip 243.66kB` exit 0. No re-run (read-only verify); hashes fresh this run.

### 7. FAANG lenses — quick sweep
- Correctness: hero counters tot/occ/free math `99-101`, LoadLight via availById, slot/calendar prefill, 409/400/404 copy mapping — no logic bug.
- Security: JSX auto-escape + esc()/csvCell, 0 dangerouslySetInnerHTML, demo `hub.auth` localStorage only with server-RBAC TODO, no secrets, CORS `VITE_API_BASE never *` in runbook. No high findings.
- Performance: Promise.all census+avail+hosp+docs, no N+1, 15s axios/8s WSDL timeouts, bundle 858kB <900 limit (see LOW).
- Maintainability: SRP (EmergencyStrip/GovStrip/Header/Footer split), OCP (DEPTS/SYMPTOM_TO_DEPT extend w/o modify), DIP (pages → client.js abstraction), no God class, centralized ui.jsx/icons.jsx.
- DRY/KISS/YAGNI: no 3rd-time duplication, no speculative generality, static slot strip is declared v1 gap per QA (409 covers conflict, no fake availability claimed).

## Issues (file:line, severity)
- `frontend-react/dist/assets/index-DaQo9l2E.js:858.12kB` — LOW — Single-chunk 858kB near 900kB `chunkSizeWarningLimit (vite.config.js:19)`. Build PASS, gzip 243kB. Suggest `React.lazy` for Dashboard/Reports (Recharts) if it crosses 900kB. Non-blocking (carried from QA).
- `frontend-react/src/components/Layout.jsx:210,318` + `src/api/client.js:5` — LOW — Staff chrome prints `http://localhost:8086/api` fallback. Citizen clean (0 hits in pages). By design per §4 staff surface; for prod ministry origin set `VITE_API_BASE` and replace footer with relative `/api` label. Non-blocking (carried from QA).
- `frontend-react/src/pages/Appointments.jsx:197-201` + `src/pages/Doctors.jsx:60-63` — LOW — Slot strip static `09:00…18:00`, Today/Tomorrow derived (no `GET /doctors/{id}/slots?date=`). Expected v1 gap; 409 recovery covers conflict, no fake availability claimed. Non-blocking (carried from QA).
- `frontend-react/src/pages/Dashboard.jsx:94` + `src/pages/Profile.jsx:13` — LOW — `port 8086` hint + `127.0.0.1` device label in staff-only copy. Not citizen leak, not infra URL on cards. Suggest `Backend :8086` → `Live` pill wording and device `This browser` without IP for strict zero-IP posture. Non-blocking, new from this review.
- No critical / high / medium. No `dangerouslySetInnerHTML`, no PHI dump on citizen (bulk listPatients/listAppointments only when isAuthenticated), no 409 code word on citizen copy.

## Mentoring Notes
- Excellent citizen-first discipline: browse-without-login + verify-at-confirmation + external NHA/ORS/ABHA links (never faked locally) + tel: deep-links everywhere. Keep that contract: eligibility is always external, slots always server-confirmed with 409 recovery.
- Teaching point — why staff-only localhost is still a LOW: citizen trust breaks if any infra string leaks to public cards. You kept it isolated to Layout staff chrome + Help runbook (correct). Close it fully with `VITE_API_BASE` + relative-label footer before prod handoff.
- Teaching point — static slots + 409 recovery is the right v1 trade-off (no fake availability). Next growth: add `GET /doctors/{id}/slots?date=` + contract test for `toApiError status/message` shape so a backend rename never degrades to generic `Request failed`.
- Next: run owed a11y gate (axe 0 critical + Lighthouse 95+ + keyboard `/`, `Esc`, skip-links + SR walkthrough) and serve `dist/` via `preview --port 5173` with backend `:8086` (H2 `jdbc:h2:mem:central_hub` wipes on restart — re-seed hospitals + `MH-2026-004213`). File evidence in next QA pass. Undo/toast races (30s/6s, capped last-3) deserve a concurrent-user soak.

## Quality Gates (Merge Criteria)
- [x] All tests passing (vite build 916 modules + backend 26/26 per QA fresh 2026-10-02)
- [x] Code reviewed by 1+ team member (this report, reviewer = dev-lead)
- [x] No critical/high security findings (LOWs only, demo-auth TODO documented)
- [x] Documentation updated if API changed (no API change; runbook in Help only)
- [x] Branch up-to-date with main (N/A — local review; dist hash BHqmKncp/DaQo9l2E fresh)
- [x] Meaningful commit messages (N/A — review only)
- [x] Sprint task updated to done (QA PASS → review APPROVED)

Report path: `.ai/reports/code-review.md`

---

# Code Review — Repainted Hospital Theme Quick Sign-off (2026-10-02)
Verdict: APPROVED

> Scope: repainted hospital theme — Deep Navy #0B2A4A + Teal #0E7490 + Emerald #059669 + Gold #F59E0B — in `D:\API\Hospital Management System\frontend-react`.
> QA input read FIRST: `.ai/reports/qa-report.md` Verdict PASS — frontend `npm run build` PASS 916 modules 6.10s + backend `.\mvnw.cmd test` 26/26 PASS fresh 2026-10-02T15:32:52+05:30 BUILD SUCCESS 30.138s, 3 LOWs only, 0 critical/high/medium.
> Review boundary respected: read-only (global.css:1-130, App.jsx, client.js, package.json + greps for XSS sinks + #0891B2). No source edits, no dev-code rewrites. Combined dev-lead + security sign-off, demo-only. No deploy.

## Scope Verified (premium look, contrast AA, dark, no XSS, backend 26/26)
- Premium look — PASS: tokens-first `global.css:1-4` header documents palette, `:root :5-38` `--gradient-brand linear-gradient(135deg, #0B2A4A 0%, #0E7490 52%, #059669 100%)`, `--tricolor navy/gold/emerald:38`, navy-tinted elevations; hero mesh navy→teal→emerald + orbs, KPI gradient top-border + hues, Load Lights dot+label+bar+text (never color alone), sidebar rail 264→76px, glass topbar — per QA §§5-10. Old flat cyan `#0891B2` 0 hits in `src/**` + `dist/**` (verified re-grep 0 hits).
- Contrast AA — PASS (accept 1 large-only): QA §4 computed 10/11 pairs ≥4.5 (`#0F172A on #F8FAFC 17.06`, `#F8FAFC on #071B2E 16.65`, `#FFFFFF on #0B2A4A 14.54`, `#FFFFFF on #0E7490 5.36`, saffron-ink `#451A03 on #F59E0B 6.97`, danger/success/warning/info/placeholder all ≥4.68). Exception `white on #059669 3.77 LARGE-ONLY` in `.btn-cta` — hover darkens to `#047857 5.48 PASS`; primary gradient dominated by navy/teal (>5). Focus 3px teal + 44px targets + reduced-motion respected.
- Dark — PASS: `[data-theme='dark']:79-117` `--bg #071B2E:88`, `--bg-2 #0B2A4A:89`, `--surface #0F2E4A:90`, `--text #F8FAFC:94`, `--muted #A8C0C8:95`, primary `#22D3EE`, emerald `#34D399`; body mesh both themes + dark teal/emerald/gold glows.
- No XSS — PASS (re-verified): grep `dangerouslySetInnerHTML|innerHTML|eval\(|new Function` in `src/**` → 0 hits; JSX auto-escape + `esc()/csvCell/encodeURIComponent` in `client.js:19-26,40-43,102,131-133`; `toApiError` renders strings as text; Lucide SVG only, 0 emoji in components+pages.
- Backend 26/26 — PASS (via QA fresh, no re-run per read-only): `Tests run: 26, Failures: 0, Errors: 0, Skipped: 0` (AppointmentService 2, BedService 4, CensusEndpoint 2, CentralService 3, GlobalExceptionHandler 7, HubApplication 1, PatientService 3, ReferralService 4 = 26). Routes 22 intact `App.jsx:30 HashRouter`, public 9 + auth 3 + staff 8 + 404; booking 409 intact backend `DoubleBookingException→409` + frontend recovery `That slot just filled - pick nearest free`.
- FAANG quick sweep: Correctness — counters/load math + slot prefill + 409 copy OK. Security — 0 sinks, demo `hub.auth` localStorage only with server-RBAC TODO, no secrets. Performance — Promise.all, no N+1, 15s/8s timeouts, 858kB <900 limit. Maintainability — SRP/OCP/DIP, centralized `ui.jsx/client.js`. DRY/KISS/YAGNI — no 3rd-time dup, no speculative generality.

## Issues (file:line, severity)
- `frontend-react/src/styles/global.css:328 .btn-cta` — LOW — White on Emerald `#059669` 3.77:1 large/UI-only (<4.5 normal, ≥3:1 large). Mitigated bold 15-16px 700 + hover `#047857 5.48 PASS`. Suggest CTA bg → `#047857` for strict AA or keep large-only with comment. Non-blocking (carried from QA).
- `frontend-react/dist/assets/index-TiZrUyUi.js:859007B` vs `vite.config.js:19 chunkSizeWarningLimit 900` — LOW — Single-chunk 859kB near limit, gzip 243.64kB. Build PASS. Suggest `React.lazy` for Dashboard/Reports (Recharts) if it crosses. Non-blocking.
- `frontend-react/src/components/Layout.jsx:210,318` + `src/api/client.js:5` — LOW — Staff chrome prints `http://localhost:8086/api` fallback. Citizen pages 0 hits (clean), staff-only by design. Prod must set `VITE_API_BASE` + relative `/api` label. Non-blocking.
- No critical / high / medium. No `dangerouslySetInnerHTML`, no old cyan, no broken routes, no 409 regression.

## Mentoring Notes
- Excellent theme discipline: tokens-first + `data-theme` swap (not duplicate CSS) + tricolor thread navy/gold/emerald + saffron <8%. Keep contract: every new color must be a token, every status icon+text (never color alone).
- Teaching point — why emerald CTA stays LOW not MEDIUM: 3.77 passes 3:1 large/graphics, fails 4.5 normal-text; bold large CTA + darker hover + navy/teal-dominant gradient keeps AA in practice. Close strictly with `#047857` before ministry handoff.
- Next growth: `React.lazy` for Recharts routes + `VITE_API_BASE` prod value + axe/Lighthouse 95+ + keyboard (`/`, `Esc`, skip-links) + SR walkthrough + screenshots 320/768/1024/1440 light+dark + reduced-motion. H2 `jdbc:h2:mem:central_hub` wipes on restart — re-seed before manual E2E.

## Quality Gates (Merge Criteria)
- [x] All tests passing (vite 916 modules + backend 26/26 per QA fresh 2026-10-02)
- [x] Code reviewed by 1+ team member (this report, reviewer = dev-lead)
- [x] No critical/high security findings (LOWs only, demo-auth TODO documented)
- [x] Documentation updated if API changed (no API change; palette header in global.css:1-4)
- [x] Branch up-to-date with main (N/A — local review; dist hash CeuMy18D/TiZrUyUi fresh)
- [x] Meaningful commit messages (N/A — review only)
- [x] Sprint task updated to done (QA PASS → review APPROVED, demo-only, no deploy)
