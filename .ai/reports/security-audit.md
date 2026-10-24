# Security Audit
Verdict: PASS — demo-only (localhost + synthetic data). Prod with real PHI BLOCKED.

> PROJECT 6 Govt Hospital Hub — MAX React portal audit 2026-10-01 in `D:\API\Hospital Management System\frontend-react` (landing/login/signup + dashboard shell).
> Inputs read: `.ai/reports/qa-report.md` (Verdict PASS — `npm run build` 912 modules 9.91s + `mvnw test` 26/26 BUILD SUCCESS + CORS no `*` + XSS 0 hits + prior-fix persistence), `.ai/reports/code-review.md` (Verdict APPROVED — 0 open issues, demo `localStorage hub.auth` accepted, prod RBAC deferred here).
> Scope: localhost demo only. Synthetic data only, no real PHI. No deploy (chain ends at security per deploy gate).
> Method: audit-only, no source edits. Read + grep: `AppContext.jsx`, `Login.jsx`, `Signup.jsx`, `Landing.jsx`, `Forgot.jsx`, `ProtectedRoute.jsx`, `App.jsx`, `Layout.jsx`, `api/client.js`, `index.html`, `vite.config.js`, `package.json`, `config/CorsConfig.java`, `config/SecurityHeadersFilter.java`, `exception/GlobalExceptionHandler.java`, `application.properties`, `application-prod.properties`; sweeps for `dangerouslySetInnerHTML|innerHTML|eval`, secrets, `|| true`, `hospital.gov/central`.

## Findings (OWASP category, severity, file:line)

### Requested checks — all PASS for demo

1. **Auth mock localStorage — PASS demo-only, HIGH prod-blocker (A01 Broken Access Control / A07 Auth Failures)**
   - `frontend-react/src/context/AppContext.jsx:83-102` `login()` builds demo session `{name,email,role,hospitalId,hospitalName,centralId,loginAt}` from user input, `ROLES.includes` fallback to `Receptionist`, persists to `localStorage hub.auth` via `write:16-22`; `read:8-15` JSON.parse with try/catch fallback; `logout:104-107` clears only `hub.auth`.
   - `frontend-react/src/pages/Login.jsx:42-61` no password, no server call — `login({...})` + `navigate(next)` directly. Copy is honest: `Login.jsx:75` `demo session stored in localStorage`, `Login.jsx:81` `no password. Pick a role + hospital scope`, `Landing.jsx:68` `No password needed`, `Help.jsx:11-12` documents it, `App.jsx:36` comment `demo session via localStorage hub.auth`.
   - Client-only enforcement: `ProtectedRoute.jsx:12-15` `!isAuthenticated → /login?next=` + `17-33` `roles.includes(role)` else `Restricted`; `Layout.jsx:127` sidebar filter; `App.jsx:47-54` nested role gates for `beds/records/reports`; `AppContext.jsx:144-166` `lockedHospitalId/effectiveScopeId/can` with explicit `bookAppointments:true` + comment `server-side RBAC to be enforced before prod`. All bypassable via DevTools `localStorage` edit — accepted for demo, BLOCKS prod with real PHI.
   - Good: `Login.jsx:11-15` `next` from `?next=` sanitized `startsWith('/') ? n : '/dashboard'` — no open-redirect to external origin; `ProtectedRoute.jsx:13` `encodeURIComponent(pathname+search+hash)` preserves safely.
   - Prod requires: Spring Security + OAuth2/OIDC Authorization Code flow, server-side RBAC/ABAC deny-by-default, short-lived JWT + refresh or `HttpOnly Secure SameSite` sessions, MFA/WebAuthn, rate-limit + lockout on auth, no client-trusted roles.

2. **XSS 0 — PASS (A03 Injection)**
   - Grep `dangerouslySetInnerHTML|innerHTML|eval\(|Function\(` in `frontend-react/src` → 0 hits (re-verified; matches QA + code-review).
   - `frontend-react/src/api/client.js:19-26` `esc()` escapes `&<>"'`; `40-43` `csvCell` quotes `",\n` + `""` doubling; all display via JSX auto-escape (`{r.hospitalName}`, `{done.name}`, etc.).
   - `Forgot.jsx:40` renders trimmed email via JSX `<strong>{email.trim()}</strong>` only — no sink. `PatientDetail/Records/Profile/Patients` links use `encodeURIComponent(centralId)` (`AppContext.jsx:139`, `client.js:102,131,133`) — no URL injection.
   - Defense-in-depth: `SecurityHeadersFilter.java:25-34` `X-Content-Type-Options: nosniff` + CSP `default-src 'self'; script-src 'self' 'unsafe-inline'` (no `unsafe-eval`, `object-src 'none'`, `frame-ancestors 'none'`). `unsafe-inline` required for Vite inline — accepted demo, move to nonces/hashes in prod.

3. **CORS restricted — PASS demo (A05 Misconfiguration)**
   - `src/main/java/gov/hospital/hub/config/CorsConfig.java:23-35` `addMapping("/api/**")` only, `allowedOrigins` explicit `http://localhost:3000, :5173, :5500 + http://127.0.0.1:3000,:5173,:5500 + "null"` (file:// double-click demo). No wildcard `*`. `allowedMethods GET,POST,PUT,DELETE,OPTIONS`, `allowedHeaders Content-Type,Accept,Authorization`, `allowCredentials(false)`, `maxAge 3600`. PHI-safe for localhost demo.
   - `vite.config.js:7-15` dev/preview `host 127.0.0.1`, `port 5173`, `strictPort:true` — loopback only. `application.properties:4` `server.address=127.0.0.1` — never `0.0.0.0`.
   - Residual prod-blocker (MEDIUM): drop `"null"` + `:3000/:5500/127` variants, replace with exact `https://hub.health.gov.in` origins; decide `allowCredentials` per session design.

4. **PHI handling — PASS demo-only, LOW accepted (A01)**
   - Synthetic demo data only — disclosed `Landing.jsx:48` `Synthetic demo data only`, footer `208` `no real patient information`, gov-strip + `Help.jsx` runbook. No real PHI in repo, H2 in-memory `jdbc:h2:mem:central_hub` (restart wipes), no PHI in git.
   - `AppContext.jsx:124-132` `hub.recentCentralIds` stores max 5 centralIds (pseudonymous IDs, e.g. `MH-2026-004213`) — no names/phone/diagnosis/Rx in storage. `Profile.jsx:36` `Edits persist to localStorage only`. URLs carry centralId in path/query (`App.jsx:44` `/patients/:centralId`, `PatientDetail.jsx:83-85` `?centralId=` prefill with `encodeURIComponent`) → leaks via history/access logs; mitigated by `Referrer-Policy: no-referrer` (`SecurityHeadersFilter.java:27`), loopback-only, synthetic data.
   - Prod requires: opaque internal IDs in URLs, no centralId in logs, clear recents on logout/role-switch, `httpOnly` sessions, TLS 1.3, AES-256-GCM + KMS envelope for `phone/diagnosis/prescription`, PHI-access audit log + SIEM + 1-year retention.

5. **Security headers — PASS demo (A05)**
   - `SecurityHeadersFilter.java:24-34` (`OncePerRequestFilter`): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, CSP `default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:8086 http://127.0.0.1:8086; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`.
   - `vite.config.js:18` `build.sourcemap:false` — no source-map leak. `index.html:1-17` no inline secrets, no CDN scripts (only Google Fonts `preconnect/stylesheet` — outside backend CSP `default-src 'self'`; frontend served by Vite dev has no CSP meta — accepted demo since backend API responses carry headers; prod static host must emit CSP + `X-Content-Type-Options` too).
   - Missing prod-only (INFO): `Strict-Transport-Security` (http demo — add on TLS terminator), HSTS preload. No gap for localhost demo.

6. **500 generic (no leak) — PASS (A09 / Information Disclosure)**
   - `GlobalExceptionHandler.java:95-104` `handleGeneric` never echoes `ex.getMessage()`; returns `unexpected error, reference <8-char UUID>` + server-side `error ref=…` full-stack log. `41-50` `DataIntegrityViolationException` → generic `duplicate or conflicting data` + `warn` log (never SQL/constraint names); `73-78` `HttpMessageNotReadableException` → generic `malformed or incomplete request body` (never Jackson internals); `57-64` optimistic-lock → generic 409 retry. `toApiError` (`client.js:29-38`) surfaces only safe `message/status`, `Backend unreachable` hint by design with Retry.
   - Minor accepted: `80-84` echoes `IllegalArgumentException` (`from and to hospitals must differ`) and `ResourceNotFound` (`patient 1 not found`) — safe, no internals; keep generic-only policy in prod.

### OWASP Top 10 mapping (FAANG depth)

1. **A01 Broken Access Control — HIGH prod / LOW demo-accepted.** Server open (`/api/**` no Spring Security, no `@PreAuthorize`); `can` map + scope client-only. Demo OK (synthetic + loopback + `DENY` framing). Prod: ABAC/OPA-Rego or Spring AuthZ, zero-trust (mTLS, short-lived creds), deny-by-default, server hospital-scope checks, per-endpoint tests.
2. **A02 Cryptographic Failures — MEDIUM prod.** Plain `http://localhost:8086/api` (`client.js:4-5` with `VITE_API_BASE` override ready), H2 plaintext, blank `sa` password dev-only (`application.properties:13` + `:17-19` H2 console `false` guard + prod `validate`/`open-in-view=false`), `change-me` only in comments + `${MYSQL_PASSWORD}` placeholder (`application-prod.properties:8`). Demo OK. Prod: TLS 1.3, AES-256-GCM + KMS/HSM envelope, MySQL `useSSL=true` encrypted volume, vault secrets, rotation.
3. **A03 Injection — PASS.** Spring Data derived queries + parameterized JPQL, `@Valid` + `@NotBlank/@NotNull/@Future/@Min` on `PatientBody/DoctorBody/ReferralBody/BedBody/BookBody` + `MethodArgumentNotValidException→400`; frontend trims + regex (`Login.jsx:30-40` name/email/role/centralId, `Signup.jsx:28-47` beds 1-5000, phone, centralId `^[A-Za-z]{2}-\d{4}-\d{6}$`, age 0-130) + `encodeURIComponent`; `Signup.jsx:65-67,93-95` 409 friendly recovery (no duplication). WAF defense-in-depth only in prod.
4. **A04 Insecure Design — PASS demo.** Backend invariants behind UX guards (same-hospital 400, UNIQUE centralId/doctor-slot/hospital-ward + 409, `@Version` races). STRIDE: Spoofing→no auth (prod blocker); Tampering→locking+UNIQUE+TLS prod; Repudiation→service ENTER/FAIL logs + error refs (no signed audit yet — prod TODO); Info Disclosure→generic 500+nosniff+no-referrer; DoS→pagination ≤20 + 15s axios timeout (no rate-limit yet — prod TODO); EoP→client roles only (prod blocker).
5. **A05 Misconfiguration — PASS demo.** Loopback, H2 disabled, CORS allowlist, headers filter, `ddl-auto=validate` prod, `sourcemap:false`, Spring Boot 4.1.0/Java 21 current. Prod: CIS hardening, remove `"null"`/extra origins, `open-in-view=false` (already in prod profile), ScoutSuite/Prowler scans.
6. **A06 Vulnerable Components — INFO/LOW.** `package.json`: `axios ^1.7.7`, `react ^18.3.1`, `react-router-dom ^6.26.2`, `recharts ^2.13.0`, `vite ^5.4.11` — recent, no SBOM/scan evidence. Prod: CycloneDX/SPDX SBOM, Dependabot/Snyk/OSV daily + auto-PR, `npm audit`/`mvn dependency-check` in CI block-on-high, pinning, SLSA ≥2.
7. **A07 Auth Failures — HIGH prod / accepted demo.** No password/MFA/passkeys/rate-limit/lockout/breached-check; `localStorage` stealable via XSS (mitigated by 0 XSS sinks + CSP). Prod: WebAuthn/passkeys + risk-based auth + `429` + `HttpOnly Secure SameSite` cookies or JWT access+refresh with claim validation.
8. **A08 Integrity Failures — LOW demo.** No signed builds/SLSA/provenance; `dist/` local build only. Prod: SLSA ≥2, signed commits/tags, verified builds.
9. **A09 Logging & Monitoring — LOW partial PASS.** `LoggingAspect` ENTER/EXIT/FAIL + handler `warn/error ref=` + 8-char correlation ID + uniform `ApiError`; frontend `ErrorBanner` + Retry + `EmptyState` + `role=alert` toasts; no clinical content in logs (only `centralId already exists`/`patient N not found` minimal IDs — redact/hash in prod). Prod: structured JSON security events, SIEM, PHI-access audit (who/when/which), alerting, 1-year retention.
10. **A10 SSRF — PASS.** No user-controlled outbound fetch; only `client.js:64-71` self `GET ${WS_BASE}/ws/central.wsdl` + `connect-src` locked to self+localhost:8086; no `RestTemplate/WebClient/URL(` with user input. Prod: URL allowlist + IMDSv2 + egress filter if integrations added.

### Additional checks

- **Input validation: PASS.** Whitelist regex server (`@Valid`) + client (email/phone/centralId/beds/age) + `noValidate` + inline `Field` errors (server is source of truth).
- **Secrets: PASS demo.** No live keys in `src/` + `frontend-react/src/` (only `blank sa` dev comment + `change-me` placeholders); `dist/*.js` `password/token` hits are axios/react internals, not app secrets.
- **CSRF: LOW/N/A demo.** No cookies/sessions + `allowCredentials:false` → no token needed now; prod with cookies needs `SameSite` + synchronizer tokens on POST/PUT.
- **Rate limiting: MISSING (prod TODO).** No Bucket4j/gateway limits; 60s poll + `document.hidden` guard limits self-DoS only. Add per-IP/user limits on `/book`, `/patients`, `/referrals`.
- **Forgot enumeration: PASS.** `Forgot.jsx:22-23,38-46` always shows success for any valid email (`If X is registered…`) — no oracle; demo has no `/auth/forgot` endpoint (simulated).

## Required Fixes (for dev agents)

> No demo-blocking fixes. Demo PASS as-is on `127.0.0.1:5173` + `127.0.0.1:8086` with synthetic data. Items below are PROD blockers — do not load real PHI or bind `0.0.0.0` until done.

### P0 — prod blockers (real PHI / internet)

1. **Server authN/Z (A01/A07).** Spring Security + OIDC Authorization Code flow; enforce `role→permission` + hospital scope server-side on every controller/service (replace `AppContext.jsx:144-166` client trust); deny-by-default; `401/403` handlers + matrix tests; rate-limit auth + `POST /appointments/book,/patients,/referrals` (`429`, Bucket4j/gateway); wipe `hub.auth` + `hub.recentCentralIds` on logout/role-switch.
2. **TLS + HSTS + prod CORS (A02/A05).** TLS 1.3 + `Strict-Transport-Security` on terminator; `CorsConfig` → exact `https://…` ministry origins, drop `"null"` + `:3000/:5500/127` variants; `VITE_API_BASE=https://…`; static host must also emit headers/CSP.
3. **DB + secrets + KMS (A02).** Prod MySQL `useSSL=true` encrypted volume, `ddl-auto=validate`, `open-in-view=false` (already in prod profile); `${MYSQL_PASSWORD}` from vault (rotate `change-me`); AES-256-GCM envelope via KMS/HSM for `phone/diagnosis/prescription`; encrypted backups + rotation docs.
4. **PHI hygiene (A01).** Opaque IDs in URLs (no `centralId` in path/query/logs), keep `no-referrer`, redact IDs from `LoggingAspect FAIL`/access logs (hash), PHI-access audit log + SIEM + 1-year retention (A09).
5. **Pagination default (A01).** Require `?page&size` or default `PageRequest.of(0,20)` on every `list()` no-params branch; add cap tests.
6. **Headers final (A05).** Keep filter; add HSTS on TLS; reduce CSP `unsafe-inline` to nonces/hashes if feasible; add `Cross-Origin-*` as needed.

### P1 — harden before prod pilot

7. **Validation messages generic.** Centralize `IllegalArgumentException`/`NotFound` messages (no IDs/internals) in handler constant map.
8. **Supply chain (A06/A08).** SBOM (CycloneDX/SPDX), Dependabot+Snyk/OSV daily, `npm audit` + `mvn dependency-check` in CI (block high), pinning, signed commits/tags, SLSA ≥2.
9. **Logging/monitoring (A09).** Structured JSON, auth/access/validation-failure events, correlation-ID propagation to `toApiError` display, SIEM alerts, playbook, 1-year retention. Never log clinical content.
10. **CSRF/session (A01).** If cookies: `HttpOnly Secure SameSite=Lax/Strict` + CSRF tokens on state-changing ops; if JWT: short-lived access + refresh, validate all claims.
11. **SSRF/egress (A10).** Allowlist URLs, disable unused schemes, IMDSv2, egress firewall if outbound added.
12. **Testing.** SAST (CodeQL/Semgrep) + DAST (ZAP) + secrets (gitleaks/TruffleHog) + CORS/headers/pagination/auth-matrix tests in CI; quarterly pentest + bounty for critical paths.

### Verified — no action (keep)

- XSS 0 sinks + `esc()`/`csvCell` + JSX-only + `encodeURIComponent`; CORS allowlist (demo) + loopback + `strictPort`; generic 500/409/400 + correlation IDs; UNIQUE + `@Version` + `@Valid`; H2 disabled + loopback; pagination caps 20; headers filter; `sourcemap:false`; parameterized queries; no secrets; no SSRF surface; `next` sanitized `startsWith('/')`; `Forgot` no-oracle.

---
*Security audit-only: no source edits. Chain: qa-report PASS (912 modules, 26/26) → code-review APPROVED (0 open) → security-audit PASS demo-only, prod BLOCKED on §P0. No deploy.*

## Re-check 2026-10-02 — Security Quick (dev-lead sign-off) — PASS demo-only
> Inputs: `.ai/reports/qa-report.md` PASS 26/26 + build 917 + live probes (CORS ACAO 127.0.0.1:5173, WSDL 200, 409/400 guards) + `.ai/reports/code-review.md` APPROVED 2026-10-02 (0 open, H1/M1-M5/L1-L8 FIXED). Scope localhost demo only, synthetic PHI only. No deploy. Audit-only, no source edits. Sampled `client.js:22-29 esc + 43-46 csvCell`, `CorsConfig.java:23-35`, `AppContext hub.auth`, `Help.jsx:29-33 relative public`, `Layout.jsx:210,318 API_BASE`, `application.properties 127.0.0.1 + H2 mem`.

- **XSS 0 — PASS (A03):** QA static `dangerouslySetInnerHTML 0 + innerHTML 0`, `esc()` + `csvCell` quoting + JSX-only rendering retained. No new sinks in H1/M/L fixes (slot/effectiveWhen, slotStrip, refView, disabled inputs are state/props only).
- **CORS 5173 — PASS demo (A05):** `CorsConfig /api/**` allowlist explicit 3000/5173/5500 + 127 variants + null, no `*`, `allowCredentials false`; `vite.config 127.0.0.1:5173 strictPort`, `server.address 127.0.0.1`, live `ACAO=http://127.0.0.1:5173` + nosniff + DENY. Prod-blocker retained: drop null/extra origins → exact https ministry.
- **Demo auth — PASS demo-only, HIGH prod-blocker (A01/A07):** `localStorage hub.auth` client-only, no JWT, `can.*` mock + role gates bypassable — accepted demo, BLOCKS prod with real PHI (requires Spring Security + OIDC + server RBAC + HttpOnly sessions + rate-limit).
- **Synthetic PHI — PASS demo-only (A01):** QA rows QA Hosp FIX2/CENT-QA-FIX2/Dr QA2 only, H2 mem wipe on restart, disclosed synthetic-only, `Referrer-Policy no-referrer`, centralId in path by design demo. Prod-blocker retained: opaque IDs + KMS + TLS + audit log + vault secrets.
- **Verdict: PASS demo-only.** Chain: qa-report PASS (fresh 2026-10-02) → code-review APPROVED (fresh 2026-10-02) → security-audit PASS demo-only. No deploy.
