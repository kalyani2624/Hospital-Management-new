# Demo seed — reviewer verify (backend-only)

Seed runs on every fresh boot via `config/DemoDataLoader.java`
(`CommandLineRunner`, `@Profile("!test")`, `hub.seed-demo` flag).
Fresh H2 (`jdbc:h2:mem:central_hub`) gives stable IDs 1..n in fixed save order.
MySQL restart is idempotent (skips when hospitals exist). Tests stay hermetic:
`src/test/resources/application.properties` sets `hub.seed-demo=false` → `mvn test` 26/26.

## Counts (fresh boot)

- hospitals 3 (1 AIIMS Delhi CENTRAL 500, 2 Safdarjung DISTRICT 300, 3 RML CENTRAL 250 — all Delhi)
- departments 4 (1 Cardiology@1, 2 Orthopaedics@2, 3 General Medicine@3, 4 General Medicine@1)
- doctors 6 (1 Cardiology@1, 2 General@1, 3 Ortho@2, 4 General@2, 5 General@3, 6 Cardiology@3)
- patients 8 (CENT-001..008, IDs 1..8, with phone 9876500001..08)
- appointments 6 BOOKED future-dated, IDs 1..6, UNIQUE(doctor,time) respected
- referrals 2 (1 ACCEPTED, 2 PENDING — proves PENDING → ACCEPTED)
- beds 6 rows (GENERAL+ICU per hospital, occupied < total and > 0 so admit/discharge work)
- records 3 (IDs 1..3)

Free 409-demo slot (never seeded): doctor 1 at `base+7d 10:00` — pick any future
slot not in the list, e.g. `+9d 10:00:00`. First POST → 201, second identical POST → 409.

## Verify

```powershell
cd "D:\API\Hospital Management System"
.\mvnw.cmd test
# Expected: Tests run: 26, Failures: 0, Errors: 0, Skipped: 0

.\mvnw.cmd spring-boot:run
# Terminal 2:
curl.exe -s http://localhost:8086/api/central/census
# Fresh boot expect:
# {"hospitals":3,"doctors":6,"patients":8,"appointments":6,"referrals":2,"totalBeds":575,"occupiedBeds":322}

curl.exe -s http://localhost:8086/api/central/availability
curl.exe -s http://localhost:8086/api/patients/central/CENT-001
curl.exe -s http://localhost:8086/api/beds/hospital/1
curl.exe -s http://localhost:8086/api/referrals
curl.exe -s http://localhost:8086/api/records/patient/1
curl.exe -s http://localhost:8086/api/doctors/hospital/1/departments
```

409 double-book demo (PowerShell-safe via file — inline `-d '{...}'` quoting gives 400):

```powershell
$slot = (Get-Date).AddDays(9).ToString("yyyy-MM-dd") + "T10:00:00"
@{ patientId=7; doctorId=1; hospitalId=1; appointmentTime=$slot } | ConvertTo-Json | Set-Content $env:TEMP\book.json
curl.exe -s -X POST http://localhost:8086/api/appointments/book -H "Content-Type: application/json" --data-binary "@$env:TEMP\book.json"
# → 201 with id 7
curl.exe -s -X POST http://localhost:8086/api/appointments/book -H "Content-Type: application/json" --data-binary "@$env:TEMP\book.json"
# → 409 {"status":409,"error":"Conflict","message":"doctor 1 already booked at ..."}
curl.exe -s -X PUT http://localhost:8086/api/appointments/7/cancel
```

Beds admit/discharge (both 200):

```powershell
curl.exe -s -X POST "http://localhost:8086/api/beds/admit?hospitalId=1&wardType=General"
# → occupied 121
curl.exe -s -X POST "http://localhost:8086/api/beds/discharge?hospitalId=1&wardType=General"
# → occupied 120
```

Disable seed (tests already do this):

```properties
hub.seed-demo=false
```
