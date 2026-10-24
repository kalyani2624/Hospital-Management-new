package gov.hospital.hub;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import gov.hospital.hub.entity.Hospital;
import gov.hospital.hub.entity.Patient;
import gov.hospital.hub.repository.HospitalRepository;
import gov.hospital.hub.service.PatientService;
import gov.hospital.hub.service.PatientService.CreatePatientRequest;

/**
 * Covers duplicate centralId (409 at REST) and central history join.
 * Naming: methodName_stateUnderTest_expectedBehavior.
 */
@SpringBootTest
@Transactional
class PatientServiceTest {

    @Autowired
    private PatientService patients;
    @Autowired
    private HospitalRepository hospitals;

    private Hospital seedHospital() {
        return hospitals.save(new Hospital("Patient Test Hospital", "Delhi", "DISTRICT", 50));
    }

    @Test
    void create_duplicateCentralId_throwsIllegalStateException() {
        Hospital hospital = seedHospital();
        String centralId = "CENT-DUP-" + System.nanoTime();
        patients.create(new CreatePatientRequest(centralId, "Asha", 30, "F", "9999999999",
                hospital.getId(), null, null, null));
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> patients.create(new CreatePatientRequest(centralId, "Asha2", 31, "F",
                        "8888888888", hospital.getId(), null, null, null)));
        assertTrue(ex.getMessage().contains(centralId));
    }

    @Test
    void history_existingPatient_returnsPatientPlusEmptyLists() {
        Hospital hospital = seedHospital();
        Patient saved = patients.create(new CreatePatientRequest(
                "CENT-HIST-" + System.nanoTime(), "Ravi", 40, "M", "7777777777",
                hospital.getId(), null, null, null));
        Map<String, Object> history = patients.history(saved.getId());
        assertEquals(saved.getId(), ((Patient) history.get("patient")).getId());
        assertTrue(history.containsKey("appointments"));
        assertTrue(history.containsKey("medicalRecords"));
        assertTrue(history.containsKey("referrals"));
    }

    @Test
    void getByCentralId_unknownId_throwsNotFound() {
        assertThrows(gov.hospital.hub.exception.ResourceNotFoundException.class,
                () -> patients.getByCentralId("CENT-NOPE-" + System.nanoTime()));
    }
}
