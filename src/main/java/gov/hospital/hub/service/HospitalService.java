package gov.hospital.hub.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import gov.hospital.hub.entity.Hospital;
import gov.hospital.hub.exception.ResourceNotFoundException;
import gov.hospital.hub.repository.HospitalRepository;

/**
 * Constructor DI (preferred): dependencies are final and required.
 */
@Service
public class HospitalService {

    private final HospitalRepository hospitals;

    public HospitalService(HospitalRepository hospitals) {
        this.hospitals = hospitals;
    }

    public List<Hospital> list() {
        return hospitals.findAll();
    }

    /** P0 pagination: bound bulk dump, default size 20 (controller caps size). */
    public org.springframework.data.domain.Page<Hospital> list(
            org.springframework.data.domain.Pageable pageable) {
        return hospitals.findAll(pageable);
    }

    public Hospital get(Long id) {
        return hospitals.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("hospital " + id + " not found"));
    }

    @Transactional
    public Hospital create(Hospital hospital) {
        return hospitals.save(hospital);
    }

    @Transactional
    public Hospital update(Long id, Hospital patch) {
        Hospital existing = get(id);
        existing.setName(patch.getName());
        existing.setCity(patch.getCity());
        existing.setType(patch.getType());
        existing.setTotalBeds(patch.getTotalBeds());
        return hospitals.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        hospitals.delete(get(id));
    }
}
