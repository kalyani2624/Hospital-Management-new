package gov.hospital.hub.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import gov.hospital.hub.entity.MedicalRecord;
import gov.hospital.hub.entity.Patient;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    List<MedicalRecord> findByPatientIdOrderByVisitDateDesc(Long patientId);

    /** P0 pagination (size capped at 20 in controller): bound per-patient dump. */
    org.springframework.data.domain.Page<MedicalRecord> findByPatientIdOrderByVisitDateDesc(
            Long patientId, org.springframework.data.domain.Pageable pageable);

    /** Notes authored by one doctor — the Doctor module's Consultation History. */
    List<MedicalRecord> findByDoctorIdOrderByVisitDateDesc(Long doctorId);

    /** Distinct patients a doctor has consulted (via medical records). */
    @Query("select distinct r.patient from MedicalRecord r where r.doctor.id = :doctorId")
    List<Patient> findDistinctPatientsByDoctorId(@Param("doctorId") Long doctorId);
}
