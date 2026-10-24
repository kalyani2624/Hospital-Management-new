package gov.hospital.hub.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import gov.hospital.hub.entity.Hospital;
import gov.hospital.hub.entity.Patient;
import gov.hospital.hub.exception.ResourceNotFoundException;
import gov.hospital.hub.repository.AppointmentRepository;
import gov.hospital.hub.repository.HospitalRepository;
import gov.hospital.hub.repository.MedicalRecordRepository;
import gov.hospital.hub.repository.PatientRepository;
import gov.hospital.hub.repository.ReferralRepository;

@Service
public class PatientService {

    private final PatientRepository patients;
    private final HospitalRepository hospitals;
    private final AppointmentRepository appointments;
    private final MedicalRecordRepository records;
    private final ReferralRepository referrals;

    public PatientService(PatientRepository patients, HospitalRepository hospitals,
            AppointmentRepository appointments, MedicalRecordRepository records,
            ReferralRepository referrals) {
        this.patients = patients;
        this.hospitals = hospitals;
        this.appointments = appointments;
        this.records = records;
        this.referrals = referrals;
    }

    public List<Patient> list() {
        return patients.findAll();
    }

    /** Paged list (P0: bound bulk PHI dump, default size 20). */
    public org.springframework.data.domain.Page<Patient> list(
            org.springframework.data.domain.Pageable pageable) {
        return patients.findAll(pageable);
    }

    public Patient get(Long id) {
        return patients.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("patient " + id + " not found"));
    }

    public Patient getByCentralId(String id) {
        return patients.findByCentralId(id)
                .or(() -> patients.findByCentralIdIgnoreCase(id))
                .or(() -> patients.findByPhone(id))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "patient centralId " + id + " not found"));
    }

    public record CreatePatientRequest(String centralId, String name, int age, String gender,
            String phone, Long hospitalId, java.time.LocalDate dob, String address, String email) {
    }

    /** Generates the next free central ID (PAT-xxxxx) for self-registered patients. */
    private String nextCentralId() {
        long n = patients.count() + 1;
        while (true) {
            String candidate = String.format("PAT-%05d", n);
            if (patients.findByCentralId(candidate).isEmpty()) {
                return candidate;
            }
            n++;
        }
    }

    @Transactional
    public Patient create(CreatePatientRequest req) {
        if (req.centralId() != null && !req.centralId().isBlank()
                && patients.findByCentralId(req.centralId()).isPresent()) {
            throw new IllegalStateException("centralId " + req.centralId() + " already exists");
        }
        if ((req.centralId() == null || req.centralId().isBlank())
                && req.phone() != null && !req.phone().isBlank()) {
            // SELF-REGISTRATION guard: a mobile already on the hub belongs to an account.
            // (Desk/wizard creates passing their own centralId keep existing behaviour.)
            patients.findByPhone(req.phone()).ifPresent(p -> {
                throw new IllegalStateException(
                        "mobile " + req.phone() + " is already registered — sign in instead");
            });
        }
        Hospital hospital = null;
        if (req.hospitalId() != null) {
            hospital = hospitals.findById(req.hospitalId()).orElseThrow(
                    () -> new ResourceNotFoundException(
                            "hospital " + req.hospitalId() + " not found"));
        }
        String centralId = (req.centralId() == null || req.centralId().isBlank())
                ? nextCentralId()
                : req.centralId();
        Patient patient = new Patient(centralId, req.name(), req.age(), req.gender(),
                req.phone(), hospital);
        patient.setDob(req.dob());
        patient.setAddress(req.address());
        patient.setEmail(req.email());
        return patients.save(patient);
    }

    public record UpdatePatientRequest(String name, String gender, String phone, Integer age,
            java.time.LocalDate dob, String address, String email) {
    }

    /** Updates permitted demographic fields only — centralId is immutable. */
    @Transactional
    public Patient update(Long id, UpdatePatientRequest req) {
        Patient patient = get(id);
        if (isNotBlank(req.name())) {
            patient.setName(req.name());
        }
        if (req.age() != null) {
            patient.setAge(req.age());
        }
        if (req.gender() != null && !req.gender().isBlank()) {
            patient.setGender(req.gender());
        }
        if (req.phone() != null && !req.phone().isBlank()) {
            patients.findByPhone(req.phone()).filter(p -> !p.getId().equals(id)).ifPresent(p -> {
                throw new IllegalStateException(
                        "mobile " + req.phone() + " already belongs to another patient");
            });
            patient.setPhone(req.phone());
        }
        if (req.dob() != null) {
            patient.setDob(req.dob());
        }
        if (isNotBlank(req.address())) {
            patient.setAddress(req.address());
        }
        if (req.email() != null) {
            patient.setEmail(req.email());
        }
        return patients.save(patient);
    }

    private boolean isNotBlank(String s) {
        return s != null && !s.isBlank();
    }

    /** Appointments for one patient, newest first (patient portal "My Appointments"). */
    @Transactional(readOnly = true)
    public List<gov.hospital.hub.entity.Appointment> appointments(Long patientId) {
        get(patientId);
        return appointments.findByPatientId(patientId).stream()
                .sorted(java.util.Comparator
                        .comparing(gov.hospital.hub.entity.Appointment::getAppointmentTime)
                        .reversed())
                .toList();
    }

    /**
     * Central history: one call returns visits across ALL hospitals for a centralId.
     * WHY: proves no fragmented data - everything is joined by patient id.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> history(Long patientId) {
        Patient patient = get(patientId);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("patient", patient);
        out.put("appointments", appointments.findByPatientId(patientId));
        out.put("medicalRecords", records.findByPatientIdOrderByVisitDateDesc(patientId));
        out.put("referrals", referrals.findByPatientId(patientId));
        return out;
    }
}
