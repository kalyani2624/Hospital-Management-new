package gov.hospital.hub.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import gov.hospital.hub.entity.Department;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    List<Department> findByHospitalId(Long hospitalId);
}
