package gov.hospital.hub.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import gov.hospital.hub.entity.Hospital;

public interface HospitalRepository extends JpaRepository<Hospital, Long> {
}
