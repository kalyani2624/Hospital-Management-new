package gov.hospital.hub;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import gov.hospital.hub.entity.Doctor;
import gov.hospital.hub.entity.Hospital;
import gov.hospital.hub.repository.DoctorRepository;
import gov.hospital.hub.repository.HospitalRepository;
import gov.hospital.hub.service.BedService;
import gov.hospital.hub.service.BedService.BedRequest;
import gov.hospital.hub.service.CentralService;

/**
 * Covers centralized read-model: census, availability, per-hospital load.
 * Naming: methodName_stateUnderTest_expectedBehavior.
 */
@SpringBootTest
@Transactional
class CentralServiceTest {

    @Autowired
    private CentralService central;
    @Autowired
    private HospitalRepository hospitals;
    @Autowired
    private DoctorRepository doctors;
    @Autowired
    private BedService beds;

    @Test
    void census_afterSeed_containsSeededRows() {
        Hospital hospital = hospitals.save(new Hospital("Central Test Hospital", "Delhi",
                "CENTRAL", 200));
        doctors.save(new Doctor("Dr Central", "General", hospital, null));
        beds.upsert(new BedRequest(hospital.getId(), "GENERAL", 7));
        Map<String, Object> census = central.census();
        assertTrue(((Number) census.get("hospitals")).longValue() >= 1);
        assertTrue(((Number) census.get("doctors")).longValue() >= 1);
        assertTrue(((Number) census.get("totalBeds")).intValue() >= 7);
        assertNotNull(census.get("patients"));
        assertNotNull(census.get("appointments"));
    }

    @Test
    void hospitalLoad_existingHospital_returnsNameAndCounts() {
        Hospital hospital = hospitals.save(new Hospital("Load Test Hospital", "Chennai",
                "DISTRICT", 80));
        beds.upsert(new BedRequest(hospital.getId(), "GENERAL", 4));
        Map<String, Object> load = central.hospitalLoad(hospital.getId());
        assertEquals(hospital.getId(), ((Number) load.get("hospitalId")).longValue());
        assertEquals("Load Test Hospital", load.get("hospitalName"));
        assertEquals(4, ((Number) load.get("totalBeds")).intValue());
    }

    @Test
    void availability_afterSeed_includesHospitalWithWards() {
        Hospital hospital = hospitals.save(new Hospital("Avail Test Hospital", "Kolkata",
                "DISTRICT", 60));
        beds.upsert(new BedRequest(hospital.getId(), "GENERAL", 3));
        List<Map<String, Object>> rows = central.availability();
        assertTrue(rows.stream()
                .anyMatch(r -> hospital.getId().equals(((Number) r.get("hospitalId")).longValue())));
    }
}
