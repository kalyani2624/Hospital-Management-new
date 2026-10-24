package gov.hospital.hub;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import gov.hospital.hub.entity.BedInventory;
import gov.hospital.hub.entity.Hospital;
import gov.hospital.hub.exception.BedUnavailableException;
import gov.hospital.hub.repository.HospitalRepository;
import gov.hospital.hub.service.BedService;
import gov.hospital.hub.service.BedService.BedRequest;

/**
 * Covers bed upsert, admit-full 409 edge, and discharge floor at zero.
 * Naming: methodName_stateUnderTest_expectedBehavior.
 */
@SpringBootTest
@Transactional
class BedServiceTest {

    @Autowired
    private BedService beds;
    @Autowired
    private HospitalRepository hospitals;

    private Hospital seedHospital() {
        return hospitals.save(new Hospital("Bed Test Hospital", "Mumbai", "DISTRICT", 100));
    }

    @Test
    void upsert_newWard_createsRow() {
        Hospital hospital = seedHospital();
        BedInventory row = beds.upsert(new BedRequest(hospital.getId(), "GENERAL", 10));
        assertEquals(10, row.getTotal());
        assertEquals(0, row.getOccupied());
    }

    @Test
    void admit_fullWard_throwsBedUnavailableException() {
        Hospital hospital = seedHospital();
        beds.upsert(new BedRequest(hospital.getId(), "ICU", 1));
        beds.admit(hospital.getId(), "ICU");
        assertThrows(BedUnavailableException.class,
                () -> beds.admit(hospital.getId(), "ICU"));
    }

    @Test
    void discharge_emptyWard_floorsAtZero() {
        Hospital hospital = seedHospital();
        beds.upsert(new BedRequest(hospital.getId(), "GENERAL", 5));
        BedInventory after = beds.discharge(hospital.getId(), "GENERAL");
        assertEquals(0, after.getOccupied());
        BedInventory twice = beds.discharge(hospital.getId(), "GENERAL");
        assertEquals(0, twice.getOccupied());
    }

    @Test
    void admit_thenDischarge_occupancyMovesOneToZero() {
        Hospital hospital = seedHospital();
        beds.upsert(new BedRequest(hospital.getId(), "GENERAL", 5));
        assertEquals(1, beds.admit(hospital.getId(), "GENERAL").getOccupied());
        assertEquals(0, beds.discharge(hospital.getId(), "GENERAL").getOccupied());
    }
}
