# Govt Hospital Hub — DESIGN V2 Premium Spec
### Ayushman / CoWIN-level • One Citizen, One Record, Every Hospital • Vite React + `http://localhost:8086/api`

> **Promise:** From demo-looking to nation-scale trust. Deep teal → emerald hero, saffron spark, glass cards, rounded-2xl, Inter + Plus Jakarta, light + dark, motion that feels alive. Every route kept — every pixel remodeled.
> **Scope:** Spec ONLY — no code. Dev implements later. Routes preserved: `/` landing, `/login` `/signup` `/forgot`, `/dashboard` `/hospitals` `/hospitals/:id` `/doctors` `/patients` `/patients/:centralId` `/appointments` `/referrals` `/beds` `/records` `/reports` `/profile` `/settings` `/help` + `404`.

---
## 0. How To Read This Spec
- **Tokens first:** all colors/spacing/shadows are tokens (`color.primary`, `spacing.md`). Never hard-code hex in code.
- **Light + Dark:** theme = token swap, not duplicate CSS. See §3.
- **States:** every component lists Enabled / Hover / Focus / Pressed / Disabled / Error / Loading / Empty.
- **A11y:** WCAG 2.1 AA is Day-1 (§13). 44px targets, 4.5:1 text, keyboard + SR tested.
- **Signature moment:** the hero — living India-health gradient mesh + glass live-network card with animated counters + tricolor thread. One wow, everything else quiet.

---
## 1. V1 Audit — Why It Feels Like a Demo (Findings List)

| # | Issue | Severity | Concrete Recommendation (V2 Fix) |
|---|-------|----------|----------------------------------|
| 1 | Flat cyan `#0891B2` + 8px radius + Lexend/Source Sans feels generic govt-template | **High** | New gradient system §2: `deep-teal #0E7490 → emerald #059669`, saffron `#F59E0B` accent only 8% of pixels, radius 16–24px, Inter + Plus Jakarta |
| 2 | Emoji icons (📊🏥🩺) break trust, inconsistent sizing | **High** | Lucide SVG set only, 24×24 viewBox, `w-5 h-5`, duotone on active. No emoji in UI (§15) |
| 3 | Sidebar flat white, no hierarchy, no collapse, active = solid block | **High** | New sidebar §6: grouped sections, icon rail collapse 248→72px, active = gradient pill + left glow + badge |
| 4 | Topbar crowded: role+scope+theme+profile+logout in one wrap | **High** | New topbar §6: search center, notifs bell with dot, avatar dropdown consolidates role/scope/theme/logout |
| 5 | KPI cards white boxes, tabular numbers but no delight | **Medium** | Gradient KPI §9: icon tile + delta spark + hover lift + count-up animation |
| 6 | Landing hero dark teal flat, small stats, no social proof | **High** | New landing §7: mesh gradient hero + glass live card + counters + trusted-by strip + testimonials + Ayushman-style scheme band |
| 7 | Auth centered card on gradient — forgettable, no illustration | **High** | Split-screen auth §8: left brand panel (gradient + pattern + quote + stats), right form card, SSO + role quick-pick |
| 8 | Tables dense, no avatars/badges rhythm, sticky header grey | **Medium** | Premium tables §10: avatar+name stack, status pills with icon+text, zebra off, row hover wash, 44px rows |
| 9 | Load Lights dot-only, small; occupancy bar thin | **Medium** | Load Lights Premium §10: 12px dot + ring + label + % + bar 8px rounded + text (never color alone) |
| 10 | Skeletons grey shimmer blocks, empty states single emoji | **Medium** | Skeleton screens shaped like content (§10) + illustrated empty states with headline + primary CTA + secondary link |
| 11 | Charts default Recharts blue/grey, 280px box | **Medium** | Styled charts §9: emerald/teal/saffron palette, rounded bars, gradient area fills, custom tooltip card, empty chart state |
| 12 | No testimonials, no trusted-by, no scheme awareness | **Medium** | Add strips §7: `Trusted by` hospital logos + ABHA/AB-PMJAY band + 3 testimonials with photos |

---
## 2. Design Tokens V2 (Single Source of Truth)

### 2.1 Color — Premium India Govt Health
**Core gradient:** `linear-gradient(135deg, #0E7490 0%, #0D7A7A 38%, #059669 100%)` — deep teal → teal-emerald → emerald. Saffron spark `#F59E0B` sparingly.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `color.primary` | `#0E7490` | `#22D3EE` | links, active nav, focus ring |
| `color.primary-ink` | `#164E63` | `#ECFEFF` | headings on light |
| `color.emerald` | `#059669` | `#34D399` | CTA, success, chart primary |
| `color.saffron` | `#F59E0B` | `#FBBF24` | accent only: badges, underlines, chart highlight, 8% max |
| `color.navy` | `#1E3A8A` | `#93C5FD` | tricolor thread start, footer |
| `color.bg` | `#F0FDFD` → `#F8FAFC` wash | `#062A33` | app bg (subtle mesh, not flat) |
| `color.surface` | `#FFFFFF` | `#0B3B47` | cards |
| `color.surface-2` | `#ECFEFF` / `#F1F8F8` | `#114656` | hover wash, kanban col |
| `color.glass` | `rgba(255,255,255,0.72)` blur 16px | `rgba(11,59,71,0.72)` blur 16px | hero card, topbar on scroll |
| `color.text` | `#0F2E3A` (softer than pure) | `#ECFEFF` | body — 4.5:1 min |
| `color.muted` | `#475569` | `#A8C0C8` | secondary — 4.5:1 on bg |
| `color.border` | `#CBD5E1` | `#155E75` | inputs |
| `color.border-subtle` | `#E2E8F0` | `#155E75` at 60% | card borders |
| `color.success` | `#059669` | `#34D399` | + bg `#DCFCE7` / `#052E16` |
| `color.warning` | `#B45309` | `#FBBF24` | + bg `#FEF9C3` / `#422006` |
| `color.danger` | `#DC2626` | `#F87171` | + bg `#FEE2E2` / `#450A0A` |
| `color.info` | `#0284C7` | `#38BDF8` | + bg `#F0F9FF` / `#082F49` |

**Tricolor thread (heritage, not flag-waving):** 3px bar `linear-gradient(to right, #1E3A8A 0 33%, #F59E0B 33% 66%, #059669 66% 100%)` — hero base, footer base, section divider `.ashoka-v2`.

### 2.2 Shape / Elevation / Spacing
- **Radius:** `shape.sm 8px` (chips/inputs inner), `shape.md 12px` (buttons/inputs), `shape.lg 16px` (cards default), `shape.xl 24px` (hero panel, auth card, modals). Tables container 16px. Pills 999px always.
- **Shadows (soft, teal-tinted, never harsh black):**
  - `elevation.1: 0 1px 2px rgba(14,116,144,0.06), 0 4px 16px rgba(14,116,144,0.08)`
  - `elevation.2: 0 8px 24px rgba(14,116,144,0.14), 0 2px 8px rgba(14,116,144,0.08)`
  - `elevation.3: 0 16px 48px rgba(14,116,144,0.22), 0 4px 12px rgba(5,150,105,0.10)` (hero glass, modals)
  - Dark: `0 8px 28px rgba(0,0,0,0.45)` + `inset 0 1px 0 rgba(255,255,255,0.06)` top highlight.
- **Spacing scale:** 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64. Page max `1280px` (1360px @1440+). Page pad `20px → 24px (768) → 32px (1024)`.
- **Glass:** `backdrop-filter: blur(16px) saturate(1.2)` + `border: 1px solid rgba(255,255,255,0.4)` light / `rgba(255,255,255,0.12)` dark.

### 2.3 Motion
- `motion.fast 150ms`, `motion.base 220ms`, `motion.slow 320ms`, `ease: cubic-bezier(0.22,1,0.36,1)` (emphasized-out).
- Hover lift: `translateY(-2px) + elevation.2`. Press: `scale(0.98)`. Focus ring morph, not jump.
- `prefers-reduced-motion: reduce` → all animation none, counters show final value instantly, no parallax.

### 2.4 Typography — Inter + Plus Jakarta (CoWIN-grade legibility)
- **Display:** `Plus Jakarta Sans` 700/800, letter-spacing `-0.02em`, line-height 1.08. H1 `clamp(32px, 4.5vw, 56px)` landing / `clamp(24px,3vw,30px)` app.
- **Body/UI:** `Inter` 400/500/600/700, 16px base min, line-height 1.5, tabular-nums for data (`font-variant-numeric: tabular-nums`).
- **Hindi support:** `Noto Sans Devanagari` fallback for `स्वास्थ्य` strings — `font-family: Inter, Noto Sans Devanagari, system-ui`.
- **Scale:** 12 caption / 13 eyebrow-uppercase / 14 hint / 15 table / 16 body / 18 h3 / 22 h2 / 30 h1-app / 56 h1-landing.
- **Eyebrow:** 13px 700 uppercase `letter-spacing: 0.08em` + saffron dot or line. Never grey-on-grey.

---
## 3. Theming — Light + Dark via Token Swap
- `data-theme=light|dark` on `<html>`. All components use `var(--*)` — no duplicate stylesheets.
- **Light mood:** airy clinic morning — `#F0FDFD` wash + white cards + teal text. Borders visible `#E2E8F0`. Glass `bg-white/80` min (never `/10` — invisible).
- **Dark mood:** deep ocean ward at night — `#062A33` bg, `#0B3B47` surface, cyan `#22D3EE` links, emerald `#34D399` success. Add top highlight + stronger shadows. Text `#ECFEFF`, muted `#A8C0C8` (tested 4.5:1).
- **High-contrast toggle (Settings):** bumps text to pure white/black, borders 2px, focus 4px, removes translucency.
- **Theme preview chips (Settings):** three live tiles — Primary / Surface-2 / Success-bg — so user sees swap instantly.

---
## 4. Layout System + Breakpoints
- **Shell:** sidebar 264px (expanded) ↔ 76px (icon rail) + main col + sticky glass topbar + command bar + `max-width` page.
- **Grids:** `kpi-grid: 1col(320) → 2col(480) → 3col(768) → 4col(1024) → 6col(1280 dashboard only)`; `feature-grid 1→2→3`; `doc-grid 1→2→3`; `bed-matrix 1→2→3`.
- **Breakpoints:** 320 small / 480 phablet / 768 tablet / 1024 desktop / 1280 wide / 1440 large. Design mobile-first, enhance upward. Fluid `clamp()` + `%` + `vw`, no fixed px widths.
- **Sticky order:** topbar `z-30`, command bar below it (collapses on scroll past 120px to slim), sidenav `z-50` mobile drawer + scrim, toasts `z-60`, modals `z-70`.
- **Footer:** slim app footer inside shell; gov footer only on landing.

---
## 5. Global Signature Details (The Wow Glue)
1. **Mesh gradient bg:** app bg is not flat — `radial-gradient(600px at 10% 0%, rgba(34,211,238,0.12), transparent), radial-gradient(800px at 90% 10%, rgba(5,150,105,0.10), transparent), linear(#F0FDFD,#F8FAFC)`. Dark: teal glows at 12% opacity.
2. **Tricolor thread:** 3px gradient line under hero, above footer, between landing sections. App pages: 3px rounded `hr.ashoka-v2` under H1.
3. **Glass topbar on scroll:** transparent → `glass` + `elevation.1` after 8px scroll. Sidebar active item has soft glow `0 2px 12px rgba(14,116,144,0.35)`.
4. **Count-up numbers:** all KPI/hero numbers animate 0→value 800ms ease-out, tabular-nums, respect reduced-motion.
5. **Saffron underline:** nav active + tab active = 3px gradient underline teal→emerald with 4px saffron tick at start — subtle India nod.

---
## 6. Chrome — Sidebar / Topbar / Command Bar / Mobile

### 6.1 Sidebar V2 (264px → 76px rail)
- **Brand block:** 44px rounded-14 gradient emblem (white `+` cross in gradient tile + subtle pulse ring) + `Govt Hospital Hub` (Plus Jakarta 700 16px) + `One Citizen, One Record` (12px muted). Collapse button chevron at edge.
- **Sections with labels:** `OVERVIEW` (Command), `NETWORK` (Hospitals, Doctors, Patients), `CARE FLOWS` (Appointments, Referrals with live badge, Beds, Records), `INSIGHTS` (Reports), `ACCOUNT` (Profile, Settings, Help, Public site). Labels 11px uppercase muted — scannable, not wall-of-links.
- **Item:** 44px min-height, 12px radius, icon 20px Lucide + label 15px 600. Hover: `surface-2` wash + translateX(2px). Active: gradient `linear(135deg,#0E7490,#059669)` white text + left 3px saffron bar + glow. Referrals badge: saffron pill with count + `aria-label`.
- **Collapsed rail:** icons only + tooltips + badges dots. Labels hidden, sections become dividers. Persist in `localStorage hub.navCollapsed`.
- **Foot user-chip:** avatar 36px gradient initials + name + role · hospital + mini scope line + theme dot. Click → Profile.
- **Icons (Lucide, never emoji):** Command `LayoutDashboard`, Hospitals `Building2`, Doctors `Stethoscope`, Patients `Users`, Appointments `CalendarCheck`, Referrals `ArrowLeftRight`, Beds `BedDouble`, Records `FileText`, Reports `BarChart3`, Profile `UserRound`, Settings `Settings2`, Help `LifeBuoy`.

### 6.2 Topbar V2 (glass, search-centric)
- **Left:** mobile hamburger (44px) + `Central Command` breadcrumb title + env pill `LIVE :8086` (emerald dot pulse).
- **Center search:** 320px max, rounded-12, search icon inside, `Search hospitals, doctors, centralId… ( / )` placeholder, dropdown glass card with avatar rows + city + free-beds chip. Keyboard: `/` focus, `Esc` close, arrows navigate.
- **Right:** bell with saffron count dot → glass popover (360px) with icon rows + `Refresh now`; divider; avatar 36px dropdown (Profile, Settings, Theme toggle, Logout) — replaces 4 scattered controls. Role badge becomes subtle outline pill inside dropdown header, not topbar clutter.
- **Scope banner V2:** slim info bar below topbar, icon + text + `Change` link. SuperAdmin emerald wash; scoped teal wash. Dismissible per session, `role=status`.

### 6.3 Command Bar V2 (CentralId)
- **Card-style:** rounded-16 surface + border + `elevation.1`, label `CENTRAL ID` eyebrow + large input (18px, mono for ID `ui-monospace`) + gradient `Go →` button 48px. Hint `MH-2026-004213 — press /` + Recent-5 chips (pill, hover lift). Live ticker right: pulse dot + `Occupancy 72%` + `Pending 4` + `Updated 14:32` + Live/Pause pill toggle.

### 6.4 Mobile (320–900)
- Sidebar = drawer 272px + scrim blur, swipe-to-close, focus trap, `Esc` closes. Topbar search becomes full-width second row. KPI 2-col, hero stacks, tables → card list (each row = card with avatar + 2 lines + pill). All tap targets 44×44 min. No horizontal scroll.

---
## 7. Landing V2 — Attractive, Real, Trusted (The Wow Page)

**Structure:** gov-strip → hero (copy + glass live card) → trusted-by → stats counters → features → scheme band → how-it-works → availability preview → testimonials → CTA → gov-footer.

### 7.1 Gov Strip (slim, credible)
Dark navy `#0B2F3A` 36px bar: left `Emblem Ministry of Health & Family Welfare · Government Hospital Network` + right `ABHA · Staff login · Help · English | हिन्दी`. 13px, links cyan-300.

### 7.2 Hero — Thesis Moment
- **Bg:** full-bleed `135deg #0E7490 → #059669` + mesh overlays + subtle EHR grid pattern (8% white) + soft white wave at base + floating blurred orbs (teal/emerald/saffron at 20% opacity, 60px blur, slow drift 12s, disabled on reduced-motion). Min-height 560px, padding 64/32.
- **Copy (left):** eyebrow `● CENTRALIZED HOSPITAL HUB · LIVE` cyan-200; H1 `One Citizen, One Record, Every Hospital.` (Plus Jakarta 800, white, `Hospital.` in saffron-300 italic serif accent for warmth); lede 19px `#E0F2FE` max 60ch; CTA row: primary saffron-tinted? No — CTA emerald-white: `Staff Login →` (white bg, teal-900 text, 48px, lift on hover) + ghost `Explore Live Dashboard` (white/15 border white/40, blur). Micro-note `No password for demo — pick role + hospital`. Trust pills row: `● REST live` `◈ SOAP bridge` `ABHA-ready` glass pills.
- **Glass live card (right):** `glass` 24px radius + `elevation.3`, header `Live network snapshot` + `Open command →` + live dot; 4 mini KPIs (Hospitals/Doctors/Patients/Occupancy) 24px Jakarta numbers with count-up; availability list 6 rows: hospital avatar initial + name + city + `12 free` + Load Light. Footer `Updated 12s ago · Auto-refresh`. Loading = shaped skeletons (not blocks); error = friendly card with Retry + Continue to login (what happened + what to do).
- **Stats counters band (below hero, overlapping -32px):** 6 white cards with gradient icon tiles, big 30px numbers count-up on scroll into view, delta `▲ 4.2% this week` emerald + sparkline. Cards: Hospitals, Doctors, Patients, Appointments, Referrals, Beds occupied.
- **Trusted-by strip:** `TRUSTED ACROSS THE PUBLIC NETWORK` eyebrow + 6 hospital wordmarks (text logos, grayscale → color on hover) + `+ 42 more` + ABHA + AB-PMJAY badges. Marquee on mobile (pause on hover/focus).
- **Features (6):** icon tile gradient (teal/emerald/saffron rotation) 48px rounded-14 + H3 + 15px muted + `Try →` link with arrow slide on hover. Cards lift on hover. Copy real: CentralId bar, Bed pressure, Booking recovery, Referral kanban, Gated notes, Exports+SOAP.
- **Scheme band (Ayushman credibility):** gradient navy→teal card 24px radius: left `AB-PMJAY · Cashless care up to ₹5 lakh` + bullets (eligibility check, empanelled hospitals, claim status) + `Check eligibility →`; right illustration (family + shield abstract, not stock photo).
- **How it works (3 steps):** numbered gradient circles 1-2-3 + connecting dashed line (desktop) + cards. CTA row: `Onboard your hospital` (saffron `#F59E0B` bg, #451A03 text — high contrast, festive) + `Explore without login`.
- **Testimonials (new — trust):** 3 glass cards: quote 16px, avatar photo (initials fallback), name + role (CMO, Sister-in-charge, Patient), 5-star saffron, hospital tag. `“Referral time fell from 3 days to 4 hours.” — Dr. Meera, AIIMS-like District Hospital`.
- **Availability preview table:** premium table §10 + `View all →`. Empty = illustrated (hospital line art + `No hospitals yet` + onboard CTA).
- **Final CTA:** gradient panel `Ready to bring your hospital online?` + buttons + `Synthetic demo data only` caption.
- **Gov footer:** navy, 3 cols (About + Network links + Compliance: `HIPAA-style PHI-safe · DPDP Act aware · Audit logs`), bottom tricolor 5px bar.

---
## 8. Auth V2 — Split-Screen, Attractive, Fast

**Layout:** 2-col 50/50 desktop (1024+); stacked mobile (brand compact top). Left brand panel sticky full-height gradient + pattern; right form centered 480px max.

### 8.1 Left Panel (never seen in V1 — the delight)
- Bg gradient teal→emerald + EHR grid + large translucent `+` watermark + floating glass stat chips (`Occupancy 72%`, `4 referrals pending`, `ABHA-linked 12,408`).
- Top: emblem + `Govt Hospital Hub`. Middle: H2 `Care continuity starts with one ID.` + lede + 3 check bullets (One search, Live beds, Audit-ready). Bottom: quote card glass (`“We stopped losing patients in transfers.” — Duty Officer`) + mini stats row + language toggle.
- Illustration: abstract — overlapping glass cards + doctor avatar cluster + map pins (SVG line art, teal/white/saffron, no clip-art).

### 8.2 Right Form Card
- White (dark: surface) 24px radius + `elevation.2`, 32px pad. Header: `Welcome back` H2 + `Sign in to Central Command` hint + role quick-pick chips (SuperAdmin/HospitalAdmin/Doctor/Receptionist — pill, active gradient, 36px min).
- Fields: floating labels? No — top labels 14px 700 + 48px inputs rounded-12 + icon left + show/hide eye + inline validation (error red + `⚠` + suggestion `Try MH-…`). Focus: 2px teal ring + border-teal + soft glow. Caps-lock hint for password.
- Actions: primary gradient button 48px full-width (`Sign in →`, loading spinner + `Signing you in…`), secondary `Forgot?` + `Create hospital account`. Divider `or` + SSO row (ABHA / Govt SSO — disabled with `Soon` badge, honest).
- Extras: Remember + scope select (hospital dropdown with search), demo hint box info-blue (`No password — pick role to explore`), Capsule: `By signing in you agree to PHI-safe use.`
- **Signup variant:** same split, left headline `Onboard your hospital in 10 minutes.` + steps 1-2-3 mini; right 2-col form (hospital + admin), progress `Step 1 of 2`, success state confetti-dot + `Check email →` + undo resend.
- **Forgot:** centered narrow card + `We emailed a reset link` success + `Back to login`.

---
## 9. App Pages V2 (Keep Routes, Remodel Visuals)

### 9.1 Dashboard — Central Command (the mission control)
- **Header:** H1 `Good morning, Dr. Sharma` (Jakarta) + date + scope pill + actions (`+ New appointment`, `Export`, density toggle). Ashoka thread below.
- **KPI row (6):** gradient-top-border cards: icon tile 40px gradient + label uppercase 12px + 28px value count-up + delta pill (`▲ 6%` emerald / `▼` red) + sparkline SVG. Hover lift. Colors rotate teal/emerald/saffron/blue/purple/rose for scanability, text stays AA.
- **Main grid:** left 2/3: `Occupancy trend` area chart (gradient fill teal→transparent, rounded dots, glass tooltip) + `Referral funnel` horizontal bars + `Hospital load table` preview. Right 1/3: `Live alerts` timeline premium + `Bed pressure` donut (Available/Tight/Full) + `Quick actions` 2×2 icon buttons.
- **Charts styled:** Recharts palette `[#0E7490,#059669,#F59E0B,#0284C7,#8B5CF6,#F43F5E]`; grid `#E2E8F0` dashed; tooltip white card 12px radius + shadow; empty chart = dashed placeholder + `No data yet — admit first patient`.

### 9.2 Hospitals / HospitalDetail
- **List:** filter toolbar (search + city select + load filter pills + sort) + cards grid (not just table): hospital cover gradient strip by load + avatar + name + city + Load Light + `12/40 free` + occupancy bar + `View →`. Premium table toggle for density lovers.
- **Detail:** hero banner gradient + hospital avatar 64px + name + city + badges (NABH, AB-PMJAY empanelled) + tabs (Overview | Doctors | Beds | Activity). Overview: KPI + occupancy chart + doctor avatars stack + recent referrals timeline. Beds tab embeds bed matrix.

### 9.3 Doctors
- **Cards:** avatar 56px photo/initials gradient ring + name + specialty pill + hospital + next slots strip (pill slots, selected gradient, booked strikethrough + `aria-disabled`) + `Book →`. Filter: specialty chips + availability toggle + search. Hover lift + quick `View schedule` on hover.

### 9.4 Patients / PatientDetail (One Citizen, One Record)
- **List:** search hero (CentralId prominent, mono) + table premium: avatar + name + centralId mono chip + age/sex + hospital + last visit + status pill. Row click → detail. Duplicate 409 = friendly banner with link to existing.
- **Detail:** header card: avatar-lg 64px + name + centralId copy button + ABHA-linked badge + actions (Book, Refer, Add note gated). Tabs: Timeline | Appointments | Referrals | Records. **Timeline premium:** vertical line gradient, dots colored by type (emerald visit, teal appointment, saffron referral, blue note), cards with time + title + excerpt + link, filter chips. Empty timeline = illustration + `Start with first appointment`.

### 9.5 Appointments (Booking that recovers)
- **Wizard 3 steps:** 1 Doctor+Slot (slot pills grouped by day, morning/evening labels) → 2 Patient (search or new, validation inline) → 3 Confirm (summary card + T&C). Steps bar with progress fill gradient + check on done. 409 recovery: saffron alert `That slot just filled — nearest free: Tue 10:30` + one-click Accept.
- **Diary:** calendar strip (7 days, today gradient) + list cards with time badge + doctor + patient avatar + status pill + actions (Cancel with undo toast, Reschedule).

### 9.6 Referrals (Kanban premium)
- **Toggle:** Kanban | Table (persist). Columns PENDING (saffron header) → ACCEPTED (teal) → COMPLETED (emerald) with counts. Cards: priority stripe left (red/yellow/green) + patient + from→to hospitals + reason excerpt + age badge + drag handle. Drag: lift + shadow + column highlight dashed teal. Drop = toast with Undo 30s. Table mode = premium table with same data.
- **Triage drawer:** slide-over 400px: full reason, vitals, attachments, Accept/Decline + note, audit trail.

### 9.7 Beds (Bed pressure at a glance)
- **Matrix:** ward cards (ICU/General/Emergency) with header occupancy ring + grid of bed tiles 44px: free (emerald outline), occupied (grey fill + initials), cleaning (saffron hatch), selected (teal ring). Legend with icons+text. Admit modal + Discharge + Undo toast. Load Lights legend top.

### 9.8 Records (Doctor-gated notes)
- **Composer:** rich card: patient picker + template chips (SOAP, Discharge, Prescription) + textarea auto-grow + attach + `Save note` gradient (disabled unless Doctor/SuperAdmin with tooltip `Only Doctors can chart`). List: timeline cards with author avatar + role badge + excerpt + `View full`.
- **Gating:** non-doctor sees blur + lock illustration + `Ask a Doctor to chart — you can still view`.

### 9.9 Reports (Exports + SOAP bridge)
- **Cards:** 4 export tiles (Census, Availability, Load, Referrals) with icon + row count + `Download CSV` + last-export time. Charts: occupancy by hospital bar (rounded 8px bars, gradient), referral status donut. SOAP panel: `GET /ws/central.wsdl` status dot + `Open WSDL` + latency. Audit note `Every export is logged`.

### 9.10 Profile / Settings / Help / 404
- **Profile:** cover gradient + avatar 80px + name + role pill + hospital + stats (appointments, referrals, notes) + edit form + sessions list + danger zone (Clear demo session).
- **Settings:** sections cards: Appearance (Light/Dark/System + contrast toggle + density Comfortable/Compact + preview tiles), Notifications (switch rows 48px), Language (English/हिन्दी), Data (Recent-5 clear, Export my activity). Switches 48px track with thumb slide.
- **Help:** search hero + FAQ accordion (plus/minus rotate, 44px headers) + contact cards + shortcuts table (`/` `/` focus, `Esc` close) + status `API :8086 ● Operational`.
- **404:** gradient panel + large `404` Jakarta + stethoscope SVG + `That ward does not exist` + `Go home` + `Search CentralId`.

---
## 10. Component Library V2 (Atoms → Molecules → Organisms)

### 10.1 Buttons (all states designed)
- **Variants:** Primary gradient (`135deg #0E7490→#059669`, white, glow on hover), Secondary white/border, CTA saffron (`#F59E0B` + `#451A03` text for contrast), Danger (`#DC2626`), Ghost (transparent), Hero-white + Hero-ghost (on gradient).
- **Sizes:** sm 36px / md 44px / lg 48px. Radius 12px (pills 999 for chips). Font 15px 700 (lg 16px). Gap icon 8px.
- **States:** Enabled → Hover (lift -2px + `elevation.2` + brighten 4%) → Focus-visible (3px teal outline offset 2px + glow) → Pressed (scale .98) → Disabled (55% opacity, not-allowed) → Loading (spinner + `Creating…`, disabled) → Success (check morph 1.2s + toast + undo).
- **Rule:** never color alone for danger — add icon `⚠`/`Trash`.

### 10.2 Inputs / Selects / Textareas
- 44px min (48px auth), 12px radius, border `#CBD5E1`, bg surface. Placeholder `#64748B` (AA). Icon left 18px muted. Focus: border-primary + 3px ring `rgba(14,116,144,0.25)` + glow. Error: border-danger + bg `#FEF2F2` + message 14px 600 + suggestion. Hint 13px muted. Labels 14px 700 + required `*` saffron. Dark bg `#082F3A`.
- **Search:** rounded-12 + `⌕` + kbd `/` hint + clear `×` when filled.
- **Select:** custom chevron, max-width, native for a11y. Date/time native + slot pills for UX.

### 10.3 KPI Cards (gradients + icons)
- White 16px radius + top 4px gradient strip + icon tile 40px gradient (per-metric hue) + label 12px uppercase + value 28px Jakarta tabular + delta pill + sparkline. Hover lift. Dark: surface + strip glows. Count-up on mount/scroll.

### 10.4 Tables Premium
- Container 16px radius + border + `elevation.1`, header `surface-2` 13px uppercase, rows 52px min, hover wash, no zebra. First col: avatar 32px + name 600 + sub 13px muted. Mono for IDs. Status = pill with icon+text. Numbers tabular right-aligned. Sticky header + horizontal scroll with shadow hint on mobile; mobile <640 → card list fallback.

### 10.5 Badges / Pills / Load Lights Premium
- **Pill:** 13px 700 + icon + text + border, radius 999, padding 4/12. BOOKED/PENDING saffron wash, CANCELLED red wash, COMPLETED/ACCEPTED emerald wash, INFO blue wash. Never color alone.
- **Load Light V2:** dot 12px + ring (2px white + shadow) + label 14px 700 (`Available`/`Tight`/`Full`) + `%` tabular + bar 8px track with rounded fill (emerald/saffron/red) + `12/40 free` text. Tooltip `Occupied 28 of 40`.
- **Avatar:** gradient ring for doctors (teal→emerald), initials fallback, `alt` always, sizes 32/36/48/64/80.

### 10.6 Charts Styled
- Palette §9.1, bar radius 8px top, area gradient 30%→0, line 2.5px rounded caps, dots 6px white border. Grid dashed, axis 12px muted. Tooltip: white 12px radius card + title 600 + rows. Legend pills. Height 280–320px, responsive. Reduced-motion: static.

### 10.7 Timeline Premium
- Line 2px gradient teal→emerald, dots 16px with white border + glow + icon inside (4px). Cards 12px radius + hover lift + time 13px 700 muted + title 600 + excerpt 14px. Filter chips top. Alternating on desktop (optional), single rail mobile.

### 10.8 Kanban Premium
- Cols dashed border + header count pill + `+` add. Cards white 12px radius + left priority stripe 4px + shadow-1 + hover lift + drag handle `⠿`. Dragover: teal outline + bg tint. Empty col: dashed illustration + `Drop here`.

### 10.9 Feedback — Load / Empty / Error / Success
- **Loading:** skeleton screens shaped like target (KPI 64px, table rows, hero card) shimmer 1.4s + `Loading…` + `role=status`. Prefer skeletons > spinners; spinner only for buttons.
- **Empty (beautiful):** line-art SVG (hospital/bed/calendar) teal/saffron + H3 + hint + primary CTA + secondary link. Never blank page. Example: `No referrals — triage starts here [View pending]`.
- **Error:** `What happened:` + `What to do:` + Retry + Go-back + support link. Red wash + icon. Inline + banner + toast variants.
- **Success:** brief toast dark-teal + check + message + Undo (30s for destructive) + `View` link. Auto-dismiss 5s, pause on hover.
- **Toasts:** bottom-right 420px max, dark `#164E63` + white, 10px radius + `elevation.3`, action button ghost-white, close `×` 44px.

### 10.10 Overlays — Modals / Drawers / Popovers / Pagination / Tabs / Steps
- **Modal:** 24px radius + `elevation.3` + scrim blur 8px, header + body + footer actions, focus trap + `Esc` + return focus. Sizes sm 400 / md 560 / lg 760.
- **Drawer:** right 400px slide, same a11y. Popovers glass + 12px radius + outside-click + `Esc`.
- **Pagination:** Prev/Next 44px + `Page 2 · size 10` + per-page select. Infinite scroll only for feeds, pagination for search (heuristic).
- **Tabs:** underline gradient active + count badge, 44px headers, `aria-selected`, arrow-key nav.
- **Steps wizard:** cards with number circle (active gradient, done check emerald), connecting line fill %.

---
## 11. Motion & Micro-Animations (Delight, Not Noise)
- Page enter: fade+rise 12px 320ms staggered 40ms per card (hero first). Respect reduced-motion.
- Counters: 800ms ease-out, tabular-nums, start on visible.
- Buttons/cards: 150–300ms color/shadow/transform. Nav: slide + glow. Bell: wiggle on new alert (once). Live dot pulse 2s.
- Hero orbs drift 12s alternate, wave shimmer. Charts animate on mount 600ms.
- Skeleton shimmer, toast slide-up, modal scale .96→1 + fade, drawer slide, accordion height ease.
- `prefers-reduced-motion` kills all but opacity fades.

---
## 12. Iconography & Imagery (No Emoji Rule)
- **Set:** Lucide only, 24 viewBox, stroke 2, sizes 16/20/24, fixed `w/h`. Duotone for active (fill 20%).
- **Mapping:** §6.1. Status icons: check `CheckCircle2`, pending `Clock`, cancelled `XCircle`, beds `BedDouble`, alert `BellRing`.
- **Illustrations:** flat line-art + soft gradients (teal/emerald/saffron on light washes). Auth split, empty states, scheme band, 404. Alt text always. Photos: testimonials avatars only (initials fallback), lazy + `srcset` WebP.
- **Gov emblem:** abstract cross + Ashoka-chakra-inspired ring (not official emblem — respectful nod), never fake seals.

---
## 13. Accessibility — WCAG 2.1 AA (Day-1, Not Afterthought)
- **Perceivable:** alt + captions, 4.5:1 text / 3:1 large, never color alone (icon+text+pattern), 200% zoom safe, focus visible 3px.
- **Operable:** keyboard full (Tab order logical, skip links `Skip to main/content/search`, no traps except modals with trap+return, `/` + `Esc` shortcuts documented), 44×44 targets, no time limits, pause live ticker.
- **Understandable:** labels + hints + errors with suggestions, consistent nav, language `en` + `हिन्दी` toggle, readable 16px/1.5.
- **Robust:** semantic `header/nav/main/footer`, landmarks + `aria-label`, live regions for toasts/ticker, SR tested (NVDA/JAWS/VoiceOver).
- **Test gate:** axe DevTools 0 critical + Lighthouse a11y 95+ + keyboard-only walkthrough + SR walkthrough before merge.

---
## 14. Responsive 320 → 1440 (Mobile-First)
- 320: single col, drawer nav, stacked hero, 2-col KPI, card-list tables, 44px targets, 16px page pad.
- 768: 2–3 col grids, topbar search visible, hero 1-col with glass card below copy.
- 1024: sidebar 264px, hero 2-col, 4-col KPI, kanban 3-col, split auth.
- 1440: max 1360px centered, hero 64px pad, 6-col dashboard KPI. No h-scroll, images fluid, type `clamp()`.

---
## 15. Do / Don’t (Enforce in Review)
- ✅ Do: tokens, Lucide, glass sparingly, saffron <8%, skeletons shaped, empty with CTA, undo > confirm, Inter tabular, focus rings.
- ❌ Don’t: emoji icons, `bg-white/10` in light, grey-400 body text, fixed px widths, instant state jumps, color-only status, blank pages, `var()` wrappers around tokens, sticky `top-0` navbar without offset.

---
## 16. Page-by-Page Build Checklist (for dev, design QA)
- [ ] Landing: hero gradient + glass card + counters animate + trusted strip + testimonials + scheme band + footer tricolor
- [ ] Auth: split-screen + illustration + role chips + focus glow + success/empty/error states
- [ ] Shell: collapsible sidebar + glass topbar + command bar + scope banner + drawer + toasts
- [ ] Dashboard: 6 gradient KPIs + styled charts + timeline + donut + quick actions
- [ ] Hospitals/Doctors/Patients/Appointments/Referrals/Beds/Records/Reports/Profile/Settings/Help: per §9 + premium tables/cards/timeline/kanban + empty/error/loading
- [ ] A11y + responsive pass §13–14 + reduced-motion + dark-mode contrast check

---
## 17. Handoff — Tokens + Implementation Hints (Recommendations, Not Code)
- **Fonts:** Google Fonts `Inter:wght@400;500;600;700` + `Plus Jakarta Sans:wght@600;700;800` + `Noto Sans Devanagari:wght@400;600`. Preconnect + `display=swap`.
- **Libs:** keep `react-router-dom` routes as-is, `recharts` restyled per §10.6, Lucide via `lucide-react`, no new router.
- **CSS:** CSS vars for tokens (`--color-primary` etc.) + `data-theme` swap + `backdrop-filter` glass + `clamp()` type. Style Dictionary later for Figma sync.
- **Persist:** `hub.theme`, `hub.navCollapsed`, `hub.density`, `hub.recent` (Recent-5), `hub.auth` (demo session) in localStorage.
- **Perf as design:** LCP <2.5s (hero card skeletons first, lazy below-fold), CLS <0.1 (fixed skeleton heights), images WebP + lazy, animations `transform/opacity` only 60fps.
- **Metrics (HEART):** Happiness (testimonial clicks), Engagement (search `/` uses), Adoption (onboard completes), Retention (return visits), Task success (book→confirm %, referral triage time).

---
> **Wow test:** Show landing hero on 1440 + auth split on mobile + dashboard dark. If user does not say *“this looks like a real govt health portal”* — revisit gradient warmth + counters + testimonials before shipping.
> *Spec ends. Implement with love. Synthetic data only. No real PHI.*

