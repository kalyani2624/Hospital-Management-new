package gov.hospital.hub.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import gov.hospital.hub.entity.BedInventory;
import gov.hospital.hub.entity.Hospital;
import gov.hospital.hub.exception.BedUnavailableException;
import gov.hospital.hub.exception.ResourceNotFoundException;
import gov.hospital.hub.repository.BedInventoryRepository;
import gov.hospital.hub.repository.HospitalRepository;

@Service
public class BedService {

    private final BedInventoryRepository beds;
    private final HospitalRepository hospitals;

    public BedService(BedInventoryRepository beds, HospitalRepository hospitals) {
        this.beds = beds;
        this.hospitals = hospitals;
    }

    public List<BedInventory> byHospital(Long hospitalId) {
        return beds.findByHospitalId(hospitalId);
    }

    public List<BedInventory> all() {
        return beds.findAll();
    }

    /** Paged list (P0: bound bulk dump, default size 20). */
    public org.springframework.data.domain.Page<BedInventory> all(
            org.springframework.data.domain.Pageable pageable) {
        return beds.findAll(pageable);
    }

    public record BedRequest(Long hospitalId, String wardType, int total) {
    }

    @Transactional
    public BedInventory upsert(BedRequest req) {
        Hospital hospital = hospitals.findById(req.hospitalId()).orElseThrow(
                () -> new ResourceNotFoundException(
                        "hospital " + req.hospitalId() + " not found"));
        String ward = req.wardType() == null ? "GENERAL" : req.wardType().toUpperCase();
        BedInventory inventory = beds.findByHospitalIdAndWardType(req.hospitalId(), ward)
                .orElseGet(() -> new BedInventory(hospital, ward, 0, 0));
        if (req.total() > 0) {
            inventory.setTotal(req.total());
        }
        return beds.save(inventory);
    }

    /** Admit = occupied + 1, fails with 409 when ward is full. */
    @Transactional
    public synchronized BedInventory admit(Long hospitalId, String wardType) {
        // P0: null-guard (was NPE on toUpperCase with required=false/missing param).
        if (hospitalId == null || wardType == null || wardType.isBlank()) {
            throw new IllegalArgumentException("hospitalId and wardType are required");
        }
        BedInventory inventory = beds
                .findByHospitalIdAndWardType(hospitalId, wardType.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "no bed row for hospital " + hospitalId + " ward " + wardType));
        if (inventory.getAvailable() <= 0) {
            throw new BedUnavailableException("no beds available in " + wardType
                    + " at hospital " + hospitalId);
        }
        inventory.setOccupied(inventory.getOccupied() + 1);
        // P0 TOCTOU: @Version on BedInventory makes a concurrent admit on the
        // last bed throw OptimisticLockException -> 409 (see handler); the
        // synchronized keyword additionally serializes single-instance races.
        return beds.saveAndFlush(inventory);
    }

    /** Discharge = occupied - 1, floors at zero. */
    @Transactional
    public synchronized BedInventory discharge(Long hospitalId, String wardType) {
        if (hospitalId == null || wardType == null || wardType.isBlank()) {
            throw new IllegalArgumentException("hospitalId and wardType are required");
        }
        BedInventory inventory = beds
                .findByHospitalIdAndWardType(hospitalId, wardType.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "no bed row for hospital " + hospitalId + " ward " + wardType));
        inventory.setOccupied(Math.max(0, inventory.getOccupied() - 1));
        return beds.save(inventory);
    }
}
