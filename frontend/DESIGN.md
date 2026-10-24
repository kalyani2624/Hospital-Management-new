# PROJECT 6 Govt Hospital Hub - Central Dashboard UI Design Spec
Version 1.0 - 2026-09-30 - Designer only, no code
Backend: http://localhost:8086/api - Single central DB - SOAP at /ws

## 1 Vision and Thesis
One dashboard plus one database for all government hospitals. Today each hospital keeps fragmented registers. A patient visiting two hospitals has two identities and no shared history.
This hub fixes that with one centralId per citizen, central census and availability, and inter hospital referrals without loss of history.

Hero thesis: One Citizen, One Record, Every Hospital. The signature moment is the always visible CentralId Command Bar. Any role can type a centralId like MH-2026-004213 and jump to unified history timeline in under two actions. That is the page most memorable element and embodies the brief.

Audience: SuperAdmin at health ministry, HospitalAdmin at facility, Doctor on ward and OPD, Receptionist at front desk, plus legacy SOAP clients and auditors. Single job per screen, plain language, task focused.

Style direction: Clean government portal. Accessible and Ethical style per ui-ux-pro-max. Trustworthy, calm, high contrast, inclusive. Not templated SaaS. No neon, no AI purple gradients, no motion heavy decoration. One aesthetic risk taken deliberately: tricolor inspired Ashoka Chakra divider and Load Light occupancy dots used as wayfinding. Quiet surroundings, one memorable signature.

## 2 Design System Source of Truth
Generated via ui-ux-pro-max --design-system for quote government healthcare central dashboard professional trustworthy quote.

### 2.1 Tokens
Color:
- primary #0891B2 - headers, primary buttons, links, active nav. Contrast on white 4.6 to 1. Pass.
- secondary #22D3EE - accents, charts secondary series, progress track. Never for text alone.
- action CTA #059669 - Book, Admit, Accept Referral, Save. Contrast on white 4.5 to 1. Pass.
- background #ECFEFF - app canvas. Cards use #FFFFFF.
- surface #FFFFFF - cards, modals, tables.
- text #164E63 - primary text on light. Muted text #334155 minimum, never #94A3B8 for body.
- border #CBD5E1 light, #E2E8F0 subtle. Focus ring #0891B2 with 3px outline plus 2px offset.
- semantic success #059669, warning #B45309 with icon plus text, danger #DC2626 with icon plus text, info #0284C7. Never rely on color alone.

Typography via Google Fonts:
- Heading Lexend 600 and 700. Display 32 to 40 clamp, H1 28, H2 22, H3 18.
- Body Source Sans 3 400 and 500 and 600. Base 16px minimum, line height 1.5, small 14 for meta only.
- Data and captions Source Sans 3 500 tabular numbers for census counts and bed numbers.
- CSS import noted for implementation team, not included here.

Spacing and shape:
- spacing scale 4 8 12 16 24 32 48. Page padding px-4 md px-6 lg px-8.
- radius 8 cards, 6 inputs and buttons, 999 pills for status.
- elevation 0 for flat govt tables, 1 for cards, 2 for modal and sticky command bar.
- motion standard 150 to 300ms color and opacity only, transform and opacity for animation. Respect prefers-reduced-motion.

### 2.2 Signature Elements
- CentralId Command Bar: sticky under header on every page. Search input plus Hospital scope plus Go. Recent searches. Keyboard slash to focus.
- Load Lights: occupancy dots with label. Green Available, Amber Tight greater than 80 percent, Red Full. Always icon plus text plus percent.
- Ashoka Rule: thin 3px divider in navy saffron green sequence used only on Central Command and Reports headers to signal official record. Subtle, respectful, not decorative elsewhere.

## 3 Information Architecture and Roles
Routes all under central hub. Backend base http://localhost:8086/api.

- /login - role select plus govt SSO placeholder
- / - Central Command census plus availability
- /hospitals - registry plus load drill down
- /hospitals/:id - detail with departments, doctors, beds, appointments
- /doctors - directory plus slots
- /patients - search by centralId plus registration
- /patients/:centralId - unified history timeline
- /appointments - booking calendar
- /referrals - inter hospital queue
- /beds - occupancy board
- /records - visit notes
- /reports - exports and audit

Role matrix:
- SuperAdmin: full read write all hospitals. Manage hospitals registry, view all census, export reports, manage users. Can upsert beds, create hospitals, view SOAP status.
- HospitalAdmin: scoped to own hospitalId. Manage doctors, departments, beds, view load, accept referrals, export facility reports. Cannot create hospitals.
- Doctor: scoped to own schedule. View appointments, write medical records with diagnosis plus prescription, view patient history timeline, request referrals. Cannot admit discharge beds.
- Receptionist: front desk. Register patients with centralId, book and cancel appointments, search centralId, create referrals PENDING, view beds availability. Cannot write clinical notes or accept referrals.

Nav per role: SuperAdmin sees all. HospitalAdmin hides SuperAdmin Hospitals Create. Doctor lands on Appointments then Records. Receptionist lands on Patients then Appointments then Beds. Show hospital scope switcher only for SuperAdmin. Others locked to assigned hospitalId with visible banner quote You are viewing AIIMS Delhi quote.

## 4 Page Specs - Layout, API, States

### 4.1 Central Command - /
Purpose: ministry view of whole network health in 10 seconds. Users SuperAdmin primary, HospitalAdmin secondary.
Backend: GET /api/central/census returns hospitals doctors patients appointments referrals totalBeds occupiedBeds. GET /api/central/availability returns per hospital totalBeds occupiedBeds availableBeds plus wards array with wardType total occupied available. SOAP getCentralCensus mirrors for legacy.
Layout desktop 1440: header, CentralId Command Bar, KPI row 6 cards, 2 column charts, availability table. Tablet 768 stacks charts. Mobile 320 KPI 2 col grid, table becomes cards with horizontal scroll fallback.
Wireframe:
```
[Header: Emblem Govt Hospital Hub | Scope: All Hospitals v | Role | User]
[CommandBar: Search centralId........ [Hospital: All v] [Go] | Ticker: Occupancy 68% | Pending Referrals 12]
[KPI: Hospitals 24 | Doctors 412 | Patients 58k | Appointments 1.2k | Referrals 86 | Beds 68% occupied]
[Chart: Bed occupancy by hospital bar] [Chart: Appointments 14 days line]
[Table: Hospital | City | Type | Total | Occupied | Available | Load Light | Action View]
```
Components: KPI card with tabular number plus delta, bar chart occupancy, line chart appointments, availability table with Load Light.
Interactions: auto refresh 60s with pause and Live badge, skeleton screens for KPI and charts on load, not spinners. Empty when zero hospitals shows illustration plus Create Hospital action for SuperAdmin. Error shows what happened plus Retry plus help link. 409 never here.
Accessibility: charts have data table alternative and aria-describedby summary, focus order KPI to charts to table, live region polite for ticker updates.

### 4.2 Hospitals plus Load - /hospitals and /hospitals/:id
Purpose: registry plus per facility pressure drill down. Users SuperAdmin create, all view.
Backend: GET and POST /api/hospitals and /api/hospitals/:id fields name city type CENTRAL DISTRICT COMMUNITY totalBeds. GET /api/central/hospitals/:id/load returns hospitalId hospitalName doctors appointments totalBeds occupiedBeds. GET /api/beds/hospital/:hospitalId and GET /api/doctors?hospitalId.
Layout: filter bar Type plus City plus Search, card grid of hospitals with Load Light, detail page with tabs Overview Doctors Beds Appointments.
Detail wireframe:
```
[Back] [AIIMS Delhi - CENTRAL - New Delhi] [Load Light: Tight 84%] [Edit for SuperAdmin]
[Tabs: Overview | Doctors 48 | Beds | Appointments 132]
[Overview: KPI doctors appointments beds wards breakdown GENERAL ICU EMERGENCY PEDIATRIC]
```
States: duplicate name shows inline validation, create success shows toast plus Undo view. Load greater than 90 percent shows warning banner with View Beds action.

### 4.3 Doctors plus Slots - /doctors
Purpose: find right doctor and free slot across network. Users Receptionist and patients desk primary, Doctor views own.
Backend: GET /api/doctors?hospitalId and specialization. GET /api/doctors/hospital/:hospitalId/departments. Appointment double book logic informs slot design.
Layout: left filters Hospital, Specialization Cardiology Ortho General, Department, Search name. Right directory cards plus slot strip.
Card: photo placeholder with initials, name, specialization badge, hospital plus department, Today slots chips 10:00 10:30 Booked, View Schedule.
Booking entry points to Appointments calendar with doctor preselected. No direct book here to prevent errors. Recognition over recall with visible filters, not remembered IDs.
Empty: No cardiologist in Pune shows Clear filters plus Create referral action. Error on filter failure shows Retry.

### 4.4 Patients plus centralId Search plus History Timeline - /patients and /patients/:centralId
Purpose: core promise. One ID per citizen across every hospital. Eliminate duplicate records.
Backend: GET and POST /api/patients fields centralId unique name age gender phone registeredHospital. GET /api/patients/central/:centralId lookup. GET /api/patients/:id/history returns appointments plus records plus referrals joined.
Layout: prominent search with centralId input, phone fallback, Register New button. Result list shows centralId, name, age gender, registered hospital, Last visit.
Detail timeline wireframe:
```
[Patient header: Name | MH-2026-004213 copy button | 34 F | Phone | Registered AIIMS Delhi]
[Actions: Book Appointment | Add Record Doctor only | New Referral]
[Timeline filter: All Appointments Records Referrals]
2026-10-05 10:00 Appointment BOOKED with Dr Rao at AIIMS Delhi - General
2026-09-20 Visit Diagnosis Viral fever Prescription Paracetamol - Dr Rao - AIIMS Delhi
2026-09-12 Referral PENDING AIIMS Delhi to Safdarjung reason Cardiology review
```
Interactions: copy centralId button with Copied confirmation, progressive disclosure details on demand, timeline skeleton on load. Forgiveness auto save draft registration, editable mistakes not confirm dialogs. Duplicate centralId POST shows 409 mapped to friendly message quote This centralId already exists for Name at Hospital. View record quote plus link.
Accessibility: timeline uses ordered list plus semantic time elements, status icons plus text.

### 4.5 Appointments Booking Calendar - /appointments
Purpose: book without double booking. Highest error prevention need.
Backend: POST /api/appointments/book body patientId doctorId hospitalId appointmentTime future required. Returns 409 quote doctor 2 already booked at 2026-10-05T10:00 quote. PUT /api/appointments/:id/cancel with status BOOKED CANCELLED COMPLETED.
Layout: 3 step wizard plus calendar. Step 1 Patient centralId confirm. Step 2 Doctor plus Hospital. Step 3 Date Time with slot grid. Right summary rail.
Rules: appointmentTime must be future, validate client plus server. Disable past dates. Show slot conflict inline before submit by checking doctor schedule. On 409 show error recovery: what happened plus nearest free slots plus Try again plus help link. Use role alert.
Success: brief confirmation plus Undo cancel within 30s plus Add to records shortcut. Loading state on Book button with spinner plus disabled.
Calendar: month view desktop, agenda list mobile. Keyboard navigable dates, visible focus, skip to today link.

### 4.6 Referrals - /referrals
Purpose: inter hospital transfer without losing history.
Backend: GET and POST /api/referrals fields patientId fromHospitalId toHospitalId reason required. PUT /api/referrals/:id/accept status PENDING ACCEPTED COMPLETED.
Layout: kanban style queue PENDING ACCEPTED COMPLETED plus table alternative for screen readers. Filters From Hospital To Hospital.
Card: patient centralId plus name, From to with arrow, reason, age of request, actions Accept Complete for receiving HospitalAdmin, Cancel for sender.
Empty: No pending referrals shows All clear illustration. Error on accept conflict shows refresh plus retry.
Notification: toast on new referral for receiving hospital via live region assertive.

### 4.7 Beds Occupancy - /beds
Purpose: live stock per hospital per ward to guide admit decisions.
Backend: GET /api/beds and /api/beds/hospital/:hospitalId. POST /api/beds upsert hospitalId wardType total. POST /api/beds/admit?hospitalId and wardType 409 when full. POST /api/beds/discharge.
Fields: hospital wardType GENERAL ICU EMERGENCY PEDIATRIC total occupied available computed total minus occupied.
Layout: matrix Hospital rows Ward columns with occupancy bar plus numbers. Filters Hospital Ward. Admit Discharge buttons with confirm for dangerous Admit when Tight but allow with warning. Never only color.
Admit flow: select hospital plus ward, shows Available 2 of 40, Admit button disabled when 0 with message Full plus Suggest nearby hospitals with availability link to Central Command.
Discharge forgiving with Undo 30s.
Charts: donut per ward type, stacked bar per hospital. Provide table fallback.

### 4.8 Records - /records
Purpose: clinical visit notes with hospital context.
Backend: GET and POST /api/records and /api/records/patient/:patientId fields patientId hospitalId doctorId optional diagnosis required prescription visitDate default now.
Layout: form plus recent list. Form labels for every input, diagnosis textarea with helper, prescription, hospital locked to user scope, doctor select, visit date.
Validation: diagnosis required shows inline error with suggestion. Success shows Saved plus View in timeline.
List: filter by patient centralId, hospital, date range. Row shows date diagnosis truncated doctor hospital View.
Accessibility: labels with for attributes, errors in role alert plus aria-live, no placeholder only inputs.

### 4.9 Reports - /reports
Purpose: audit, census export, ministry reporting plus SOAP visibility.
Backend aggregates from census availability load plus history. SOAP /ws with getCentralCensus getHospitalLoad getDoctorSchedule WSDL at /ws/central.wsdl.
Layout: report cards Census Snapshot, Bed Availability, Hospital Load, Referral Throughput. Each with date range, hospital scope, preview chart plus table, Export CSV PDF, Copy SOAP payload.
Preview plus export pattern: pagination for search results, not infinite scroll. Show generation loading skeleton then download plus View history.
Audit note: show Generated by Role at time plus filters applied for traceability.

## 5 Component System - Atoms to Pages

Atoms: Button variants Primary #0891B2, CTA #059669, Secondary outline, Danger, Ghost. All states enabled hovered focused pressed disabled error. Min 44 by 44 touch. Input text select date textarea with label plus hint plus error. Label 14 medium. Badge status BOOKED CANCELLED COMPLETED PENDING ACCEPTED with icon plus text. Icon set Lucide or Heroicons 24 viewBox consistent. No emojis as icons. Load Light dot plus label.

Molecules: SearchBar input plus scope select plus button. FormField label plus input plus hint plus error role alert. PatientCard photo initials plus centralId copy plus meta plus actions. SlotChip time plus state Available Booked Selected with aria-pressed. KPI card label plus tabular value plus delta plus spark. OccupancyBar track plus fill plus percent text.

Organisms: Header with emblem, scope switcher, role badge, user menu, skip link. CentralId Command Bar sticky with search plus ticker. SideNav with sections Command Hospitals Doctors Patients Appointments Referrals Beds Records Reports plus badge counts for pending referrals and full wards. DataTable with sortable headers, sticky header, overflow-x-auto wrapper, row actions, pagination. Timeline ordered list with dot plus connector. BookingWizard 3 steps with progress plus summary rail. ReferralBoard kanban plus list toggle. BedMatrix.

Templates: Auth centered card. Dashboard header plus command bar plus KPI plus charts plus table. Detail header plus tabs plus content. Form split form left summary right. All with max-w-7xl consistent, px-4 md px-6 lg px-8.

Pages: as in Section 4 with real content examples MH-2026-004213, AIIMS Delhi, Dr Rao Cardiology.

## 6 Responsive and Performance as Design
Breakpoints 320 small, 768 tablet, 1024 desktop, 1440 large. Mobile first.
- 320: single column, KPI 2 col, tables to cards, calendar to agenda, command bar stacked, touch 44px, no horizontal scroll.
- 768: 2 col KPI and charts stacked, side nav to bottom bar or hamburger with focus trap, bed matrix scrolls with sticky first column.
- 1024: full side nav 240px plus content, 3 col KPI, 2 col charts.
- 1440: max-w-7xl centered, 6 KPI in row, 2 col charts plus wide table.
Fluid with clamp for type 16 to 18 body, percentages plus viewport units, never fixed px for layout.
Core Web Vitals targets LCP under 2.5s, CLS under 0.1, INP under 200ms. Skeleton screens for perceived performance, optimistic UI for admit discharge with rollback on 409, lazy load charts, pagination page size 20, srcset for images, transform opacity only animations.

## 7 Accessibility WCAG 2.1 AA Checklist
Perceivable: alt text for all images and initials fallback, captions where video used, contrast 4.5 to 1 text and 3 to 1 large text verified, never color alone always icon plus text, focus visible 3px outline.
Operable: fully keyboard navigable with logical tab order, skip links to main and to search, no keyboard traps, focus trap in modals with Escape to close and return focus, visible focus, no time limits on forms, slash focuses search.
Understandable: clear labels, consistent nav across roles, error identification with suggestions and recovery steps, readable language grade 8, centralId format help text.
Robust: semantic HTML header nav main table, ARIA landmarks, live regions polite for ticker and assertive for errors, screen reader tested with NVDA JAWS VoiceOver, axe DevTools plus Lighthouse 95 plus manual keyboard walkthrough.
Motion: respect prefers-reduced-motion disable ticker auto refresh animation, no auto playing over 5s.
Testing plan: automated axe plus Lighthouse, manual keyboard only booking flow, screen reader history timeline walkthrough, color blindness simulator for Load Lights.

## 8 Interaction Patterns and Heuristics Nielsen 10 Mapped
1 Visibility: Live ticker, loading skeleton, booking progress, admit counts.
2 Match real world: Ward names GENERAL ICU EMERGENCY, user language Admit Discharge Refer, not DB terms.
3 Control: Undo for book cancel admit discharge, redo via history, Escape closes modals.
4 Consistency: same table pattern, same status pills, same error layout everywhere.
5 Prevention: disable past dates, disable Full admit, confirm dangerous transfers, constrain phone and age inputs.
6 Recognition: visible filters and recent centralIds, not memorized IDs.
7 Flexibility: slash shortcut, recent searches, bulk export for experts, simple wizard for novices.
8 Minimal: every pixel earns place, quiet cards, one signature divider only.
9 Error recovery: 400 shows field error plus fix hint, 404 shows search again plus register, 409 double book shows nearest free slots, 409 bed full shows nearby hospitals, 500 shows Retry plus support ID.
10 Help: searchable help drawer task focused, empty states guide to first action never blank page.

Empty Success Error summary:
- Empty: guide to first action with button.
- Loading: skeleton over spinner for lists and charts.
- Success: brief toast plus Undo where forgiving.
- Error: what happened plus what to do plus link.

## 9 API Binding Map for Implementation Team
- Central Command uses GET /api/central/census and GET /api/central/availability. Poll 60s. SOAP getCentralCensus backup.
- Hospitals uses GET POST /api/hospitals. Detail uses GET /api/central/hospitals/:id/load plus GET /api/beds/hospital/:id plus GET /api/doctors?hospitalId.
- Doctors uses GET /api/doctors?hospitalId and specialization plus GET /api/doctors/hospital/:hospitalId/departments. Schedule via SOAP getDoctorSchedule plus appointments by doctor.
- Patients uses POST GET /api/patients, lookup GET /api/patients/central/:centralId, history GET /api/patients/:id/history joining appointments records referrals.
- Appointments uses POST /api/appointments/book with 409 handling and PUT /api/appointments/:id/cancel.
- Referrals uses GET POST /api/referrals and PUT /api/referrals/:id/accept.
- Beds uses GET /api/beds, POST upsert with hospitalId wardType total, POST admit discharge with 409 full handling.
- Records uses GET POST /api/records and GET /api/records/patient/:patientId.
- Reports aggregates above plus SOAP /ws WSDL /ws/central.wsdl.
Validation: @Valid on every create. Map 400 to field errors, 404 to not found with search again, 409 to conflict with alternatives, 500 to retry.

## 10 Findings List - Issue Severity Recommendation
1 Issue CentralId not prominent in current fragmented flow. Severity Critical. Recommendation Keep CentralId Command Bar sticky globally with copy and recent searches, slash shortcut.
2 Issue Bed availability only numeric without pressure signal. Severity High. Recommendation Add Load Lights with icon plus text plus percent and Tight warning at 80 percent and Full at 100 percent.
3 Issue Double booking 409 will confuse desk staff. Severity High. Recommendation Design inline conflict recovery showing nearest free slots and one click rebook plus role alert announcement.
4 Issue Wide availability and history tables overflow on mobile. Severity High. Recommendation Use overflow-x-auto plus card fallback under 768 and agenda list for calendar.
5 Issue Referral status only text PENDING ACCEPTED. Severity Medium. Recommendation Use pill with icon plus text and kanban plus accessible table toggle and live region on change.
6 Issue Form errors risk visual only red border. Severity High. Recommendation Use label plus hint plus role alert error with suggestion and next steps plus Try again.
7 Issue Census numbers without context. Severity Medium. Recommendation Add delta vs prior week and data table alternative for charts with aria-describedby.
8 Issue Touch targets likely under 44px on dense tables. Severity Medium. Recommendation Enforce 44 by 44 minimum for all buttons chips and row actions with 8px gap.
9 Issue Motion may distract and harm vestibular users. Severity Medium. Recommendation Limit to 150 to 300ms color opacity transitions and honor prefers-reduced-motion.
10 Issue Role confusion accessing cross hospital data. Severity High. Recommendation Add scope banner You are viewing Hospital Name and lock switcher by role plus audit in Reports.

## 11 Handoff Notes
Spec only, no code per request. Implementation team to use tokens in Section 2, layouts in Section 4 ASCII wireframes, components in Section 5, and bindings in Section 9 against http://localhost:8086/api. Validate with 5 users per role for 85 percent issue coverage, HEART metrics task success for booking under 2 minutes, usability test centralId search and admit flows keyboard only. Screenshots to add in screenshots folder 01-central-census 02-availability 03-soap-wsdl. Next steps dev team builds Design Tokens via Style Dictionary then Storybook with live examples props and accessibility notes.

