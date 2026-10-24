package gov.hospital.hub.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import gov.hospital.hub.entity.Doctor;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    List<Doctor> findByHospitalId(Long hospitalId);

    List<Doctor> findBySpecialization(String specialization);

    List<Doctor> findByHospitalIdAndSpecialization(Long hospitalId, String specialization);

    /** P0 pagination (size capped at 20 in controllers): bound bulk PHI dump. */
    Page<Doctor> findByHospitalId(Long hospitalId, Pageable pageable);

    Page<Doctor> findBySpecialization(String specialization, Pageable pageable);

    Page<Doctor> findByHospitalIdAndSpecialization(Long hospitalId, String specialization,
            Pageable pageable);
}
