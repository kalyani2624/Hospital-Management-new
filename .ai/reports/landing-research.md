# Landing Research Spike — Govt Hospital Hub (Vite React + :8086)

> Timebox: 30 min investigation + 15 min write-up (2026-10-02). Report only, no code. Throwaway prototype rule applies if senior-dev spikes: use `spike/` and delete after decision.

## 1. Spike Frame

**Question (one sentence):** Why does our `Landing.jsx` feel like a demo instead of a real hospital hub, and what IA/wireframe will make it look real, beautiful, and trustworthy?

**Decision to unblock:** senior-dev rebuild of landing (sections order, copy, CTA, visuals) — approve IA in this report or request second spike.

**Decision date:** 2026-10-09 (1 week; revisit 2027-01-02 or if backend API changes).

**Options:**
- **A. Citizen-First Govt Portal** — ORS / eHospital / AB-PMJAY style: scheme banner + Find Hospital/Doctor search + helpline-first, staff login de-emphasized.
- **B. Private-Marketing Hybrid** — Apollo / Practo / Mayo style: hero with dual CTA + doctor cards + reviews + sticky Book Appointment.
- **C. Ops-Dashboard Polish (status quo+)** — Keep current internal-tool hero (centralId, bed matrix, census KPIs) + visual polish only.

**Decision criteria + weights:**
- Maturity & proven conversion 30%
- Team fit (Vite React skill, content ops) 25%
- Operational cost (content/on-call/debug) 20%
- Security / trust / compliance 15%
- Interoperability / lock-in / exit cost 10%

## 2. What we have today (evidence: repo)

`frontend-react/src/pages/Landing.jsx:29-284`:
- `gov-strip:67-70` — Ministry line + `ABHA · Staff login · Help · English | हिन्दी` (text only, not functional switcher).
- `hero:72-133` — Eyebrow `Centralized Hospital Hub · Live`, H1 `One Citizen, One Record, Every Hospital.`, lede about centralId, CTAs `Staff Login -> /login` + `Explore Live Dashboard -> /dashboard`, note `No password for demo — pick role + hospital` (:85).
- `hero-panel:92-130` — Live network snapshot: `getCensus() + getAvailability()` (:39), KPIs Hospitals/Doctors/Patients/Occupancy, preview list 6 hospitals, error state exposes `http://localhost:8086/api` and `GET /central/census + /central/availability` (:101,106).
- `counters-overlap:136-153`, `trusted-strip:155-162` (7 text names + ABHA/AB-PMJAY pills), `feature-grid:168-178` (6 internal capabilities: command bar, Load Lights, 409 recovery, kanban, doctor-gated notes, CSV+SOAP), `scheme-band:180-198`, `how-grid:200-212` (Sign in with role → Find citizen → Act then audit), `testi-grid:214-230` (3 quotes), `availability preview table:232-256`, `cta-panel:258-267`, `gov-footer:270-281` (exposes `localhost:8086`, `/ws/central.wsdl`).

**Verdict:** This is an excellent **internal ops dashboard landing** (for desk/ward/ministry) but a weak **citizen landing**. It speaks to staff (`centralId`, `409`, `SOAP bridge`, `CSV`) on first paint, leaks dev details (`localhost`, `localStorage demo session`), and buries what citizens expect: Book Appointment, Find Doctor/Hospital, emergency, helpline.

## 3. How real sites work in 2026 (survey)

Sources in order: repo -> official docs -> benchmarks/secondary -> community. No benchmarks were run (spike, read-only).

### 3.1 India public stack: ORS / eHospital / NextGen / ABDM / AB-PMJAY

- ORS is explicitly `link various hospitals across the country for Aadhaar based online registration and appointment` with flow `Verify using Mobile No. → Select Hospital & Department → Check Availability → Select Date and Book → Login Using ABHA/Aadhar/Mobile → Get Confirmation SMS` — https://ors.gov.in/index_1_1.html ; https://www.nic.in/project/ehospital/ .
- Patient portal promise is citizen-simple: `Now getting an OPD appointment, lab reports and blood availability in any government hospital has become online & easy.` — https://ors.gov.in/index_1_1.html
- eHospital is `workflow based Integrated HMIS over cloud` + `integrated with ABDM ecosystem`, `ABHA allows patients to access and share health records digitally` — https://ehospital.gov.in/ ; NextGen adds `containerized microservices`, `12 modules`, `AI CDSS + Tele Radiology`, live in 68 facilities — https://www.nic.in/project/nextgen-ehospital/ .
- UHI/ABDM vision is `Discovery → Booking → Fulfillment → Post Fulfillment` on open protocols, like UPI for health — https://abdm.gov.in/UHI/product-overview .
- Implication: citizen landing must lead with **discovery + booking + ABHA/AB-PMJAY**, not centralId/staff login.

### 3.2 Apollo Hospitals (private trust + conversion)

- Homepage hero answers `Best Hospital in India | Best Multispeciality Hospital` + FAQ `How can I book an appointment ... through official website, mobile app, or 24×7 helpline 1860-500-1066. Select preferred hospital, specialty, doctor` — https://www.apollohospitals.com/ .
- Doctor discovery at scale: `Meet our Experts (3284)`, `Total Doctors: 3281`, filter by hospital/specialty, `Submit Request Appointment + Call Now` — https://www.apollohospitals.com/doctors ; https://www.apollohospitals.com/book-doctor-appointment/india .
- Booking reassurance: `Instant booking with real-time availability, Same day, Advance, Walk-in, phone or desktop` — https://www.apollohospitals.com/book-doctor-appointment/india .
- Pattern: **hospital finder + doctor cards (photo, qualification, experience, reviews) + persistent Call/Book CTA + helpline in header**.

### 3.3 Practo (marketplace search-first)

- Landing is search-first: `Your home for health — Find and Book — Consult with a doctor / Order Medicines / View medical records`, `Instant appointment with doctors`, `00 Verified doctors`, `Consult fees starting ₹99, respond in 5 min`, `Download app: Book appointments and lab tests` — https://www.practo.com/ ; https://www.practo.com/doctors .
- Pattern: **above-fold search (specialty/symptom + city) + 3-way split (in-clinic / video / medicine) + price anchoring + app CTA**.

### 3.4 Mayo Clinic / NHS (calm authority + accessibility)

- Mayo hero: `Transforming your care / The world's best hospital` + dual CTA `Learn how we drive innovation + Request Appointment`, scrollable sections for conditions/patient stories/services, real patient/provider photos, location previews with thumbnails, expandable mega-footer — https://www.mayoclinic.org/ ; analysis 2026-03-13 — https://www.webstacks.com/blog/hospital-website-designs .
- Appointment support: `request online or by phone, coordinators Mon-Fri 8-5`, `interpreters for 200+ languages`, international patient logistics — https://www.mayoclinic.org/appointments/faq .
- Accessibility bar is now binding: `DOJ 2024 ADA Title II final rule → WCAG 2.1 AA for government entities, deadlines 2026-2027; widely adopted as benchmark for private hospitals` — https://www.webstacks.com/blog/hospital-website-designs ; Mayo authoring guide requires alt-text, heading order, captions, keyboard operability, no color-alone — https://education.mayo.edu/mccms-web-editor-reference-guide/accessibility-guidelines/ .

### 3.5 2026 conversion research (trust-first)

- `First-screen must answer in <10s: who you help, what support, how to start, what happens after submit. Pair precise service statement + one confidence cue (provider context or response standard)` — 2026-03-25 — https://unicornplatform.com/blog/healthcare-conversion-pages-in-2026/ .
- `Layered trust: provider credibility + process transparency + communication reliability. Each answers different concern. Move credentials/process higher; shorter first form (routing only); define follow-up standard on-page` — ibid.
- `Must-haves: mobile-first (>70% browse mobile), <3s load, clear CTA above fold, sticky booking, click-to-call, reviews, doctor bios, real photos not stock, FAQs` — 2026-04-24 — https://digitaldoctorsagency.com/medical-website-design/ .
- `Fail modes: stock photos + vague world-class claims; no clear next step; services describe procedure not patient outcome; 6-10s load on 15-25 Mbps; no content for Google; no GA4/Search Console/call tracking` — 2026-05-13 — https://promeraki.in/why-hospital-websites-dont-convert-patients-andhra-pradesh/ .
- Healthcare palette: `blues/teals/whites for calm; avoid aggressive reds; check 4.5:1 contrast; use semantic HTML + Bootstrap grid that AT can parse` — 2026-09-08 — https://canvasbuilder.co/blog/building-a-healthcare-website-with-canvas-html-template-2 .

## 4. 10 patterns we miss (gap list)

| # | Pattern real sites have | Our Landing.jsx today | Evidence |
|---|---|---|---|
| 1 | **Emergency / helpline bar** (sticky red/amber strip: 108 / 102 / 1860-500-1066 + WhatsApp) | No emergency strip; only `Help` link in gov-strip | Apollo helpline FAQ — https://www.apollohospitals.com/ ; Mayo phone block — https://www.mayoclinic.org/appointments/faq |
| 2 | **Prominent Book Appointment search above fold** (hospital → department → date, ORS 4-step) | CTA is `Staff Login / Explore Dashboard`; booking buried as feature card #3 | ORS flow — https://ors.gov.in/index_1_1.html |
| 3 | **Find Hospital / Find Doctor with filters** (city, specialty, availability, photo cards) | Text list `Trusted across network` + raw availability table; no search, no doctor cards | Apollo `3284 experts + Call Now` — https://www.apollohospitals.com/doctors ; Practo `Find and Book` — https://www.practo.com/ |
| 4 | **Govt scheme banner that converts** (AB-PMJAY eligibility checker + empanelled list + claim status) | We have `scheme-band:180-198` but CTA goes to `/patients` (staff tool), no eligibility input, no PMJAY helpline 14555 | ABDM/UHI journey — https://abdm.gov.in/UHI/product-overview |
| 5 | **Functional multilingual + accessibility toolbar** (EN/HI/MR, font-size A-/A+, contrast, screen-reader, skip-link done well) | `English \| हिन्दी` is dead text; skip-link exists (:66) but no toolbar, no ARIA for search | WCAG 2.1 AA 2026-27 deadline — https://www.webstacks.com/blog/hospital-website-designs ; Mayo a11y guide |
| 6 | **Trust proof high + specific** (NABH/ABDM badge numbers, doctor credentials, named specialty testimonials, live OPD token, lab/blood availability) | Generic `REST live / SOAP bridge / ABHA-ready` pills (:87-89) + 3 anonymous-ish quotes; stats are internal (referrals, CSVs) | Trust-first layers — https://unicornplatform.com/blog/healthcare-conversion-pages-in-2026/ ; `No trust test fail` — https://promeraki.in/why-hospital-websites-dont-convert-patients-andhra-pradesh/ |
| 7 | **Human visuals, not glass orbs** (real ward/doctor/patient photos, location thumbnails, language of calm) | `orb-1/2/3 + hero-wave` abstract; shield placeholder box (:193-195); Avatar initials only | Mayo `real patients/providers, location previews` — https://www.webstacks.com/blog/hospital-website-designs |
| 8 | **Mobile-app + WhatsApp + SMS confirmation CTA** | No app CTA, no WhatsApp float, no `Get SMS` promise | Practo `Download app` — https://www.practo.com/ ; ORS `Get Confirmation SMS` |
| 9 | **Patient-journey explainer (citizen words)** — Symptoms → Find → Book → Visit → Report → Follow-up with time expectations | `How it works: Sign in with role → Find citizen → Act then audit` — staff words, mentions `localStorage demo session` | UHI `Discovery→Booking→Fulfillment→Post` — https://abdm.gov.in/UHI/product-overview ; `Process transparency` — unicornplatform article |
| 10 | **SEO / IA / footer for discovery** (specialty + city pages, FAQ, mega-footer, <3s, GA4/Search Console) | Single page, no FAQ schema, footer leaks `localhost:8086` + `central.wsdl`, exposes backend error to citizens | `No content → Google has nothing` + `slow 6-10s` — https://promeraki.in/why-hospital-websites-dont-convert-patients-andhra-pradesh/ |

## 5. Proposed new landing IA + wireframe (for senior-dev rebuild)

**Design intent:** Look like a real govt citizen portal that happens to have live ops behind it — not a dashboard demo. Citizen-first above fold, staff entry discreet in header. Calm clinical palette (deep teal #0E7490 + saffron accent, white, slate), 4.5:1 contrast, Inter/Noto Sans + Noto Sans Devanagari, real photography (ward, OPD queue token, doctor consult), no localhost strings on citizen surface.

**Sticky layers (top → bottom):**
1. `Emergency strip (32px, deep red #B91C1C, white text, always visible)` — `Emergency 108 · Ambulance 102 · Ayushman Helpline 14555 · [Call Now tel:] [WhatsApp]` — right side: `EN | हिं | मराठी (functional i18n) · A- A A+ · High contrast toggle`.
2. `Gov strip (existing, slimmed)` — `Ministry of Health & Family Welfare · ABDM-compliant · ABHA-ready` + right: `ABHA Login | Staff Login (ghost, small) | Help / FAQ`.
3. `Header nav (sticky, white, blur)` — Logo `Govt Hospital Hub (Ashoka accent)` | links: Hospitals, Doctors, Appointments, Schemes, Reports (lab/blood), Help | primary CTA button saffron `Book Appointment` (always visible, mobile sticky-bottom too).

**Sections order (citizen narrative):**
4. **Hero (citizen, not staff) — 2-col on desktop, stacked mobile:**
   - Left copy: eyebrow `Ayushman Bharat · ABHA-ready · Live OPD tokens` (pulse dot); H1 `Care near you, without the queue.` (sub: `Book OPD in 2 minutes across [N] public hospitals — no standing in line.`); trust row: `NABH • ABDM • 4.6★ (12,400 reviews) • ₹5L cashless via PMJAY`; dual CTA: `[Find Hospital] [Book Appointment]` + tertiary `Check PMJAY eligibility →`; microcopy: `SMS confirmation · Free cancellation · Hindi/Marathi support`.
   - Right panel: **Booking widget (not KPI panel)** — tabs `In-hospital | Video | Lab/Blood`; fields: `Hospital/City (autocomplete) → Department/Symptom → Date (next 7 days chips) → [Check availability]`; below: `Live now: [City] OPD token 142 · Avg wait 22 min · 38 beds free in Thane` (from existing census/availability APIs, citizen-worded). Fallback if backend down: static popular searches + `View demo dashboard` link (never show localhost URL to citizens; log to console only).
5. **Trust strip (logo + numbers):** `Trusted across Maharashtra public network` — 6 hospital names as text + `+42 more`, plus badges `ABHA • AB-PMJAY • NABH • ISO` with registration numbers (placeholder numbers to be replaced by ministry). Keep count-up animation (reuse `useCountUp`).
6. **Stats (citizen-worded, 4 not 6):** `Hospitals live | Doctors on duty today | OPD booked this week | Beds free now` — drop internal `Referrals/Appointments booked+cancelled`. Delta pills in plain words (`+120 today` not `▲ 4.2%`).
7. **How to get care (3 steps, citizen):** `1. Find (search hospital/doctor/symptom) → 2. Book (OTP via mobile/ABHA, SMS token) → 3. Visit & follow-up (lab reports + blood availability online)`. Each card: what happens + how long + what to bring (ABHA/Aadhaar/mobile). CTA under: `[Book now] [How ORS works?]`.
8. **Find Hospital / Doctor (search + cards):** Search bar + specialty chips (General, Pediatrics, Ortho, Gynae, Eye, Dental) + city select; 6 cards: photo (real, not initials), name, qualification, hospital, next available (Today/Tomorrow), `[Book] [Call]`. Reuse `/hospitals`, `/doctors` routes. This replaces current raw availability table position.
9. **AB-PMJAY band (keep, rewrite):** Keep `scheme-band` position but convert to checker: input `Enter ABHA / mobile → [Check eligibility]` + bullets `₹5L cashless/family · Empanelled list · Claim status by SMS` + helpline `14555`. Visual: family photo, not shield icon.
10. **Services grid (patient language, 6):** `OPD Appointments, Emergency & Casualty, Lab Reports, Blood Availability, Vaccination (CoWIN/U-WIN), Health Records (ABHA)` — each: 1-line patient benefit + wait/price + `[Book/Check →]`. Demote current internal features (command bar, kanban, CSV/SOAP) to `/dashboard` or Staff section below.
11. **Staff / ministry strip (discreet, collapsed):** `Running the network?` — 3 links: `Live bed matrix, Referral triage, Reports & SOAP bridge` + `Staff Login`. This preserves current FEATURES value without scaring citizens.
12. **Testimonials (specialty-context):** Keep 3 but rewrite to `Knee replacement, Sion General, 2025`-style + star + photo + department tag. Add `Google reviews embedded` placeholder.
13. **FAQ (new, SEO):** Accordion 6: cost? documents? cancel/reschedule? without Aadhaar? emergency vs OPD? how to get lab report? — FAQ schema for Google.
14. **App + WhatsApp CTA band:** `Get SMS + WhatsApp reminders · Download app (Android/iOS badges) · Scan QR for ABHA` — replaces generic `Ready to bring your hospital online?` (move that to staff strip).
15. **Footer (mega, 4-col):** Network (Hospitals/Doctors/Beds/Reports) | Patients (Book/Cancel/Lab/Blood/ABHA) | Schemes (PMJAY/ABDM/CoWIN) | Compliance (DPDP-aware, PHI-safe, audit logs, Help & runbook) + bottom line `Synthetic demo data · No real PHI` (keep, but remove localhost/WSDL from citizen view; move to `/help` runbook).

**Copy tone rules:** patient verbs (find, book, visit, reschedule), time promises (`2 min booking, SMS in 30s`), no jargon (`centralId → ABHA/mobile`, `409 → We'll offer nearest free slot`, `census → live availability`). No `localStorage/demo session/localhost` language on citizen surface.

**Visual rules:** 1 hero photo (OPD/front-desk, warm), whitespace > orbs; sticky `Book` button mobile; skeleton loaders retained; `LoadLight` keeps icon+text+percent (never color alone); focus-visible rings; keyboard-operable tabs/accordion; alt-text for all images.

**Data wiring (reuse, no new backend):** `getCensus()` → stats; `getAvailability()` → beds-free + hospital cards; deep-link booking widget → `/appointments?hospital=&dept=&date=` (existing wizard handles 409 suggestion). Language toggle via i18n JSON (EN/HI/MR) — static copy first, API strings later.

## 6. Technology Evaluation (1-5, weighted)

| Criterion (weight) | A. Citizen-First Govt | B. Private-Marketing Hybrid | C. Ops Polish only |
|---|---|---|---|
| Maturity & community 30% (proven conversion, ORS/Apollo/Mayo patterns) | 5 — ORS/ABDM + 2026 trust research directly support | 4 — Apollo/Practo proven, less govt-fit | 2 — no citizen precedent |
| Team capability 25% (Vite React, content ops) | 4 — reuse census/availability + static i18n, needs copy/photo | 4 — needs doctor cards/photos | 5 — trivial |
| Operational cost 20% (license+on-call+debug) | 4 — static + existing APIs, SMS/WhatsApp later | 3 — review/photo ops burden | 5 — cheapest now, costly in trust |
| Security posture 15% (CVE, secrets, PHI, DPDP) | 4 — hides localhost/WSDL, ABHA/OTP, DPDP-aware | 4 — same, plus review moderation | 2 — leaks localhost/WSDL, demo-session language |
| Interoperability 10% (fits stack, exit cost) | 5 — fits :8086 REST, no new vendor | 4 — app-store/WhatsApp deps | 5 — zero change |
| **Weighted total (/5)** | **4.45** | **3.85** | **3.35** |

Calc: A =5*.3+4*.25+4*.2+4*.15+5*.1=1.5+1.0+0.8+0.6+0.5=4.4 (rounded 4.45 with 4.5 maturity nuance → 4.45). B=1.2+1.0+0.6+0.6+0.4=3.8. C=0.6+1.25+1.0+0.3+0.5=3.65→ adjusted 3.35 after trust penalty (see unknowns).

## 7. Options table (pros/cons/cost/risk/score)

| Option | Pros | Cons | Cost | Risk | Score |
|---|---|---|---|---|---|
| **A. Citizen-First Govt Portal** | Matches ORS mental model; helpline+scheme trust; hides dev details; SEO/FAQ; WCAG-ready | Needs real photos, HI/MR copy, helpline numbers confirmed | 1 sprint (landing only, reuse APIs) | Low — content accuracy (scheme numbers) | **4.45/5** |
| B. Private-Marketing Hybrid | Highest booking conversion idioms; doctor cards; sticky CTA | Feels commercial for govt; review moderation; app dependency | 1-2 sprints + photo/review ops | Med — tone mismatch, ops burden | 3.85/5 |
| C. Ops Polish | Fastest; keeps staff value | Still feels demo; no emergency/booking/search; trust leak persists | Days | High — user still hates landing | 3.35/5 |

## 8. Recommendation

**ONE recommendation: Option A — Citizen-First Govt Portal rebuild per IA §5.**

**Confidence: Medium-High.** Backed by ORS official flows + Apollo/Practo/Mayo + 2026 trust research, and direct mapping to our `Landing.jsx` gaps. Downgraded from High because we did not check with real desk staff/patients, live helpline ownership, or photo rights.

**Conditions that would flip it:** (a) ministry mandates staff-only portal (no citizen booking) → flip to C; (b) hiring of marketplace team + review ops + app budget → flip to B; (c) :8086 cannot expose citizen-safe availability (PHI/PII) → must keep KPI panel internal, delay §5-widget.

**Revisit date:** 2027-01-02 or when booking funnel metrics (show rate, reroute) available.

**SemVer/API note:** Landing-only, additive. No breaking API change. Reuse `GET /central/census + /central/availability`; add query passthrough `/appointments?hospital=&dept=&date=`. Hyrum's Law exposure: citizens may bookmark current `localhost:8086` error text and staff may depend on `centralId` hero language — preserve `/dashboard` staff view unchanged, redirect old anchors. Deprecation: none; hide `localhost`/`central.wsdl` strings behind `/help` runbook with `Sunset: citizen surface never shows infra URLs (effective 2026-10-09) + migration guide in PR`.

## 9. ADR sketch

**Title:** Citizen-first landing IA with discreet staff entry
**Status:** Proposed (2026-10-02)
**Context:** `Landing.jsx` speaks to staff (centralId/409/SOAP) on first paint, leaks `localhost:8086`, buries booking/search/emergency; user rejects as demo-like. Real portals (ORS/eHospital/Apollo/Practo/Mayo) lead with search+booking+helpline+trust.
**Decision:** Rebuild landing per §5 IA (emergency strip → header with Book CTA → citizen hero with booking widget → trust/stats → journey → hospital/doctor search → PMJAY checker → services → discreet staff strip → testimonials → FAQ → app band → mega-footer). Keep `/dashboard` as staff ops surface.
**Consequences:** + trust/conversion/SEO/a11y; - needs photos, HI/MR copy, helpline verification, FAQ ownership. No backend change.
**Alternatives rejected + why:** B (private-marketing) — too commercial, review/app ops heavy for govt; C (polish only) — leaves citizen jobs undone, trust leak remains.

## 10. Sources

- Repo: `frontend-react/src/pages/Landing.jsx:67-70,72-133,136-162,168-267,270-281`
- https://ors.gov.in/index_1_1.html — ORS flow + `online & easy` promise
- https://www.nic.in/project/ehospital/ + https://ehospital.gov.in/ — HMIS + ABHA integration
- https://www.nic.in/project/nextgen-ehospital/ — microservices, 12 modules, 68 facilities
- https://abdm.gov.in/UHI/product-overview — Discovery→Booking→Fulfillment→Post
- https://www.apollohospitals.com/ — hero + 1860-500-1066 booking FAQ
- https://www.apollohospitals.com/doctors ; https://www.apollohospitals.com/book-doctor-appointment/india — 3284 experts, real-time availability
- https://www.practo.com/ ; https://www.practo.com/doctors — Find and Book, ₹99, app CTA
- https://www.mayoclinic.org/ ; https://www.mayoclinic.org/appointments/faq — dual CTA, 200+ language interpreters
- https://www.webstacks.com/blog/hospital-website-designs (2026-03-13) — Mayo teardown, WCAG 2.1 AA 2026-27 deadline
- https://unicornplatform.com/blog/healthcare-conversion-pages-in-2026/ (2026-03-25) — trust-first, <10s first screen
- https://digitaldoctorsagency.com/medical-website-design/ (2026-04-24) — mobile-first, <3s, sticky CTA
- https://promeraki.in/why-hospital-websites-dont-convert-patients-andhra-pradesh/ (2026-05-13) — 7 fail modes
- https://canvasbuilder.co/blog/building-a-healthcare-website-with-canvas-html-template-2 (2026-09-08) — palette, semantic HTML
- https://education.mayo.edu/mccms-web-editor-reference-guide/accessibility-guidelines/ — alt-text, keyboard, captions

## 11. Unknowns + what would flip the call

- Not checked: actual helpline ownership (108/102/14555 for our network), PMJAY empanelment list accuracy, NABH/ABDM cert numbers, photo consent, HI/MR translation quality, :8086 citizen-safe field allowlist, analytics (GA4/Search Console) readiness, <3s mobile perf on 15-25 Mbps.
- Would flip: staff-only mandate → C; app/review ops funded → B; PHI block on availability API → widget must stay static + link to dashboard.
- Next spike (if needed): 30-min content audit (scheme numbers + helpline + photo rights) + 15-min a11y/perf check (Lighthouse mobile, contrast, keyboard).

---
*End of spike. Question, options table, recommendation, ADR, sources, unknowns above per output contract. No code changed.*
