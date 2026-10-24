# QA Report
Verdict: PASS

> Repainted hospital theme — Deep Navy #0B2A4A + Teal #0E7490 + Emerald #059669 + Gold #F59E0B — in `D:\API\Hospital Management System\frontend-react`. QA boundary respected: TEST files only, app code read + built, no source edits. Frontend `npm run build` PASS 916 modules + backend `.\mvnw.cmd test` 26/26 PASS fresh 2026-10-02.

## Tests Run

### 1. Frontend build — `npm run build` — PASS
- Workdir `D:\API\Hospital Management System\frontend-react`
- `vite v5.4.21 building for production` → `916 modules transformed` → `built in 6.10s`, exit 0
- `dist/index.html 1.94 kB | gzip 0.94 kB`, `dist/assets/index-CeuMy18D.css 57.48 kB | gzip 10.89 kB`, `dist/assets/index-TiZrUyUi.js 858.18 kB | gzip 243.64 kB`
- `HashRouter` `src/App.jsx:30` — dist works without server rewrites. `vite.config.js:7-11` dev `:5173 host 127.0.0.1 strictPort`, `build.outDir dist sourcemap false chunkSizeWarningLimit 900`.

### 2. Old color eradicated — 0 × #0891B2 — PASS
- `Select-String src/**/* #0891B2` → 0 hits (case-sensitive)
- `Select-String dist/assets/* #0891B2` → 0 hits (built CSS/JS clean)
- DESIGN-V2 §1 audit item resolved: flat cyan replaced by gradient system `linear-gradient(135deg, #0B2A4A 0%, #0E7490 52%, #059669 100%)` (`src/styles/global.css:34`).

### 3. New palette light #F8FAFC + dark #071B2E — PASS
- `src/styles/global.css:1-4` header documents palette: Navy #0B2A4A + Teal #0E7490 + Emerald #059669 + Gold #D97706/#F59E0B, Light BG #F8FAFC, Dark BG #071B2E, Text #0F172A, Danger #B91C1C
- `:root` light: `--color-primary #0E7490:6`, `--color-navy #0B2A4A:14`, `--color-emerald #059669:9`, `--color-saffron #F59E0B:11`, `--color-bg #F8FAFC:16`, `--color-surface #FFFFFF:18`, `--gradient-brand navy→teal→emerald:34`, `--tricolor navy/gold/emerald:38`
- `[data-theme='dark']:79-117`: `--color-primary #22D3EE:80`, `--color-emerald #34D399:83`, `--color-bg #071B2E:88`, `--color-bg-2 #0B2A4A:89`, `--color-surface #0F2E4A:90`, `--color-text #F8FAFC:94`, `--color-muted #A8C0C8:95`
- Body mesh both themes (`global.css:126-140`): light 3× radial (navy/teal/gold washes) + linear bg→bg-2; dark teal/emerald/gold glows 12-14% + linear #071B2E→#0B2A4A.

### 4. Contrast AA — PASS (10/11 pairs ≥4.5, 1 large-only documented)
- Computed relative-luminance ratios (PowerShell, WCAG 2.1):
  - light text/bg `#0F172A on #F8FAFC = 17.06 PASS AA`
  - light muted/surface `#475569 on #FFFFFF = 7.58 PASS AA`
  - light muted/bg `#475569 on #F8FAFC = 7.24 PASS AA`
  - dark text/bg `#F8FAFC on #071B2E = 16.65 PASS AA`
  - dark muted/bg `#A8C0C8 on #071B2E = 9.16 PASS AA`
  - white/teal `#FFFFFF on #0E7490 = 5.36 PASS AA` (primary buttons/links)
  - white/navy `#FFFFFF on #0B2A4A = 14.54 PASS AA` (sidebar active, hero, footer)
  - saffron-ink/saffron `#451A03 on #F59E0B = 6.97 PASS AA` (saffron CTA per §10.1)
  - white/danger `#FFFFFF on #B91C1C = 6.47 PASS AA`
  - success/success-bg `#047857 on #DCFCE7 = 4.99 PASS AA`, emerald-dark/white `#047857 on #FFFFFF = 5.48 PASS AA`, warning `#B45309 on #FEF9C3 = 4.68 PASS AA`, info `#0369A1 on #EFF6FF = 5.45 PASS AA`, placeholder `#64748B on #FFFFFF = 4.76 PASS AA`
  - Exception: white/emerald-btn `#FFFFFF on #059669 = 3.77 LARGE-ONLY` (≥3:1 UI, <4.5 normal) — `.btn-cta:328` only; hover darkens to `#047857 = 5.48 PASS`; primary gradient dominated by navy/teal (>5). See LOW bug.
- Focus visible 3px teal + 6px glow (`global.css:155-163`), 44×44 targets throughout (buttons, nav 44px:203, inputs 44px:349, tabs 44px:503, avatar-menu 44px:526), `prefers-reduced-motion: reduce` kills animation (`global.css:164-166`), `useCountUp` respects reduced-motion (`ui.jsx:11`).

### 5. Sidebar rail — PASS
- `src/styles/global.css:169-181`: `.sidenav 264px sticky` → `.shell.rail .sidenav 76px`, hide brand-name/sub/label/sep/meta/note, center icons, brand-row center
- `src/components/Layout.jsx:50,69-70,151,165-166`: `rail` state from `hub.navCollapsed`, persisted localStorage, toggle `collapse-btn` with `aria-pressed` + `aria-label Expand/Collapse`, tooltips via `title` when rail (`177,187,191,195`)
- Active = gradient pill + left 4px saffron bar + glow (`global.css:207-215`), hover wash + translateX(2px), sections OVERVIEW/NETWORK/CARE FLOWS/INSIGHTS/ACCOUNT (`Layout.jsx:9-38`), referrals saffron badge (`220-224`), foot user-chip + sidenote, mobile drawer 272px + scrim + `open` transform (`global.css:642-645`).

### 6. Topbar — PASS
- `global.css:232-253`: sticky `z-30`, glass `blur(16px) saturate(1.2)` + `elevation.1`, scrolled → `elevation.2`
- `Layout.jsx:215-284`: hamburger 44px + `Central Command` title + `LIVE :8086` emerald pulse pill + center search 340px (`topsearch:510-515`) with `/` focus + `Esc` close (`108-114`), dropdown glass card avatar+city (`224-232`), bell with saffron count + 380px popover + `Refresh now` (`233-254`), avatar 40px gradient-ring dropdown Profile/Settings/Theme/Logout + role pill (`255-275`), scope banner info/emerald + `Change` (`277-283`), `Breadcrumbs`.

### 7. Hero mesh — PASS
- `global.css:532-557`: `.hero linear-gradient(135deg, #0B2A4A 0%, #0E4A62 30%, #0E7490 55%, #059669 100%)` + EHR grid 44px 7% + `mask radial`, 3 orbs `blur(60px) drift 12s alternate` (sky #38BDF8 340px, emerald #34D399 280px, gold #F59E0B 180px + glow), `hero-inner 1280px 2-col @1024`, eyebrow cyan + pulse-dot, H1 `clamp(32px,4.5vw,56px)` white + saffron italic accent, lede `#E0F2FE 60ch`, hero-white + hero-ghost CTAs, glass pills, `hero-panel glass 24px + elevation.3` with 4 KPIs count-up + avail list + `hero-wave tricolor 10px:557`, `counters-overlap -32px`, `scheme-band navy→teal→emerald:574`, `cta-panel gradient:587`, auth split same gradient (`600,607`).

### 8. KPI gradients — PASS
- `global.css:294-312`: `.kpi-card::before 4px var(--kpi-accent, gradient-brand)`, hover lift -2px, `kpi-icon 40px 12px` 6 hues teal/navy→teal, emerald, saffron, blue, violet, rose + delta pills emerald/red + sparkline
- `src/components/ui.jsx:81-102`: `KpiCard` + `KPI_HUES/ICONS` rotation + `useCountUp 800ms ease-out tabular en-IN:6-28` + reduced-motion instant
- `src/pages/Dashboard.jsx:79-96`: 6 cards Hospitals/Doctors/Patients/Appointments/Referrals/Beds `kpi-grid kpi-6` + sparks; `Landing.jsx:233-234` same card + hue; charts palette `[#0B2A4A,#0E7490,#059669,#D97706,#0369A1,#7C3AED]:9` + gradient area fill + rounded bars + glass tooltip.

### 9. Load Lights — PASS (never color alone)
- `global.css:388-403`: `.load-light 14px 700` + `.load-dot 12px + 2px white ring + shadow` + `.load-meta tabular 13px %·free/total` + `.load-bar 8px rounded + flex` + `.load-fill gradients` emerald/saffron/red per level
- `src/components/ui.jsx:39-68`: `LoadLight({total,occupied})` via `loadOf` → dot + label Available/Tight/Full + `% · free/total` + bar `role=img aria-label` + `title Occupied x of y`; `OccupancyBar` companion
- Usage: `Beds.jsx:133`, `Dashboard.jsx:147` table + `177` funnel bars, `Hospitals.jsx:133`, `HospitalDetail.jsx:71,131`, `Landing.jsx:284` — all with text + bar + tooltip.

### 10. Responsive — PASS
- 50 `@media/clamp/44px` hits: `kpi-grid 1col→2@480→3@768→4@1024→6@1280 dashboard:284-288`, `doc-grid 1→2@768→3@1200`, `bed-matrix 1→2@768→3@1200`, `feature-grid 1→2→3`, `kanban 3@900`, `hero-inner stacks→2-col@1024 + 2-col KPI@480`, `scheme/how/testi/footer grids @900`, `auth-split stacked→50/50@1024`, `table-scroll overflow-x + sticky header`, `page 16→24→32px`, `clamp() type`, `max-width 1280 (1360@1440)`, drawer + topbar second-row search @≤900, `min 44px` buttons/nav/inputs/tabs/menus, no fixed px widths, print hides chrome.

### 11. No XSS — PASS
- `Select-String src/**/* dangerouslySetInnerHTML|innerHTML|eval\(|new Function` → 0 hits
- React escapes by default; `Avatar` initials derived via split/slice (`ui.jsx:31`); search/centralId via controlled state + `goCentralId` navigate (no HTML injection); `toApiError` renders strings as text in `ErrorBanner`; no `v-html`, no URL `javascript:`; emoji icons 0 in `components+pages` (Lucide SVG only per DESIGN-V2 §12).

### 12. Backend 26/26 still green — PASS (fresh)
- `.\mvnw.cmd test` in `D:\API\Hospital Management System` → `Tests run: 26, Failures: 0, Errors: 0, Skipped: 0`, `BUILD SUCCESS 30.138s 2026-10-02T15:32:52+05:30`
- Breakdown fresh surefire: AppointmentServiceTest 2, BedServiceTest 4, CensusEndpointTest 2, CentralServiceTest 3, GlobalExceptionHandlerTest 7, HubApplicationTests 1, PatientServiceTest 3, ReferralServiceTest 4 = 26
- Logs: `BedService.admit FAIL no beds available`, `PatientService.create FAIL already exists`, `ReferralService.refer FAIL must differ`, `NOTIFY: Referral`.

### 13. Routes + booking 409 intact — PASS
- Routes 22 in `src/App.jsx`: public 9 (`index Landing:35`, `hospitals:36`, `hospitals/:id:37`, `doctors:38`, `appointments:39`, `emergency:40`, `schemes:41`, `reports:42`, `help:43`) + auth 3 (`login:47 signup:48 forgot:49`) + staff 8 under `ProtectedRoute+Layout:52-66` (`dashboard:54 patients:55 patients/:centralId:56 referrals:57 beds gated SuperAdmin|HospitalAdmin|Receptionist:58-60 records gated SuperAdmin|Doctor:61-63 profile:64 settings:65`) + `404:69 * :70`
- Booking 409 backend: `DoubleBookingException.java:5 Mapped to 409`, `GlobalExceptionHandler.java:28-30 handleConflict CONFLICT`, `:46-49 duplicate→CONFLICT generic (P0 no SQL echo)`, `:62-63 concurrent→CONFLICT`, `AppointmentService.java:68,89 throw DoubleBookingException`, `BedService.java:74 OptimisticLock→409`, controllers document `409 via DoubleBookingException` / `409 when full`
- Booking 409 frontend: `Appointments.jsx:137 ae.status===409` → `That slot just filled - pick nearest free` + recovery `+30min/+1h/+2h/Next day:108-116,220-224`, `Beds.jsx:60 409 Full→Try nearby`, `Patients.jsx:65 409 centralId exists→open existing`, `Signup.jsx:58,74 409 hospital/centralId exists`, `Help.jsx:19` + `Landing.jsx:251` copy documents recovery.

## Bugs Found (severity: critical/high/medium/low, file:line)
- LOW — White on Emerald #059669 3.77:1 large/UI-only — `frontend-react/src/styles/global.css:328 .btn-cta` (`--color-emerald #059669:9` + white text). Fails normal-text 4.5, passes 3:1 large/graphics. Mitigated: 15-16px 700 bold + hover darkens to `#047857 5.48 PASS (:329)`, primary gradient buttons dominated by navy/teal (>5). Suggest CTA bg → `#047857` for strict AA or keep for large-only with comment.
- LOW — Bundle 859 kB single chunk near 900 limit — `frontend-react/dist/assets/index-TiZrUyUi.js:859007 B (gzip 243.64 kB)` vs `vite.config.js:19 chunkSizeWarningLimit 900` — Build PASS. Suggest `React.lazy` for Dashboard/Reports (Recharts) if it crosses.
- LOW — Staff chrome prints `http://localhost:8086/api` — `frontend-react/src/components/Layout.jsx:210,318` + `src/api/client.js:5` fallback — Citizen pages 0 hits (clean), staff-only by design. Prod must set `VITE_API_BASE` + relative `/api` label.
- No critical/high/medium open. No XSS, no old cyan, no broken routes, no 409 regression.

## Regression Risks
- H2 in-memory `jdbc:h2:mem:central_hub` — restart wipes seed; re-seed hospitals + `MH-2026-004213` before manual E2E or Landing shows skeletons + Retry.
- Demo auth `localStorage hub.auth` client-only; server JWT/OTP owed before prod; `can.bookAppointments:true` mock.
- 409 contract via `toApiError status/message` (`api/client.js`); backend message rename → generic fallback. Keep contract test on `DoubleBookingException` + `BedUnavailableException` → 409.
- Emerald CTA + saffron accents (<8% per spec §15): visual diff on theme swap; verify dark `#071B2E` + light `#F8FAFC` screenshots at 320/768/1024/1440 + `prefers-reduced-motion`.
- Charts + `useCountUp` animate on mount; axe/Lighthouse a11y 95+ + keyboard (`/`, `Esc`, skip-links `Layout.jsx:152-153`) + SR walkthrough still owed before release.
- `dist/` hash `CeuMy18D/TiZrUyUi` fresh this run (`built in 6.10s`); serve via `npm run preview --port 5173` with backend `:8086` or live numbers stay skeletons.

Report path: `.ai/reports/qa-report.md`
