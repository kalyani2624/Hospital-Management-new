package gov.hospital.hub.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import gov.hospital.hub.entity.BedInventory;

public interface BedInventoryRepository extends JpaRepository<BedInventory, Long> {

    List<BedInventory> findByHospitalId(Long hospitalId);

    Optional<BedInventory> findByHospitalIdAndWardType(Long hospitalId, String wardType);
}
