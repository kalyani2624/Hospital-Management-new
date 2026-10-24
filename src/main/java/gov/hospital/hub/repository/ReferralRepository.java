package gov.hospital.hub.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import gov.hospital.hub.entity.Referral;

public interface ReferralRepository extends JpaRepository<Referral, Long> {

    List<Referral> findByPatientId(Long patientId);

    List<Referral> findByToHospitalId(Long hospitalId);

    List<Referral> findByStatus(String status);
}
