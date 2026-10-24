package gov.hospital.hub.config;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import gov.hospital.hub.entity.BedInventory;
import gov.hospital.hub.entity.Department;
import gov.hospital.hub.entity.Doctor;
import gov.hospital.hub.entity.Hospital;
import gov.hospital.hub.entity.MedicalRecord;
import gov.hospital.hub.entity.Patient;
import gov.hospital.hub.repository.AppointmentRepository;
import gov.hospital.hub.repository.BedInventoryRepository;
import gov.hospital.hub.repository.DepartmentRepository;
import gov.hospital.hub.repository.DoctorRepository;
import gov.hospital.hub.repository.HospitalRepository;
import gov.hospital.hub.repository.MedicalRecordRepository;
import gov.hospital.hub.repository.PatientRepository;
import gov.hospital.hub.service.AppointmentService;
import gov.hospital.hub.service.AppointmentService.BookRequest;
import gov.hospital.hub.service.ReferralService;
import gov.hospital.hub.service.ReferralService.CreateReferralRequest;

/**
 * Demo seed for reviewer walkthrough (backend-only).
 * WHY DataLoader over data.sql: appointment slots must stay future-dated
 * (LocalDateTime.now().plusDays) and JPA saves stay H2 + MySQL compatible.
 * IDs are stable 1..n on a fresh boot because rows are saved in fixed order.
 *
 * <p>Guardrails: {@code @Profile("!test")} keeps the seed out of the
 * {@code test} profile, plus {@code hub.seed-demo=false} in
 * {@code src/test/resources/application.properties} disables it for
 * {@code mvn test} (default profile still runs tests). Idempotent skip when
 * hospitals already exist so MySQL restarts do not duplicate CENT-001..008.
 */
@Component
@Profile("!test")
@ConditionalOnProperty(name = "hub.seed-demo", havingValue = "true", matchIfMissing = true)
public class DemoDataLoader implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataLoader.class);

    private final HospitalRepository hospitals;
    private final DepartmentRepository departments;
    private final DoctorRepository doctors;
    private final PatientRepository patients;
    private final AppointmentService appointments;
    private final ReferralService referrals;
    private final BedInventoryRepository beds;
    private final MedicalRecordRepository records;
    private final AppointmentRepository appointmentRepository;

    public DemoDataLoader(HospitalRepository hospitals, DepartmentRepository departments,
            DoctorRepository doctors, PatientRepository patients,
            AppointmentService appointments, ReferralService referrals,
            BedInventoryRepository beds, MedicalRecordRepository records,
            AppointmentRepository appointmentRepository) {
        this.hospitals = hospitals;
        this.departments = departments;
        this.doctors = doctors;
        this.patients = patients;
        this.appointments = appointments;
        this.referrals = referrals;
        this.beds = beds;
        this.records = records;
        this.appointmentRepository = appointmentRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (hospitals.count() > 0) {
            log.info("Demo seed skipped: hospitals already present ({})", hospitals.count());
            return;
        }
        if (patients.findByCentralId("CENT-001").isPresent()) {
            log.info("Demo seed skipped: CENT-001 already exists");
            return;
        }

        List<Hospital> savedHospitals = seedHospitals();
        List<Department> savedDepartments = seedDepartments(savedHospitals);
        List<Doctor> savedDoctors = seedDoctors(savedHospitals, savedDepartments);
        List<Patient> savedPatients = seedPatients(savedHospitals);
        seedAppointments(savedHospitals, savedDoctors, savedPatients);
        seedReferrals(savedHospitals, savedPatients);
        seedBeds(savedHospitals);
        seedRecords(savedHospitals, savedDoctors, savedPatients);
        seedCompletedConsultations(savedHospitals, savedDoctors, savedPatients);

        log.info("Demo seed done: hospitals={} doctors={} patients={} appointments={} "
                + "referrals={} beds={} records={}",
                hospitals.count(), doctors.count(), patients.count(),
                appointments.list().size(), referrals.list().size(),
                beds.count(), records.count());
    }

    private List<Hospital> seedHospitals() {
        List<Hospital> rows = List.of(
                new Hospital("AIIMS Delhi", "Delhi", "CENTRAL", 500),
                new Hospital("Safdarjung Hospital", "Delhi", "DISTRICT", 300),
                new Hospital("RML Hospital", "Delhi", "CENTRAL", 250));
        return hospitals.saveAll(rows);
    }

    private List<Department> seedDepartments(List<Hospital> savedHospitals) {
        Hospital aiims = savedHospitals.get(0);
        Hospital safdarjung = savedHospitals.get(1);
        Hospital rml = savedHospitals.get(2);
        List<Department> rows = List.of(
                new Department("Cardiology", aiims),
                new Department("Orthopaedics", safdarjung),
                new Department("General Medicine", rml),
                new Department("General Medicine", aiims));
        return departments.saveAll(rows);
    }

    private List<Doctor> seedDoctors(List<Hospital> savedHospitals,
            List<Department> savedDepartments) {
        Hospital aiims = savedHospitals.get(0);
        Hospital safdarjung = savedHospitals.get(1);
        Hospital rml = savedHospitals.get(2);
        List<Doctor> rows = List.of(
                new Doctor("Dr Meera Krishnan", "Cardiology", aiims, savedDepartments.get(0)),
                new Doctor("Dr Kabir Khan", "General", aiims, savedDepartments.get(3)),
                new Doctor("Dr Vikram Malhotra", "Ortho", safdarjung, savedDepartments.get(1)),
                new Doctor("Dr Priya Desai", "General", safdarjung, null),
                new Doctor("Dr Amit Gupta", "General", rml, savedDepartments.get(2)),
                new Doctor("Dr Sunita Yadav", "Cardiology", rml, null));
        return doctors.saveAll(rows);
    }

    private List<Patient> seedPatients(List<Hospital> savedHospitals) {
        Hospital aiims = savedHospitals.get(0);
        Hospital safdarjung = savedHospitals.get(1);
        Hospital rml = savedHospitals.get(2);
        List<Patient> rows = List.of(
                new Patient("CENT-001", "Asha Patil", 34, "F", "9876500001", aiims),
                new Patient("CENT-002", "Ravi Kumar", 45, "M", "9876500002", aiims),
                new Patient("CENT-003", "Meera Nair", 29, "F", "9876500003", safdarjung),
                new Patient("CENT-004", "Arjun Singh", 52, "M", "9876500004", safdarjung),
                new Patient("CENT-005", "Kavita Joshi", 41, "F", "9876500005", rml),
                new Patient("CENT-006", "Suresh Yadav", 60, "M", "9876500006", rml),
                new Patient("CENT-007", "Divya Reddy", 27, "F", "9876500007", aiims),
                new Patient("CENT-008", "Karan Mehta", 38, "M", "9876500008", safdarjung));
        // Demo profile enrichment so patient portal logins show full demographics.
        var profiles = List.of(
                new Object[]{"CENT-001", LocalDate.of(1992, 3, 14), "14 MG Road, Pune",
                        "asha.patil@example.com"},
                new Object[]{"CENT-002", LocalDate.of(1981, 7, 22), "221 Baker Street, Delhi",
                        "ravi.kumar@example.com"},
                new Object[]{"CENT-003", LocalDate.of(1997, 11, 2), "C-44 Bandra, Mumbai",
                        "meera.nair@example.com"},
                new Object[]{"CENT-004", LocalDate.of(1974, 1, 30), "77 Civil Lines, Delhi",
                        "arjun.singh@example.com"},
                new Object[]{"CENT-005", LocalDate.of(1985, 5, 9), "3A Marine Drive, Mumbai",
                        "kavita.joshi@example.com"},
                new Object[]{"CENT-006", LocalDate.of(1966, 9, 18), "12 Nehru Nagar, Jaipur",
                        "suresh.yadav@example.com"},
                new Object[]{"CENT-007", LocalDate.of(1999, 2, 27), "5 Jubilee Hills, Hyderabad",
                        "divya.reddy@example.com"},
                new Object[]{"CENT-008", LocalDate.of(1988, 8, 8), "9 Park Street, Kolkata",
                        "karan.mehta@example.com"});
        for (Patient p : rows) {
            for (Object[] prof : profiles) {
                if (p.getCentralId().equals(prof[0])) {
                    p.setDob((LocalDate) prof[1]);
                    p.setAddress((String) prof[2]);
                    p.setEmail((String) prof[3]);
                }
            }
        }
        return patients.saveAll(rows);
    }

    private void seedAppointments(List<Hospital> savedHospitals, List<Doctor> savedDoctors,
            List<Patient> savedPatients) {
        // WHY truncated future slots: @Future validation + exact-match
        // UNIQUE(doctor,time) check need deterministic second precision.
        // Free 409-demo slot (never seeded): doctor 1 at base.plusDays(7) 10:00.
        LocalDateTime base = LocalDateTime.now().plusDays(2)
                .truncatedTo(ChronoUnit.SECONDS).withNano(0)
                .withHour(10).withMinute(0).withSecond(0);
        // Guard midnight rollover: if truncation pushed base into the past, push forward.
        if (!base.isAfter(LocalDateTime.now())) {
            base = LocalDateTime.now().plusDays(2).truncatedTo(ChronoUnit.DAYS).plusHours(10);
        }
        List<BookRequest> bookings = List.of(
                new BookRequest(savedPatients.get(0).getId(), savedDoctors.get(0).getId(),
                        savedHospitals.get(0).getId(), base, "Regular hypertension review"),
                new BookRequest(savedPatients.get(1).getId(), savedDoctors.get(2).getId(),
                        savedHospitals.get(1).getId(), base.plusDays(1).withHour(11),
                        "Knee pain follow-up"),
                new BookRequest(savedPatients.get(2).getId(), savedDoctors.get(4).getId(),
                        savedHospitals.get(2).getId(), base.plusDays(2).withHour(10).withMinute(30),
                        "Fracture check-up"),
                new BookRequest(savedPatients.get(3).getId(), savedDoctors.get(0).getId(),
                        savedHospitals.get(0).getId(), base.plusDays(3).withHour(9),
                        "ECG + cardiology consult"),
                new BookRequest(savedPatients.get(4).getId(), savedDoctors.get(1).getId(),
                        savedHospitals.get(0).getId(), base.plusDays(1).withHour(14),
                        "Sugar profile review"),
                new BookRequest(savedPatients.get(5).getId(), savedDoctors.get(3).getId(),
                        savedHospitals.get(1).getId(), base.plusDays(2).withHour(15),
                        "General weakness"));
        for (BookRequest booking : bookings) {
            appointments.book(booking);
        }
    }

    private void seedReferrals(List<Hospital> savedHospitals, List<Patient> savedPatients) {
        // R1 accepted (proves PENDING -> ACCEPTED), R2 stays PENDING for kanban demo.
        var first = referrals.refer(new CreateReferralRequest(savedPatients.get(0).getId(),
                savedHospitals.get(0).getId(), savedHospitals.get(1).getId(),
                "Cardiology review"));
        referrals.accept(first.getId());
        referrals.refer(new CreateReferralRequest(savedPatients.get(4).getId(),
                savedHospitals.get(2).getId(), savedHospitals.get(0).getId(),
                "Ortho specialist opinion"));
    }

    private void seedBeds(List<Hospital> savedHospitals) {
        Hospital aiims = savedHospitals.get(0);
        Hospital safdarjung = savedHospitals.get(1);
        Hospital rml = savedHospitals.get(2);
        // WHY occupied < total and > 0: admit (200) and discharge (200) both succeed.
        List<BedInventory> rows = List.of(
                new BedInventory(aiims, "GENERAL", 200, 120),
                new BedInventory(aiims, "ICU", 50, 30),
                new BedInventory(safdarjung, "GENERAL", 150, 90),
                new BedInventory(safdarjung, "ICU", 30, 12),
                new BedInventory(rml, "GENERAL", 120, 60),
                new BedInventory(rml, "ICU", 25, 10));
        beds.saveAll(rows);
    }

    private void seedRecords(List<Hospital> savedHospitals, List<Doctor> savedDoctors,
            List<Patient> savedPatients) {
        MedicalRecord first = new MedicalRecord();
        first.setPatient(savedPatients.get(0));
        first.setHospital(savedHospitals.get(0));
        first.setDoctor(savedDoctors.get(0));
        first.setDiagnosis("Hypertension review");
        first.setTreatmentNotes("BP well controlled on current dose; advise low-salt diet and "
                + "home monitoring twice weekly.");
        first.setPrescription("Amlodipine 5mg OD");
        first.setVisitDate(LocalDateTime.now().minusDays(10).truncatedTo(ChronoUnit.SECONDS));

        MedicalRecord second = new MedicalRecord();
        second.setPatient(savedPatients.get(4));
        second.setHospital(savedHospitals.get(2));
        second.setDoctor(savedDoctors.get(4));
        second.setDiagnosis("Type 2 Diabetes");
        second.setTreatmentNotes("HbA1c trending down; reinforce meal planning and daily walk. "
                + "Repeat labs in 3 months.");
        second.setPrescription("Metformin 500mg BD");
        second.setVisitDate(LocalDateTime.now().minusDays(5).truncatedTo(ChronoUnit.SECONDS));

        MedicalRecord third = new MedicalRecord();
        third.setPatient(savedPatients.get(2));
        third.setHospital(savedHospitals.get(1));
        third.setDoctor(savedDoctors.get(2));
        third.setDiagnosis("Fracture follow-up");
        third.setTreatmentNotes("Callus present on X-ray; remove slab next visit.");
        third.setPrescription("Physiotherapy 2 weeks");
        third.setVisitDate(LocalDateTime.now().minusDays(2).truncatedTo(ChronoUnit.SECONDS));

        records.saveAll(List.of(first, second, third));
    }

    /**
     * Past COMPLETED consultations so the Doctor dashboard KPIs (completed,
     * assigned patients, today) have real rows on a fresh boot. Status is set
     * directly (service book() requires @Future).
     */
    private void seedCompletedConsultations(List<Hospital> savedHospitals,
            List<Doctor> savedDoctors, List<Patient> savedPatients) {
        LocalDateTime base = LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS).withNano(0);
        List<Object[]> done = List.of(
                new Object[]{savedPatients.get(0).getId(), savedDoctors.get(0).getId(),
                        savedHospitals.get(0).getId(), base.minusDays(9).withHour(9).withMinute(30),
                        "Follow-up after hypertension review"},
                new Object[]{savedPatients.get(7).getId(), savedDoctors.get(0).getId(),
                        savedHospitals.get(0).getId(), base.minusDays(3).withHour(11),
                        "Cardiology consult"},
                new Object[]{savedPatients.get(3).getId(), savedDoctors.get(2).getId(),
                        savedHospitals.get(1).getId(), base.minusDays(4).withHour(16),
                        "Ortho follow-up"});
        for (Object[] row : done) {
            gov.hospital.hub.entity.Appointment a = new gov.hospital.hub.entity.Appointment();
            a.setPatient(patients.findById((Long) row[0])
                    .orElseThrow(() -> new IllegalStateException("seed patient missing")));
            a.setDoctor(doctors.findById((Long) row[1])
                    .orElseThrow(() -> new IllegalStateException("seed doctor missing")));
            a.setHospital(hospitals.findById((Long) row[2])
                    .orElseThrow(() -> new IllegalStateException("seed hospital missing")));
            a.setAppointmentTime((LocalDateTime) row[3]);
            a.setReason((String) row[4]);
            a.setStatus("COMPLETED");
            appointmentRepository.save(a);
        }
    }
}
