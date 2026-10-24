package gov.hospital.hub.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import gov.hospital.hub.entity.Department;
import gov.hospital.hub.entity.Doctor;
import gov.hospital.hub.entity.Hospital;
import gov.hospital.hub.entity.Patient;
import gov.hospital.hub.exception.ResourceNotFoundException;
import gov.hospital.hub.repository.AppointmentRepository;
import gov.hospital.hub.repository.DepartmentRepository;
import gov.hospital.hub.repository.DoctorRepository;
import gov.hospital.hub.repository.HospitalRepository;
import gov.hospital.hub.repository.MedicalRecordRepository;

@Service
public class DoctorService {

    private final DoctorRepository doctors;
    private final HospitalRepository hospitals;
    private final DepartmentRepository departments;
    private final AppointmentRepository appointments;
    private final MedicalRecordRepository records;

    public DoctorService(DoctorRepository doctors, HospitalRepository hospitals,
            DepartmentRepository departments, AppointmentRepository appointments,
            MedicalRecordRepository records) {
        this.doctors = doctors;
        this.hospitals = hospitals;
        this.departments = departments;
        this.appointments = appointments;
        this.records = records;
    }

    public List<Doctor> list(Long hospitalId, String specialization) {
        if (hospitalId != null && specialization != null) {
            return doctors.findByHospitalIdAndSpecialization(hospitalId, specialization);
        }
        if (hospitalId != null) {
            return doctors.findByHospitalId(hospitalId);
        }
        if (specialization != null) {
            return doctors.findBySpecialization(specialization);
        }
        return doctors.findAll();
    }

    /**
     * P0 pagination: bound bulk PHI dump, default size 20 (controller caps size).
     * WHY separate method: filtered queries need Page-returning repo methods;
     * no params -> findAll(pageable) keeps demo compat (?page=&size= optional).
     */
    public org.springframework.data.domain.Page<Doctor> list(Long hospitalId, String specialization,
            org.springframework.data.domain.Pageable pageable) {
        if (hospitalId != null && specialization != null) {
            return doctors.findByHospitalIdAndSpecialization(hospitalId, specialization, pageable);
        }
        if (hospitalId != null) {
            return doctors.findByHospitalId(hospitalId, pageable);
        }
        if (specialization != null) {
            return doctors.findBySpecialization(specialization, pageable);
        }
        return doctors.findAll(pageable);
    }

    public Doctor get(Long id) {
        return doctors.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("doctor " + id + " not found"));
    }

    /** Request body for POST /api/doctors. Keeps FK ids out of the entity JSON. */
    public record CreateDoctorRequest(String name, String specialization, Long hospitalId,
            Long departmentId) {
    }

    @Transactional
    public Doctor create(CreateDoctorRequest req) {
        Hospital hospital = hospitals.findById(req.hospitalId()).orElseThrow(
                () -> new ResourceNotFoundException("hospital " + req.hospitalId() + " not found"));
        Department department = null;
        if (req.departmentId() != null) {
            department = departments.findById(req.departmentId()).orElseThrow(
                    () -> new ResourceNotFoundException(
                            "department " + req.departmentId() + " not found"));
        }
        return doctors.save(new Doctor(req.name(), req.specialization(), hospital, department));
    }

    public List<Department> departmentsOf(Long hospitalId) {
        return departments.findByHospitalId(hospitalId);
    }

    /**
     * Patients assigned to a doctor = distinct union of (a) their appointment
     * patients and (b) patients they have authored records for. Used by the
     * Doctor module's "My Patients". Does NOT return patients whose history is
     * visible to everyone — only direct physician-patient relationships.
     */
    @Transactional(readOnly = true)
    public List<Patient> patientsOf(Long doctorId) {
        doctors.findById(doctorId).orElseThrow(
                () -> new ResourceNotFoundException("doctor " + doctorId + " not found"));
        Map<Long, Patient> byId = new LinkedHashMap<>();
        for (Patient p : appointments.findDistinctPatientsByDoctorId(doctorId)) {
            byId.putIfAbsent(p.getId(), p);
        }
        for (Patient p : records.findDistinctPatientsByDoctorId(doctorId)) {
            byId.putIfAbsent(p.getId(), p);
        }
        return List.copyOf(byId.values());
    }
}
