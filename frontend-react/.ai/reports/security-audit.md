# Security Audit
Verdict: PASS — demo-only (NOT prod-ready, no deploy)

> Scope: FULL citizen-first portal — `D:\API\Hospital Management System\frontend-react` (Dual-Surface: public citizen shell + staff console).
> Inputs read first: `.ai/reports/qa-report.md` Verdict PASS (vite build 916 modules 5.80s, backend 26/26, 3 LOWs) + `.ai/reports/code-review.md` Verdict APPROVED.
> Boundary respected: audit + report ONLY. No app code or config modified. Read-only: `vite.config.js`, `package.json`, `index.html`, `src/App.jsx`, `src/api/client.js`, `src/context/AppContext.jsx`, `src/components/ProtectedRoute.jsx`, `src/components/PublicChrome.jsx`, `src/pages/Login.jsx`, `src/pages/Emergency.jsx`, `src/pages/Reports.jsx`, `src/pages/Help.jsx`, `src/pages/Schemes.jsx` + PowerShell greps (XSS sinks, localhost leak, tel:, target=_blank, localStorage/secrets, console/alert).
> Demo context: `vite --port 5173 --host 127.0.0.1` + backend `http://localhost:8086/api` (+ `VITE_API_BASE` override). Auth is explicit mock (`localStorage hub.auth`, no password). No deploy.

## Task Checklist (requested 8 gates)
- [x] XSS 0 — PASS: grep `dangerouslySetInnerHTML|innerHTML|outerHTML|document.write|eval(|new Function` in `src/**` → 0 hits. All display via JSX auto-escape + `esc()`/`csvCell`/`encodeURIComponent` in `client.js`.
- [x] CORS 5173 — PASS demo: `vite.config.js:7-15` dev+preview pinned `port 5173 host 127.0.0.1 strictPort:true` (not `0.0.0.0`); `client.js:4-5` `API_BASE = VITE_API_BASE || http://localhost:8086/api`; `Help.jsx:94` runbook `CORS: allow portal origin via VITE_API_BASE; never use *`. Backend owns CORS — must allowlist exactly `http://127.0.0.1:5173` + `http://localhost:5173`, no `*` (prod gate R-04).
- [x] Auth mock — PASS demo / FAIL prod: `AppContext.jsx:82-102` `login()` any display name + role pick, no password/server verify/JWT/MFA/rate-limit; plaintext `localStorage hub.auth`; `ProtectedRoute.jsx:12-15` unauth → `Navigate /login?next=` with `Login.jsx:43` `startsWith('/')` guard (no open redirect, GOOD); role 403 `beds [SuperAdmin,HospitalAdmin,Receptionist]` / `records [SuperAdmin,Doctor]` (`App.jsx:58-63`) + UI-only `can.*` with `server RBAC TODO` comments. Honestly labelled `Demo build: no password` (`Login.jsx:133`, `Help.jsx:17`). Bypassable via DevTools by design.
- [x] PHI synthetic — PASS demo: footer `Synthetic demo data only — no real patient information` (`PublicChrome.jsx:156`); seed IDs `MH-2026-*`, H2 `mem:central_hub` wipe per QA; bulk `listPatients/listAppointments/listReferrals` only when `isAuthenticated` (`Appointments.jsx` recent gated, `Reports.jsx:49,57` exports gated `SuperAdmin|HospitalAdmin` else `Staff login to export` strip). Residual: `hub.auth` name/email/centralId + `hub.recentCentralIds` (last-5) plaintext in localStorage (XSS-accessible) — R-03 prod-blocker.
- [x] No localhost leak citizen — PASS (1 LOW): grep `localhost|127.0.0.1|:8086` in `src/pages/*.jsx` → only `Help.jsx:90` runbook `:8086` (IT-cell only, correct) + `Profile.jsx:13` staff device label `This browser · 127.0.0.1` (staff surface, LOW). Citizen cards/fallacks say `Call 108 / retry`, never infra URL. `src/components`: only `Layout.jsx:210,318` staff sidenote/footer + `client.js:5,32-33` code fallback (not UI string). WSDL isolated to `Help.jsx:90,97,101` + `Layout` staff + pointers (`PublicChrome.jsx:157`, `Reports.jsx:174`) — zero on citizen cards.
- [x] Headers — ACCEPTED demo / FAIL prod: `index.html:1-26` has `charset/viewport/description/theme-color/title/fonts/icon` + theme pre-paint, but NO `Content-Security-Policy` meta, no `Referrer-Policy`; `vite preview` sends no `HSTS / X-Content-Type-Options: nosniff / X-Frame-Options: DENY / Permissions-Policy` by default. No `integrity/crossorigin` needed (Google Fonts `preconnect` only). No service worker. Loopback demo has no internet surface — R-04 before any ministry/prod origin.
- [x] 500 generic — PASS: `client.js:29-38` `toApiError` → `status 0 → Backend unreachable at + API_BASE`, else `data.message||data.error||err.message`, fallback `Request failed. Check backend on :8086, then Retry.` — generic, no stack/`raw` rendered; `ErrorBanner` shows `message` + Retry only. 404/409 mapped to friendly copy (`No record for id`, `That slot just filled — pick nearest free`, `already exists — open existing`), no `409` code word on citizen. `console.warn(..., ae)` in 6 pages logs normalized `{status,message}` only (no PHI dump); 0 `alert(` with PHI.
- [x] Emergency tel — PASS: `Emergency.jsx:22-34` 4 cards `108 tel:108 / 102 tel:102 / 14555 tel:14555 / 1800-11-4477 tel:1800114477` with `Tap to call` + 5-min steps + triage colours + casualty list `[Call tel:108][View]` + offline fallback `call 108…`; global `EmergencyStrip` always mounted (`PublicChrome.jsx:40-68`: `108·102·14555 + Call now tel:108 + WhatsApp wa.me/911022489877` + EN/HI/MR + A-/A/A+ + contrast); `PublicHeader` Emergency nav (`114`), footer helplines `tel:108/102/14555` (`143-147`), `Help.jsx:68-76` tap-to-call + `tel:` everywhere.

## OWASP Checklist
- [x] Input validation — whitelist > blacklist, server-side always (client is defense-in-depth)
- [x] Authentication/Authorization — demo mock only, UI gates correct, server RBAC TODO (PASS demo, FAIL prod)
- [x] Data encryption — no secrets in code; TLS/env pattern correct; at-rest localStorage PHI demo-only risk
- [x] SQL injection prevention — N/A frontend (no concat); `URLSearchParams` + `encodeURIComponent`; backend 26/26 per QA
- [x] XSS prevention — 0 sinks (see F-01)
- [x] CSRF protection — N/A localStorage/no-cookie design; mandatory on cookie move (F-06)
- [ ] Security headers — MISSING (accepted demo-only, prod-blocker F-05)
- [x] Error handling — generic `toApiError`, no stack leak (F-07)

## Findings (OWASP category, severity, file:line)
- F-01 — A03 Injection (XSS): INFO/PASS — 0 `dangerouslySetInnerHTML|innerHTML|eval` in `src/**`; `src/api/client.js:19-26,40-43` `esc()` + `csvCell` + `encodeURIComponent(centralId/wardType)` (`client.js:102,131-133`, `AppContext.jsx:139`, `Patients` links). LOW note: `csvCell` quotes `," \n` but no `=,+,-,@` formula-escape — `referral-throughput.csv` (`Reports.jsx:96`) formula injection possible. Demo-acceptable; harden in R-01.
- F-02 — A01 Broken Access Control / A07 Auth Failures: MEDIUM (prod) / ACCEPTED (demo) — `src/context/AppContext.jsx:82-102,155-166`, `src/pages/Login.jsx:60-84,127,133`, `src/components/ProtectedRoute.jsx:8-38`, `src/App.jsx:36-66`. No password/JWT/MFA/rate-limit/lockout; `hub.auth` plaintext; `can.bookAppointments:true` open mock + `server RBAC TODO`. `?next=` validated, role 403 friendly, no secrets in code (grep `secret|api[_-]?key` → only `hub.auth`/labels). Matches stated demo threat model.
- F-03 — A02 Crypto Failures / Privacy (PHI): LOW (synthetic demo) / HIGH if real PHI — `src/context/AppContext.jsx:35-41,93-99,124-130`, `src/pages/Reports.jsx:50-71,86-107`. `hub.auth` + `hub.recentCentralIds` + prefs in localStorage (unencrypted, XSS-readable, survives refresh; no cookies → no `httpOnly/Secure/SameSite`). Exports include `centralId/patient/from/to/reason` via `Blob + objectURL + revokeObjectURL(2000)`; audit note `role+scope+timestamp` intent but no DLP/retention/redaction. `Login.jsx:127` centralId `type=password + show/hide + autocomplete=off` GOOD. Data synthetic per footer + H2 mem wipe.
- F-04 — A03 Injection / Validation: INFO/PASS — `src/pages/Login.jsx:60-70` whitelist (`name 2+`, email regex, `role ∈ ROLES`, `hospitalId` required non-SuperAdmin, `centralId /^[A-Za-z0-9-]{4,32}$/`); `Patients.register` `age min 0 max 130`, gender select; `client.js:84-89` `URLSearchParams`, axios `timeout 15000 + Accept/Content-Type: application/json`, WSDL check `timeout 8000 responseType:text`. Bypassable client-side — backend `GlobalExceptionHandler` 409 shapes remain enforcer; `toApiError` depends on exact `status/message` (QA regression risk).
- F-05 — A05 Misconfiguration (CORS/headers/deps): LOW (loopback demo) / HIGH if internet-facing — `vite.config.js:7-15`, `package.json:12-22`, `index.html:1-26`, `src/pages/Help.jsx:90-94`. CORS correct frontend-side (`VITE_API_BASE`, never `*`); headers missing (see checklist); deps `axios ^1.7.7 / react ^18.3.1 / react-router-dom ^6.26.2 / recharts ^2.13.0 / vite ^5.4.11` — no `npm audit` in read-only audit, daily scan + pin + SBOM owed (R-05). Reverse tabnabbing GOOD: every `target=_blank` carries `rel=noreferrer` (`Reports.jsx:24`, `Schemes.jsx:26,60-63`, `Help.jsx:80-82,101`, `PublicChrome.jsx:50,75,151-152,176`, `Emergency.jsx:67`).
- F-06 — A01/A07 CSRF/Session: INFO/N/A — `src/api/client.js:9-13` `axios.create` sends no cookies/auth headers; session in JS memory + localStorage → CSRF not applicable today. On cookie move: `SameSite=Lax/Strict` + per-request CSRF header on `POST/PUT book/admit/discharge/accept/createRecord` + `Origin/Referer` check (R-06).
- F-07 — A09 Logging/Monitoring: INFO/PASS — `src/api/client.js:28-38`, `src/components/ui.jsx` `ErrorBanner`, `src/pages/Reports.jsx:64-65`. Generic messages, friendly 404/409, no stack; backend AOP logs (`create FAIL`, `refer FAIL`, `NOTIFY: Referral` per QA) are server trail, not leaked to UI. SIEM/1-year retention N/A demo.

## Required Fixes (for dev agents — DO NOT apply to demo; prod gate only)
- [ ] R-01 (LOW, CSV injection): `src/api/client.js:40` — prefix `'` when cell matches `^[=+\-@\t\r]` before quoting; unit test `=HYPERLINK/+cmd/-2+3/@SUM`.
- [ ] R-02 (PROD-BLOCKER, auth): replace `hub.auth` mock with `POST /auth/login → httpOnly Secure SameSite=Lax` session (short-lived access + rotating refresh), `GET /auth/me`, `POST /auth/logout`; server RBAC on every route; MFA/WebAuthn, rate-limit + lockout, breached-password check; remove `bookAppointments:true` open gate. Files: `AppContext.jsx:82-102,155-166`, `Login.jsx:72-84`, `App.jsx:47-66`.
- [ ] R-03 (PROD-BLOCKER, PHI): stop persisting PHI in localStorage; opaque session cookie only, profile fetched on load, `recent` in-memory/encrypted, mask `phone/centralId` in lists, DLP + retention + confirm-dialog + watermark for `Reports.jsx` CSVs. Files: `AppContext.jsx:35-41,93-99,124-130`, `Reports.jsx:50-107`.
- [ ] R-04 (PROD-BLOCKER if internet-facing, headers+CORS): serve `dist/` behind hardened reverse proxy/WAF, never raw `vite preview`; send `HSTS max-age=31536000; includeSubDomains`, `CSP default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://<backend>; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`; backend CORS allowlist 5173 origins only, no `*`; add contract test. Files: `vite.config.js`, `index.html`, backend CORS config.
- [ ] R-05 (MEDIUM, supply chain): `package-lock.json` committed GOOD; run `npm audit` + Snyk/Dependabot daily, `npm audit signatures`, SBOM (CycloneDX), block CI on high. File: `package.json:12-22`.
- [ ] R-06 (LOW, CSRF-ready): on cookie auth add `withCredentials + xsrfHeaderName` + per-request token on all `POST/PUT`, server `Origin/Referer` check. File: `client.js:9-13`.
- [ ] R-07 (LOW, validation hardening): mirror `Login.validate()` + `Patients.register` regexes server-side; contract test for `toApiError` 409 shapes. Files: `Login.jsx:60-70`, `Patients` register, `client.js:28-38`.
- [ ] R-08 (LOW, hygiene): `Profile.jsx:13` device label `127.0.0.1` → `This browser` (strict zero-IP posture); `Layout.jsx:210,318` staff footer `http://localhost:8086/api` → relative `/api` label + `VITE_API_BASE` prod value.

## Threat Model (STRIDE — demo scope)
- Spoofing: trivial (role self-pick) — accepted demo, killed by R-02.
- Tampering: plain JSON over loopback — demo safe; prod needs TLS 1.3 + signed builds (SLSA).
- Repudiation: `Reports` role+scope+timestamp note + backend AOP logs; prod needs SIEM + 1-year signed events.
- Information Disclosure: no stack leaks; residual = localStorage PHI (synthetic only) — R-03.
- Denial of Service: `timeout 15s/8s` + Retry; prod needs quotas/autoscaling/WAF.
- Elevation of Privilege: UI gates bypassable by design — server RBAC (R-02) is prod boundary.

Report path: `.ai/reports/security-audit.md`

---

# Security Audit — Repainted Hospital Theme Quick Sign-off (2026-10-02)
Verdict: PASS — demo-only (NOT prod-ready, no deploy)

> Scope: repainted hospital theme — Navy #0B2A4A + Teal #0E7490 + Emerald #059669 + Gold #F59E0B — in `D:\API\Hospital Management System\frontend-react`.
> Inputs read first: `.ai/reports/qa-report.md` Verdict PASS (vite 916 modules, backend 26/26 fresh 2026-10-02, XSS 0, contrast AA) + `.ai/reports/code-review.md` Verdict APPROVED (this pass).
> Boundary respected: audit + report ONLY. No app code or config modified. Read-only: `global.css:1-130`, `App.jsx`, `api/client.js`, `package.json` + greps (XSS sinks, #0891B2, localStorage/VITE_API_BASE). No deploy.

## Task Checklist (requested 5 gates)
- [x] Premium look — PASS: tokens `global.css:5-38` gradient-brand navy→teal→emerald + tricolor + navy-tinted elevations; old cyan 0 hits re-verified.
- [x] Contrast AA — PASS: 10/11 pairs ≥4.5 per QA §4; 1 large-only `white on #059669 3.77` in `.btn-cta` with darker hover `#047857 5.48`; focus 3px + 44px + reduced-motion.
- [x] Dark — PASS: `[data-theme='dark']:79-117` bg `#071B2E`, surface `#0F2E4A`, text `#F8FAFC`, muted `#A8C0C8 9.16 on bg`; glows 12-14%.
- [x] No XSS — PASS (re-verified 0 hits): `dangerouslySetInnerHTML|innerHTML|eval\(|new Function` → 0 hits; JSX escape + `esc()/csvCell/encodeURIComponent` (`client.js:19-26,40-43,102,131-133`); `toApiError:28-38` generic, no stack leak; Lucide only.
- [x] Backend 26/26 — PASS (via QA fresh): `Tests run: 26, Failures: 0, Errors: 0, Skipped: 0`, `BUILD SUCCESS 30.138s 2026-10-02T15:32:52+05:30`; `App.jsx:30 HashRouter`, 22 routes + 409 recovery intact.

## OWASP Checklist (demo-only)
- [x] Input validation — whitelist > blacklist, server-side always (client defense-in-depth); `URLSearchParams + encodeURIComponent`, axios 15s/8s timeouts
- [x] Auth — demo mock only (`localStorage hub.auth`, no password/JWT/MFA), UI gates correct (`ProtectedRoute` beds SuperAdmin|HospitalAdmin|Receptionist, records SuperAdmin|Doctor), `?next=` startsWith guard — PASS demo, FAIL prod
- [x] PHI synthetic — footer `Synthetic demo data only`, H2 mem wipe, bulk lists gated when authenticated; residual `hub.auth + recentCentralIds` plaintext localStorage — prod-blocker
- [x] No localhost leak citizen — PASS (1 LOW): `client.js:5` fallback `http://localhost:8086/api` overridable via `VITE_API_BASE`; citizen 0 hits, staff-only `Layout.jsx:210,318` by design
- [ ] Headers — MISSING (accepted demo-only, prod-blocker): no CSP meta, no HSTS/nosniff/DENY; `vite preview` sends none by default; loopback demo no internet surface
- [x] Error handling — generic `toApiError`, no stack/`raw` rendered; 404/409 friendly copy, no `409` code word on citizen; `console.warn` normalized only

## Findings (OWASP category, severity, file:line)
- F-01 — A03 Injection (XSS): INFO/PASS — 0 sinks re-verified; `client.js:19-26 esc()` + `csvCell` + `encodeURIComponent`. LOW note: `csvCell:40-43` quotes `," \n` but no `=,+,-,@` formula-escape — `referral-throughput.csv` formula injection possible. Demo-acceptable.
- F-02 — A01/A07 Auth: MEDIUM (prod) / ACCEPTED (demo) — `AppContext.jsx:82-102` mock login any name + role pick, `hub.auth` plaintext, `can.bookAppointments:true` open mock + server RBAC TODO. Honestly labelled `Demo build: no password`. Bypassable via DevTools by design.
- F-03 — A02 PHI: LOW (synthetic demo) / HIGH if real PHI — `hub.auth + hub.recentCentralIds` localStorage unencrypted XSS-readable; exports via `Blob + revokeObjectURL(2000)`; no DLP/retention/redaction. Synthetic only per footer + H2 wipe.
- F-04 — A05 Misconfig: LOW (loopback demo) / HIGH if internet-facing — CORS correct frontend-side (`VITE_API_BASE`, never `*`); headers missing; deps `axios ^1.7.7 / react ^18.3.1 / react-router ^6.26.2 / recharts ^2.13.0 / vite ^5.4.11` — `npm audit` + SBOM owed. Reverse tabnabbing GOOD: every `target=_blank` carries `rel=noreferrer`.
- F-05 — A01 CSRF/Session: INFO/N/A — `client.js:9-13` no cookies/auth headers; localStorage session → CSRF N/A today. On cookie move: `SameSite + xsrfHeader + Origin check` owed.
- No critical/high open for demo threat model (loopback + synthetic + no secrets in code).

## Required Fixes (for dev agents — DO NOT apply to demo; prod gate only)
- [ ] R-01 (LOW, CSV): `client.js:40` prefix `'` when cell matches `^[=+\-@\t\r]`; test `=HYPERLINK/+cmd/-2+3/@SUM`.
- [ ] R-02 (PROD-BLOCKER, auth): `POST /auth/login → httpOnly Secure SameSite` + `GET /auth/me` + logout; server RBAC every route; MFA, rate-limit, lockout; remove open `bookAppointments:true`.
- [ ] R-03 (PROD-BLOCKER, PHI): stop localStorage PHI; opaque cookie + fetch-on-load, mask `phone/centralId`, DLP + retention + confirm + watermark for CSVs.
- [ ] R-04 (PROD-BLOCKER if internet-facing): hardened reverse proxy/WAF, never raw `vite preview`; HSTS + CSP `default-src 'self'` + nosniff + DENY + Referrer-Policy + Permissions-Policy; backend CORS allowlist 5173 only, no `*`.
- [ ] R-05 (MEDIUM, supply chain): `npm audit` + Snyk/Dependabot daily, `npm audit signatures`, CycloneDX SBOM, block CI on high.
- [ ] R-06 (LOW, hygiene): staff footer `http://localhost:8086/api` → relative `/api` + prod `VITE_API_BASE`; emerald CTA `#059669` → `#047857` for strict AA.

## Threat Model (STRIDE — demo scope)
- Spoofing: trivial (role self-pick) — accepted demo, killed by R-02.
- Tampering: plain JSON over loopback — demo safe; prod TLS 1.3 + signed builds.
- Repudiation: backend AOP logs (`create FAIL`, `refer FAIL`, `NOTIFY: Referral`); prod SIEM + 1-year signed events.
- Information Disclosure: no stack leaks; residual localStorage PHI (synthetic) — R-03.
- Denial of Service: timeouts 15s/8s + Retry; prod quotas/autoscaling/WAF.
- Elevation: UI gates bypassable by design — server RBAC (R-02) is prod boundary.

No deploy. Demo-only PASS.
