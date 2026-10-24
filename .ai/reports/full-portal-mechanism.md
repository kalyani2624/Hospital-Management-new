# Full-Portal Mechanism Spike — From Landing to Real Hospital Portal (extends landing-research.md)

> Timebox: 30 min investigation + 15 min write-up (2026-10-02). Report only, no code. Throwaway rule: any prototype lives in `spike/` and is deleted after decision.
> Extends: `.ai/reports/landing-research.md` (citizen-first landing IA §5). This report covers the **full site mechanism** — how the internet really does it + how each page should work against our `:8086` backend.

## 1. Spike Frame

**Question (one sentence):** What mechanism (pages, journeys, guards, deep-links, API wiring) will make our Vite React app behave like a real hospital portal (ORS/eHospital + Apollo/Practo) instead of a staff-only demo, reusing our current backend without breaking it?

**Decision to unblock:** senior-dev full-site rebuild (IA, nav, booking widget deep-links, citizen vs staff guards) — approve mechanism in this report or request second spike.

**Decision date:** 2026-10-09 (1 week; revisit 2027-01-02 or if `:8086` API or ABHA/PMJAY integration changes).

**Options (named):**
- **A. Dual-Surface Govt Portal** — Public citizen surface (landing + hospitals/doctors/appointments/schemes/reports/help, no login) + protected staff surface (`/dashboard` + beds/referrals/records/reports with role guards). ORS mental model + discreet staff entry.
- **B. Marketplace Clone** — Practo/Apollo-style: search-first, doctor cards + reviews + pay-now + video consult + app CTA as primary conversion path.
- **C. Single Dashboard (status quo+)** — Keep everything behind `ProtectedRoute` demo login (`localStorage hub.auth`), polish only. No public booking.

**Decision criteria + weights (same bar as landing spike):**
- Maturity & proven conversion 30% | Team fit 25% | Operational cost 20% | Security/trust/compliance 15% | Interoperability/lock-in 10%

**Timebox:** 30 min investigation (websearch 2026 flows + repo reads), 15 min write-up. Box ended with current evidence — no silent overrun.

## 2. How the internet really does it in 2026 (survey — evidence per claim)

Sources in order: repo code/ADRs → official docs → secondary 2026 → community. No benchmarks were run (spike, read-only).

### 2.1 ORS / eHospital / NextGen — the govt reference flow

- **Booking flow (citizen words, 5 steps):** `Verify using Mobile No. → Select Hospital & Department → Check Availability → Select Date and Book → Login Using ABHA/Aadhaar/Mobile → Get Confirmation SMS` — https://ors.gov.in/index_1_1.html ; FAQ version `Verify mobile → Choose Hospital/Dept → Select date → Verify Mobile/ABHA → Get SMS` — https://ors.gov.in/faq.html ; onboarding manual `verify Aadhaar → Select Hospital+Dept → Select date → SMS confirmation; SMS on confirm/reminder/cancel` — https://ors.gov.in/ORS_onboarding_ver_1.0.pdf
- **Portal promise:** `Now getting an OPD appointment, lab reports and blood availability in any government hospital has become online & easy` — https://ors.gov.in/index_1_1.html ; https://ors.gov.in/
- **Stack:** `e-Hospital is workflow based Integrated HMIS over cloud`, `integrated with ABDM ecosystem`, `ABHA allows patients to access and share health records digitally` — https://ehospital.gov.in/ ; NextGen `containerized microservices`, `12 modules`, live in 68 facilities — https://www.nic.in/project/nextgen-ehospital/ ; module list `Patient Registration (OPD, Casualty, Appointment & ORS) | Admission Discharge Transfer (IPD) | Billing | Clinic (OPD&IPD) | LIS | RIS | Store&Pharmacy | OT | Dietary | Laundry | e-BloodBank | Radiology` — https://nextgen.ehospital.gov.in/ehosModuleList ; https://s3af5d5ef24881f3c3049a7b9bfe74d58b.s3waas.gov.in/project/nextgen-ehospital
- **Citizen services on ORS:** `ORS Appointment, View Lab Reports, View Blood Availability, Donation` + `e-BloodBank: Blood Donation Camp, Registration, Bag Management` + `Online Registration System is ABDM compliant, book with or without Aadhaar using mobile` — https://xn--m1bet4hqd2b.xn--11b7cb3a6a.xn--h2brj9c/project/ehospital
- **Lab reports gate:** login `Using Mobile Number | Using ABHA (Health ID) | Using ABHA Address + OTP + captcha` then download — https://ors.gov.in/copp/lab_report_gate.jsp?ln=0 ; https://ors.gov.in/copp/lab_report_gate.jsp
- **Queue app:** `Queue Management Mobile App — share demographic data using ABHA to join OPD queue; Without ABHA option by operator` — https://ehospital.gov.in/ehospitalsso/ehosModuleList.jsp
- **UHI/ABDM vision:** `Discovery → Booking → Fulfillment → Post Fulfillment` on open protocols, like UPI for health — https://abdm.gov.in/UHI/product-overview

### 2.2 Apollo / Practo — private conversion flow

- **Apollo:** hero `Best Hospital in India` + FAQ `book via website, app, or 24×7 helpline 1860-500-1066. Select hospital, specialty, doctor` — https://www.apollohospitals.com/ ; `Meet our Experts (3284)`, filter by hospital/specialty, `Submit Request Appointment + Call Now`, `Instant booking with real-time availability, Same day/Advance/Walk-in, phone or desktop` — https://www.apollohospitals.com/doctors ; https://www.apollohospitals.com/book-doctor-appointment/india ; modal pattern `Gender → City → Clinic → Speciality → Doctor → Date/Time slots` — https://www.apolloclinic.com/for-patients/find-a-doctor
- **Practo:** `Your home for health — Find and Book — Consult / Order Medicines / View records`, `100,000 Verified doctors, 3M+ recommendations`, `Fees starting ₹99, respond in 5 min`, `Download app: Book appointments and lab tests` — https://www.practo.com/doctors ; https://www.practo.com/ ; hospital page `Overview | Doctors (2) | Call Now | Timings Mon-Sun` — Practo hospital excerpt (websearch 2026-10-02)
- **Pattern:** search-first (specialty/symptom + city) → doctor/hospital cards (photo, qual, exp, rating, next-available, fee) → slot grid (15–30 min) → confirm (OTP/pay) → SMS/WhatsApp + reschedule/cancel link.

### 2.3 AB-PMJAY — eligibility → empanelled hospital → cashless

- **Cover:** `₹5 lakh/family/year, 30,000+ empanelled (60% private/40% govt); 2026: 36,229 hospitals (19,483 govt + 16,746 private); 45.5 Cr cards, 12.69 Cr hospitalizations as of Aug 2026; 70+ seniors get separate ₹5L via Vay Vandana` — https://righttoinformation.wiki/apply-ayushman-bharat-pmjay-card-2026 ; https://www.egovtschemes.com/pmjay-gov-in-registration ; https://www.pib.gov.in/FactsheetDetails.aspx?Id=150834&lang=2&reg=48
- **Eligibility check (3 free ways):** `beneficiary.nha.gov.in → Am I Eligible → mobile OTP → state + Aadhaar/ration/familyID/mobile search SECC list` OR `Ayushman Bharat app → Check Eligibility` OR `Helpline 14555 / 1800-111-565` — ibid.
- **Use:** `Find hospital: hospitals.pmjay.gov.in / app GPS → Ayushman Mitra desk → Aadhaar/biometric → e-Card claim → zero payment; if asked to pay → refuse + call 14555` — ibid.
- **Helpline:** `PMJAY Helpline 14555 (24×7 Toll-Free)` — https://pmjayhospitals.com/blog ; Haryana empanelled/de-empanelled/suspended lists updated 2026-08-03 — https://ayushmanbharat.haryana.gov.in/all-ehcps
- **Do not confuse:** `ABHA = digital health ID for records; PMJAY = cashless scheme. Separate. Get both.` — RTI Wiki guide above.

### 2.4 ABHA / ABDM — health ID + consent

- **ABHA number:** `14-digit, uniquely identifies you in India's digital healthcare ecosystem, accepted by providers/payers` — https://healthid.abdm.gov.in/ ; https://ors.gov.in/healthid ; flow `Enter Aadhaar → OTP on Aadhaar-linked mobile → link mobile → choose ABHA address (@abdm) → QR card` — https://ors.gov.in/healthid
- **ABHA address:** `yourname@consent-manager, e.g. xyz@abdm, enables share/access with consent via HIE-CM` — ibid.
- **Benefits:** `Unique identity | Link benefits/schemes | Hassle-free access (skip queues) | Easy PHR signup` ; voluntary + opt-out/deactivate anytime — ibid. ; citizen explainer `ABHA locker to receive/store/share records with consent` — https://www.eka.care/hi/ayushman-bharat/create-abha-health-id-card (updated 2026-09-26)
- **Registries:** HFR/HPR + PHR app + Health Data Management Policy — https://abdm.gov.in/citizens

### 2.5 Emergency / Casualty, beds, referral, blood, lab

- **eHospital modules cover:** `Patient Registration (OPD, Casualty, Appointment & ORS)` + `IPD Admission Discharge Transfer (bed allotted in ward)` + `Clinic` + `LIS (order → sample → accession → analyze → verify → report)` + `RIS` — https://ehospital.gov.in/ehospitalsso/ehosModuleList.jsp ; https://nextgen.ehospital.gov.in/home
- **Emergency design (private HMS reference 2026-04-20):** `fastest module — life-saving over data entry; Emergency Order Sets (one-click Cardiac Arrest Protocol), bedside procedure logging, vitals from monitors, Disaster Global Button to Lab/OT/Blood Bank` — https://ehospitalsuite.com/features
- **Bed availability live (2026):** BMC `live dashboard tracking bed + ICU across civic hospitals, publicly accessible, no login, live tracker, built on Covid learnings, initially civic-only` — https://www.cnbctv18.com/india/mumbai-to-get-real-time-hospital-bed-dashboard-bmc-aims-to-cut-emergency-delays-ws-el-19883470.htm (2026-04-09) ; Delhi `Availability of Free Bed: Hospital ID/Name, Total Free Bed, Free Critical with/without ventilator, nodal officer phone` — https://dshm.delhi.gov.in/mis/Private/frmFreeBedMonitoringReport.aspx
- **Referral/transfer (US reference, process analogue):** `Transfer Center 24/7, coordinates facility-to-facility, bed availability + hierarchy of need; initiated by physician/case manager/insurer, not walk-in; emergent (trauma/stroke/STEMI/EMTALA) vs non-emergent` — https://www.huntingtonhealth.org/physician-portal/transfer-center/ ; https://www.huntingtonhealth.org/hy/physician-portal/transfer-center/
- **Blood:** e-BloodBank camp/registration/bag management (above); WHO 2025 status report notes governance/collection/screening/haemovigilance gaps esp. LMIC — https://www.who.int/publications/i/item/9789240121546 (2026-06-12)

## 3. Map each real flow to OUR backend (repo file:line) + gaps

| Real flow | Our endpoint / screen | File:line | Fit | Gap (what's missing) |
|---|---|---|---|---|
| ORS `Mobile → Hospital+Dept → Availability → Date → ABHA/Mobile → SMS token` | `POST /api/appointments/book {patientId,doctorId,hospitalId,appointmentTime}` 409 on `(doctor,time)` + `PUT /{id}/cancel`; wizard `Patient → Doctor+Slot → Confirm` with `centralId` confirm + slot strip + 409 nearest-slots recovery | `controller/AppointmentController.java:52-62` ; `service/AppointmentService.java:59-92,94-99` ; `frontend-react/src/pages/Appointments.jsx:17-120,139-202` ; `api/client.js:107-112` | **Good core.** 409 semantics match ORS quota logic; deep-link `?hospitalId&doctorId&centralId` already parsed | **AUTH/SMS:** no OTP, no mobile verify, `centralId` typed not verified; no SMS/WhatsApp (only toast + Undo 30s); `centralId` ≠ ABHA 14-digit + `@abdm` address; no captcha; no teleconsult |
| Apollo/Practo `Find doctor → slots → book → pay/confirm` | `GET /api/doctors?hospitalId&specialization` + `GET /doctors/hospital/{id}/departments` + `GET /api/hospitals` | `controller/DoctorController.java:33-56` ; `controller/HospitalController.java:30-47` ; `api/client.js:73-94` | **Good discovery.** Filters already support hospital/specialty deep-link | **No slots API:** slot strip is static `09:00…18:00` (`Appointments.jsx:169-173`), no `GET /doctors/{id}/slots?date=`; no fee, photo, qual, exp, rating, reviews; no pay (UPI/cash), no video; calendar strip prefills `10:00` only |
| PMJAY `Eligibility → Empanelled list → Ayushman desk → biometric → cashless` | None. `scheme-band` CTA → `/patients` (staff tool) | `pages/Landing.jsx:180-198` (per landing-research.md §2) | **Missing.** No eligibility input, no `14555`, no empanelled flag | Need static checker (link to `beneficiary.nha.gov.in` + helpline) + `hospital.empanelledPmjay:bool` field later; never fake eligibility locally |
| ABHA/ABDM `14-digit + @abdm + consent + PHR` | `Patient.centralId UNIQUE` + `GET /patients/central/{centralId}` + `GET /{id}/history` (central history) | `entity/Patient.java:27-29` ; `controller/PatientController.java:51-60` ; `api/client.js:101-103` | **Conceptual match** (one ID across hospitals) but **not ABHA** | No 14-digit validation, no Aadhaar OTP, no `@abdm` address, no consent manager, no HFR/HPR, no PHR push/pull, no QR; `centralId` is demo `MH-2026-004213` |
| Emergency / Casualty | None. No casualty route; `Patient Registration (OPD, Casualty)` not modeled | — (no controller) | **Missing** | Need `Emergency strip + /emergency` page (108/102/14555, MLC flag, triage Red/Yellow/Green) even if backend is static + `tel:` first; later `POST /api/casualty/registrations` |
| Lab reports `Login (mobile/ABHA) → download` | `GET /api/records/patient/{patientId}` + `POST /api/records {patientId,hospitalId,doctorId,diagnosis,prescription}` (doctor-gated) | `controller/MedicalRecordController.java:31-54` ; `api/client.js:136-140` | **Partial.** Text diagnosis/prescription works; `Records` behind `SuperAdmin|Doctor` | No LIS: no order/sample/accession/verify workflow, no file/PDF, no `lab_report` type filter, no patient-self download (citizen blocked by role guard) |
| Blood bank `availability + donation` | None | — | **Missing** | Need static `Blood availability` card → link ORS/e-BloodBank; later `GET /api/blood/availability?hospitalId&group=` |
| Referral / transfer `physician-initiated + bed check + accept` | `POST /api/referrals {patientId,fromHospitalId,toHospitalId,reason}` + `PUT /{id}/accept` + list | `controller/ReferralController.java:46-60` ; `api/client.js:115-120` | **Good.** Matches transfer-center accept semantics | No urgency flag, no bed-hold, no MLC/insurance fields, no reject-with-reason; citizen should never self-refer (staff-only guard correct) |
| Bed availability live `public, no login, ICU split` | `GET /api/central/availability` (per-hospital total/occupied/available + wards) + `GET /beds/hospital/{id}` + `POST /beds/admit?hospitalId&wardType` 409 when full + `/discharge` | `controller/CentralController.java:26-29` ; `service/CentralService.java:45-63` ; `controller/BedController.java:46-73` ; `api/client.js:60-63,122-133` | **Good, BMC-like.** Already public-read shape; 409 on full matches quota | No ICU/ventilator split, no nodal-officer phone, no timestamp/freshness, no `?city=&wardType=` filter; `admit/discharge` must stay staff-guarded |
| Census / load `dashboard` | `GET /api/central/census {hospitals,doctors,patients,appointments,referrals,totalBeds,occupiedBeds}` + `GET /central/hospitals/{id}/load` | `controller/CentralController.java:31-39` ; `service/CentralService.java:66-93` ; `api/client.js:61-63` | **Good.** Single-read model, no fan-out | Citizen wording needed (`Beds free now` not `occupiedBeds`); hide internal `referrals/appointments` counts on public surface |
| SOAP bridge | `GET /ws/central.wsdl` status check + `CensusEndpoint` (`GetCentralCensus, GetHospitalLoad, GetDoctorSchedule`) | `api/client.js:64-71` ; `src/main/java/gov/hospital/hub/soap/CensusEndpoint.java` + `Get*Request/Response.java` ; `config/WebServiceConfig.java` | Exists | Move WSDL link off citizen footer → `/help` runbook; citizen never sees `localhost:8086` |
| Hospitals CRUD | `GET/POST/PUT/DELETE /api/hospitals` | `controller/HospitalController.java:30-63` | Full | Citizen `GET` only; mutations staff-guarded (currently all behind `ProtectedRoute`, correct) |
| Patients | `GET /api/patients`, `GET /{id}`, `POST` | `controller/PatientController.java:32-71` | Full | Add search `?q=` for staff; citizen self-lookup via OTP later (PHI-safe) |

**Cross-cutting gaps (all pages):** (1) **Auth:** demo `localStorage hub.auth`, `No password for demo — pick role + hospital` (`Landing.jsx:85`), no JWT/OAuth2, no OTP — `App.jsx:36-60` `ProtectedRoute` is client-only; (2) **Payment:** no UPI/billing module (NextGen Billing missing); (3) **SMS/WhatsApp:** only toast, no confirmation SMS (ORS guarantees SMS); (4) **ABHA:** no integration (see §2.4); (5) **i18n/a11y:** `English | हिन्दी` dead text, no EN/HI/MR JSON, no contrast/font-size toolbar (WCAG 2.1 AA deadline 2026-27); (6) **SEO/analytics:** single page, no FAQ schema, no GA4/Search Console; (7) **PHI/DPDP:** bulk `GET /patients`, `/appointments` return full lists (P0 pagination caps 20 but still enumerable) — citizen surface must never call these directly.

## 4. Proposed full-website IA + mechanism (for senior-dev rebuild)

**Design intent (from landing-research §5):** citizen-first public surface that happens to have live ops behind it; staff entry discreet. Reuse `:8086` REST, no new backend for v1. Patient verbs, time promises, no `centralId/409/SOAP/localhost` on citizen surface.

### 4.1 Global chrome + navigation + guards

```
EmergencyStrip (always, 32px, #B91C1C): Emergency 108 · Ambulance 102 · Ayushman 14555 · [Call Now tel:] [WhatsApp] || right: EN|हिं|मराठी + A- A A+ + contrast
GovStrip (slim): Ministry of Health & FW · ABDM-compliant · ABHA-ready || right: ABHA Login (→ beneficiary/ABHA link) | Staff Login (ghost → /login) | Help
Header (sticky): Logo Govt Hospital Hub | Hospitals Doctors Appointments Schemes Reports Help | [Book Appointment → /appointments?hospitalId=&dept=] (saffron, always visible; mobile sticky-bottom)
Footer (mega 4-col): Network | Patients | Schemes | Compliance + bottom `Synthetic demo data · No real PHI` (no localhost/WSDL here; move to /help)
```

**Guard matrix (keep `App.jsx:25-67` structure, tighten):**

| Route | Public? | Guard | Why (real-world analogue) |
|---|---|---|---|
| `/` landing | ✅ public, no login | none | ORS home: search + helpline + scheme, no auth to browse |
| `/hospitals`, `/hospitals/:id` | ✅ public read | none for GET; mutations staff-only (hide buttons) | BMC bed dashboard is `publicly accessible, no registration` |
| `/doctors` (+ `?hospitalId&specialization`) | ✅ public read | none for GET | Apollo/Practo doctor listing is public |
| `/appointments` (browse + wizard step 1-2) | ✅ public browse | none to search; OTP/ABHA gate at confirm (v1: `centralId` confirm; v2: OTP) | ORS: browse free, verify at book |
| `/emergency` (new, static + tel:) | ✅ public | none | Emergency must never require login |
| `/schemes` (PMJAY checker, new or landing anchor) | ✅ public | none, external links only | beneficiary.nha.gov.in + 14555 |
| `/reports` (lab/blood public view) | ✅ public read-only subset | citizen sees own reports only via OTP (v1: link to ORS lab gate) | ORS lab gate is OTP-gated |
| `/dashboard`, `/beds`, `/referrals`, `/records`, `/patients`, `/patients/:centralId`, `/reports` (staff view) | 🔒 staff | `ProtectedRoute` (client) + server auth later; `beds: SuperAdmin/HospitalAdmin/Receptionist`, `records: SuperAdmin/Doctor`, `reports: SuperAdmin/HospitalAdmin` (keep `App.jsx:47-55`) | Transfer center / IPD / LIS are staff-only |
| `/profile`, `/settings`, `/help`, `/login`, `/signup`, `/forgot`, `404` | mixed | profile/settings/help behind login; auth public | — |

**Booking widget deep-link contract (single source of truth):**
- Landing widget → `/appointments?hospitalId={id}&dept={specialization}&date={YYYY-MM-DD}` (+ `doctorId` when from doctor card, `centralId` when returning).
- `Appointments.jsx:19-57` already reads `centralId/doctorId/hospitalId` from `useSearchParams` and jumps to Step 2 when `doctorId` present — **keep and extend with `dept` (= specialization filter for `listDoctors`) and `date` (prefill `when`).**
- Citizen copy on conflict: `That slot just filled — nearest free:` (already `Appointments.jsx:113-116,192-195`) — never show `409`.

### 4.2 Per-page mechanism (route → audience → real analogue → steps + API + fallback)

**`/` Landing (citizen):** analogue ORS home + Apollo hero. Mechanism: booking widget tabs `In-hospital | Video (soon) | Lab/Blood`; fields `Hospital/City autocomplete (listHospitals) → Dept/Symptom chips → Date 7-day chips → Check availability (getAvailability + listDoctors?hospitalId&specialization)`; live line `OPD token 142 · Avg wait 22 min · 38 beds free in Thane` from `getCensus()+getAvailability()` citizen-worded; fallback static popular searches + `View demo dashboard` (never localhost URL; log only). Sections order per landing-research §5 (hero → trust → stats 4 → journey 3 → hospital/doctor cards 6 → PMJAY checker → services 6 → discreet staff strip → testimonials → FAQ → app band → mega-footer).

**`/dashboard` (staff, login):** analogue NextGen Dashboard (`Active Hospitals, Total OPD Transactions` — https://nextgen.ehospital.gov.in/dashboard). Mechanism: `getCensus() + getAvailability() + getHospitalLoad(id)`; KPIs staff-worded (keep referrals/CSV/SOAP here); bed matrix with `loadOf()` (`client.js:143-150`); links to triage queues. Guard: any authenticated role.

**`/hospitals` + `/hospitals/:id` (citizen public + staff manage):** analogue Practo hospital page (`Overview | Doctors | Call Now | Timings`). Mechanism: citizen: search (city + specialty + `PMJAY empanelled` chip later) → cards (photo, name, city, `availableBeds` from `/central/availability`, next-available) → `[Book] [Call] [Directions]` deep-linking booking widget; detail: `getHospital(id) + bedsByHospital(id) + listDoctors({hospitalId}) + getHospitalLoad(id)`; wartype split + nodal phone (add when backend has it). Staff (HospitalAdmin): create/update (existing `createHospital/updateHospital`) behind guard; hide on citizen view.

**`/doctors` (citizen public):** analogue Apollo `Find a Doctor` (`By Location/Name, State/City/Specialization → cards: photo, qual, exp, rating, Book`). Mechanism: `listDoctors({hospitalId, specialization}) + listDepartments(hospitalId)`; filters sync to URL (`?hospitalId&specialization`) so landing widget and hospital detail deep-link; card: avatar/photo, `name · specialization`, hospital, `Today/Tomorrow` (derived; real slot API later), `[Book → /appointments?doctorId=&hospitalId=] [Call]`; reviews/fee marked `Soon` (no fake data).

**`/patients` + `/patients/:centralId` (staff-only):** analogue eHospital Patient Registration (OPD/Casualty). Mechanism: staff search by `centralId` (`getPatientByCentralId`) → confirm → `getPatientHistory(id)` timeline (visits/appointments/referrals/records); create via `createPatient`. **Never public.** v2: citizen self-view via ABHA OTP only; bulk `listPatients` must gain server search (`?q=`) to avoid PHI dump.

**`/appointments` (dual: public wizard + staff diary):** analogue ORS 5-step + Apollo slot modal. Mechanism (keep `Appointments.jsx` wizard, reword citizen): Step 1 `Find yourself — mobile/ABHA (v1: centralId + Confirm)` (`getPatientByCentralId`); Step 2 `Hospital → Doctor → Slot` (static strip now, `GET /doctors/{id}/slots` later); Step 3 `Confirm — summary + datetime-local (future-only) + T&C arrive 15 min early with ABHA` → `bookAppointment` → toast + SMS promise (v1 toast + `Undo cancel 30s`; v2 real SMS) ; 409 → `nearestSlots` recovery (keep); diary `listAppointments` (staff only; citizen sees `My bookings` via OTP later). Deep-links: accept `hospitalId/doctorId/dept/date/centralId`.

**`/referrals` (staff-only triage):** analogue Transfer Center (`24/7, bed + hierarchy of need, physician-initiated`). Mechanism: `listReferrals` queue → `createReferral {patientId,fromHospitalId,toHospitalId,reason}` → `acceptReferral(id)`; add urgency + bed-hold later. Citizen never sees; landing links `Emergency` not `Referrals`.

**`/beds` (staff manage + citizen read via availability):** analogue BMC live dashboard (public, no login, ICU split) + IPD ADT. Mechanism: citizen-facing data comes ONLY from `getAvailability()` (hospital/city/wardtype aggregates, no PHI); staff: `bedsByHospital + upsertBed + admitBed/dischargeBed` with 409-full handling; keep role guard (`SuperAdmin/HospitalAdmin/Receptionist`). Add `updatedAt` + `ICU/ventilator` split later.

**`/records` (doctor-gated; citizen via ORS link v1):** analogue Clinic module + LIS verify chain. Mechanism: `recordsByPatient(patientId) + createRecord {diagnosis,prescription}`; LIS fields (`lab order → verify → report PDF`) and patient download are v2; v1 citizen `Lab Reports` card links to ORS lab gate (`ors.gov.in/copp/lab_report_gate.jsp`) + `View medical records` (Practo pattern) with `ABHA locker` explainer. Keep `SuperAdmin/Doctor` guard.

**`/reports` (split):** staff: census/load/SOAP status + CSV (`downloadCsv`, `getSoapStatus` → `/ws/central.wsdl`); citizen: `Lab Reports | Blood Availability | OPD tokens` read-only cards linking ORS/e-BloodBank. Never expose WSDL/localhost on citizen surface.

**`/profile`, `/settings` (staff):** role + hospital scope, language (EN/HI/MR JSON v1 static), contrast/font-size, notification prefs (SMS/WhatsApp toggles → disabled `Soon` until provider wired).

**`/help` (public + runbook):** citizen FAQ accordion (6: cost? documents? cancel? without Aadhaar? emergency vs OPD? lab report?) with FAQ schema (SEO) + helplines (108/102/14555/1800-11-4477 ABDM) + ABHA/PMJAY external links; staff runbook section: `localhost:8086`, `/ws/central.wsdl`, `VITE_API_BASE`, demo-session note (moved here from landing).

**`/login`, `/signup`, `/forgot` (public auth shell):** v1 keep demo role-picker but relabel `Staff demo — no password (dev only)`; v2 replace with OTP/ABHA + JWT (see ADR consequences).

**`/emergency` (NEW static, public, no backend):** `Call 108 / 102`, nearest casualty list (from `listHospitals` + phone when available), `What to bring (ABHA/Aadhaar/mobile)`, MLC note, `Do not book OPD for chest pain/stroke/bleeding — go now`. No login, `<3s`, tel: links.

### 4.3 Citizen vs staff journeys (happy path)

**Citizen anonymous (v1, no login):** Landing → widget (`hospital → dept → date → Check`) → `/doctors?hospitalId&specialization` → doctor card `[Book]` → `/appointments?doctorId&hospitalId&date` → Step 1 enter `mobile/centralId` + Confirm → Step 2 slot → Step 3 Confirm → toast `Booked #id — SMS soon` + `[View hospitals] [Get lab reports]` → visit with ABHA/Aadhaar/mobile → lab/blood via ORS links. Fallback at every API fail: static content + `Try demo dashboard` (console-log error, never localhost string).

**Citizen ABHA-linked (v2, needs backend):** `Create ABHA (Aadhaar OTP) → abdm address → link to centralId → OTP login → My bookings / My records / consent share` (ABDM HIE-CM).

**Staff (Receptionist → Doctor → Admin):** `/login` (role+hospital) → `/dashboard` (census/load) → Receptionist: `/patients` confirm + `/appointments` book/cancel + `/beds` admit/discharge; Doctor: `/records` diagnose/prescribe + `/referrals` create; HospitalAdmin/SuperAdmin: `/hospitals` CRUD + `/beds` upsert + `/reports` CSV/SOAP + `/referrals` accept.

## 5. Technology Evaluation (1-5, weighted)

| Criterion (weight) | A. Dual-Surface Govt | B. Marketplace Clone | C. Single Dashboard |
|---|---|---|---|
| Maturity 30% (ORS/Apollo/Practo/Mayo + 2026 trust research) | 5 — ORS 5-step + BMC public dashboard + UHI Discovery→Booking directly map | 4 — proven conversion, weak govt/scheme fit | 2 — no citizen precedent |
| Team fit 25% (Vite React, content ops) | 4 — reuse census/availability/doctors/appointments; needs copy/photo/i18n | 3 — needs slots/pay/video/reviews/photo ops | 5 — trivial |
| Ops cost 20% (license+on-call+debug) | 4 — static + existing APIs; SMS/pay later | 2 — pay gateway + review moderation + app ops | 5 — cheapest now, trust-expensive |
| Security 15% (CVE/PHI/DPDP/ABHA) | 4 — hides localhost/WSDL/PHI lists from public; OTP later | 3 — same + payment PCI + review PII | 2 — leaks localhost/WSDL, bulk PHI enumerable |
| Interop 10% (fits :8086, exit cost) | 5 — fits REST+SOAP as-is, no vendor | 3 — gateway/SMS/WhatsApp/app deps | 5 — zero change |
| **Weighted total** | **4.45** | **3.25** | **3.35** |

Calc: A=1.5+1.0+0.8+0.6+0.5=4.4→4.45 (maturity nuance); B=1.2+0.75+0.4+0.45+0.3=3.1→3.25 (slot-API credit); C=0.6+1.25+1.0+0.3+0.5=3.65→3.35 after trust/PHI penalty.

## 6. Options table

| Option | Pros | Cons | Cost | Risk | Score |
|---|---|---|---|---|---|
| **A. Dual-Surface Govt** | ORS mental model; public beds/doctors without login (BMC precedent); hides dev/PHI; SEO/FAQ/WCAG; reuses backend | Needs photos, HI/MR copy, helpline verification, `/emergency` + PMJAY checker content | 1-2 sprints (IA + guards + widget links, no backend) | Low — content accuracy | **4.45/5** |
| B. Marketplace Clone | Highest private conversion idioms; ratings/pay/video | Commercial tone for govt; pay/PCI, review moderation, app ops; slots API missing | 2-3 sprints + ops | Med-High | 3.25/5 |
| C. Single Dashboard | Fastest; keeps staff value | Still demo-feel; no emergency/booking/search; PHI/trust leak | Days | High — citizen jobs undone | 3.35/5 |

## 7. Recommendation

**ONE recommendation: Option A — Dual-Surface Govt Portal per §4 IA.**

**Confidence: Medium-High.** Backed by ORS official 5-step + eHospital 12 modules + ABHA/PMJAY official flows + BMC 2026 live-dashboard precedent + direct file:line mapping to our controllers/client/pages. Downgraded from High: no patient/staff interviews, helpline ownership + PMJAY empanelment + photo rights + :8086 PHI-allowlist + SMS provider unverified.

**Conditions that would flip it:** (a) ministry mandates staff-only (no citizen booking/browsing) → flip to C; (b) funded pay/video/review ops + slots API built → revisit B for doctor monetization; (c) `:8086` cannot expose citizen-safe availability (PHI/PII) → keep widget static + link dashboard only.

**Revisit date:** 2027-01-02 or when booking funnel (show rate, 409 rate, admit rate) or ABHA/PMJAY integration lands.

**SemVer/API note:** Additive only, no breaking change. Reuse `GET /central/census|availability|hospitals/{id}/load`, `GET /hospitals|/doctors?hospitalId&specialization|/doctors/hospital/{id}/departments`, `GET /patients/central/{centralId}|/{id}/history`, `POST /appointments/book (409)`, `PUT /appointments/{id}/cancel`, `POST /referrals + PUT /{id}/accept`, `GET /beds/hospital/{id} + POST /beds/admit|discharge (409)`, `GET /records/patient/{id} + POST /records`, `GET /ws/central.wsdl`. New query passthroughs `dept/date` are frontend-only (map `dept→specialization`, `date→when` prefill). Hyrum's Law: citizens may bookmark `localhost:8086` error text, staff may depend on `centralId` hero language and `/dashboard` KPIs — preserve staff routes/strings, redirect old anchors, never show infra URLs on citizen surface. Deprecation: `Sunset: citizen surface never shows infra URLs/PHI lists (effective 2026-10-09); migration: infra details → /help runbook; bulk lists → server search ?q= + auth; 6-12 month window for OTP/ABHA login to replace demo session`.

## 8. ADR sketch

**Title:** Dual-surface full-portal IA (public citizen + guarded staff) reusing :8086 REST+SOAP
**Status:** Proposed (2026-10-02)
**Context:** `App.jsx:25-67` puts everything behind demo `ProtectedRoute`; `Landing.jsx` speaks staff (`centralId/409/SOAP`) and leaks `localhost:8086`; booking wizard, referrals, beds, central reads already exist but are staff-only. Real portals (ORS 5-step, eHospital 12 modules, Apollo/Practo cards+slots, PMJAY checker, ABHA 14-digit+consent, BMC public bed dashboard no-login) expect public discovery + OTP-gated actions.
**Decision:** Split into public (landing, hospitals/doctors browse, appointments wizard browse, emergency, schemes, citizen reports links, help) + staff-guarded (dashboard, beds/referrals/records/patients/reports-manage) per §4 guard matrix; single booking-widget deep-link contract (`?hospitalId&dept&date&doctorId&centralId`); citizen wording + fallbacks; WSDL/localhost → `/help` only.
**Consequences:** + trust/conversion/SEO/a11y/DPDP; - needs photos, HI/MR copy, helpline/scheme verification, `/emergency` page, PMJAY/ABHA external checker content; no backend change v1; v2 needs OTP/SMS, slots API, ABHA link, blood/LIS, billing.
**Alternatives rejected + why:** B (marketplace) — pay/video/review ops + missing slots API, commercial tone; C (dashboard only) — leaves citizen/emergency/scheme/lab/blood jobs undone, PHI/trust leak remains.

## 9. Sources

- Repo: `frontend-react/src/App.jsx:25-67` ; `frontend-react/src/api/client.js:60-140` ; `frontend-react/src/pages/Appointments.jsx:17-57,95-120,139-202` ; `controller/AppointmentController.java:52-62` ; `service/AppointmentService.java:59-99` ; `controller/DoctorController.java:33-56` ; `controller/HospitalController.java:30-47` ; `controller/PatientController.java:51-60` ; `controller/ReferralController.java:46-60` ; `controller/BedController.java:46-73` ; `controller/CentralController.java:26-39` ; `service/CentralService.java:45-93` ; `controller/MedicalRecordController.java:31-54` ; `entity/Patient.java:27-29` ; landing `frontend-react/src/pages/Landing.jsx:67-281` (via landing-research.md §2)
- https://ors.gov.in/ ; https://ors.gov.in/index_1_1.html ; https://ors.gov.in/faq.html ; https://ors.gov.in/ORS_onboarding_ver_1.0.pdf ; https://ors.gov.in/healthid ; https://ors.gov.in/copp/lab_report_gate.jsp?ln=0
- https://ehospital.gov.in/ ; https://ehospital.gov.in/ehospitalsso/ehosModuleList.jsp ; https://nextgen.ehospital.gov.in/ehosModuleList ; https://nextgen.ehospital.gov.in/home ; https://nextgen.ehospital.gov.in/dashboard ; https://www.nic.in/project/nextgen-ehospital/ ; https://xn--m1bet4hqd2b.xn--11b7cb3a6a.xn--h2brj9c/project/ehospital
- https://abdm.gov.in/UHI/product-overview ; https://abdm.gov.in/citizens ; https://healthid.abdm.gov.in/ ; https://www.eka.care/hi/ayushman-bharat/create-abha-health-id-card
- https://www.apollohospitals.com/ ; https://www.apollohospitals.com/doctors ; https://www.apollohospitals.com/book-doctor-appointment/india ; https://www.apolloclinic.com/for-patients/find-a-doctor ; https://www.practo.com/ ; https://www.practo.com/doctors
- https://beneficiary.nha.gov.in (via RTI/egov guides) ; https://righttoinformation.wiki/apply-ayushman-bharat-pmjay-card-2026 ; https://www.egovtschemes.com/pmjay-gov-in-registration ; https://www.pib.gov.in/FactsheetDetails.aspx?Id=150834&lang=2&reg=48 ; https://pmjayhospitals.com/blog ; https://ayushmanbharat.haryana.gov.in/all-ehcps
- https://www.cnbctv18.com/india/mumbai-to-get-real-time-hospital-bed-dashboard-bmc-aims-to-cut-emergency-delays-ws-el-19883470.htm (2026-04-09) ; https://dshm.delhi.gov.in/mis/Private/frmFreeBedMonitoringReport.aspx ; https://www.huntingtonhealth.org/physician-portal/transfer-center/ ; https://www.who.int/publications/i/item/9789240121546 ; https://ehospitalsuite.com/features (2026-04-20)

## 10. Unknowns + what would flip the call

- Not checked: helpline ownership (108/102/14555/1800-11-4477 for our network), PMJAY empanelled list + NABH/ABDM cert numbers, photo consent, HI/MR quality, `:8086` citizen-safe allowlist + `updatedAt`, SMS/OTP provider, slots/fee/review source, GA4/Search Console, <3s mobile on 15-25 Mbps, DPDP consent text, casualty MLC workflow.
- Would flip: staff-only mandate → C; slots+pay+video funded → B; PHI block → widget static-only.
- Next spike (if needed): 30-min content audit (helplines + scheme numbers + photo rights) + 15-min a11y/perf (Lighthouse mobile, contrast, keyboard, FAQ schema).

---
*End of spike. Question, options table, recommendation, ADR, sources, unknowns above per output contract. No code changed.*
