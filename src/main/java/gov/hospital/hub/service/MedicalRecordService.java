package gov.hospital.hub.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import gov.hospital.hub.entity.Doctor;
import gov.hospital.hub.entity.Hospital;
import gov.hospital.hub.entity.MedicalRecord;
import gov.hospital.hub.entity.Patient;
import gov.hospital.hub.exception.ResourceNotFoundException;
import gov.hospital.hub.repository.DoctorRepository;
import gov.hospital.hub.repository.HospitalRepository;
import gov.hospital.hub.repository.MedicalRecordRepository;
import gov.hospital.hub.repository.PatientRepository;

@Service
public class MedicalRecordService {

    private final MedicalRecordRepository records;
    private final PatientRepository patients;
    private final HospitalRepository hospitals;
    private final DoctorRepository doctors;

    public MedicalRecordService(MedicalRecordRepository records, PatientRepository patients,
            HospitalRepository hospitals, DoctorRepository doctors) {
        this.records = records;
        this.patients = patients;
        this.hospitals = hospitals;
        this.doctors = doctors;
    }

    public List<MedicalRecord> byPatient(Long patientId) {
        return records.findByPatientIdOrderByVisitDateDesc(patientId);
    }

    /** Consultation History — all notes authored by one doctor. */
    public List<MedicalRecord> byDoctor(Long doctorId) {
        doctors.findById(doctorId).orElseThrow(
                () -> new ResourceNotFoundException("doctor " + doctorId + " not found"));
        return records.findByDoctorIdOrderByVisitDateDesc(doctorId);
    }

    /** P0 pagination: bound per-patient dump, default size 20 (controller caps size). */
    public org.springframework.data.domain.Page<MedicalRecord> byPatient(Long patientId,
            org.springframework.data.domain.Pageable pageable) {
        return records.findByPatientIdOrderByVisitDateDesc(patientId, pageable);
    }

    public record CreateRecordRequest(Long patientId, Long hospitalId, Long doctorId,
            String diagnosis, String treatmentNotes, String prescription) {
    }

    @Transactional
    public MedicalRecord create(CreateRecordRequest req) {
        Patient patient = patients.findById(req.patientId()).orElseThrow(
                () -> new ResourceNotFoundException("patient " + req.patientId() + " not found"));
        Hospital hospital = hospitals.findById(req.hospitalId()).orElseThrow(
                () -> new ResourceNotFoundException(
                        "hospital " + req.hospitalId() + " not found"));
        Doctor doctor = null;
        if (req.doctorId() != null) {
            doctor = doctors.findById(req.doctorId()).orElseThrow(
                    () -> new ResourceNotFoundException(
                            "doctor " + req.doctorId() + " not found"));
        }
        MedicalRecord record = new MedicalRecord();
        record.setPatient(patient);
        record.setHospital(hospital);
        record.setDoctor(doctor);
        record.setDiagnosis(req.diagnosis());
        record.setTreatmentNotes(req.treatmentNotes());
        record.setPrescription(req.prescription());
        record.setVisitDate(LocalDateTime.now());
        return records.save(record);
    }
}
