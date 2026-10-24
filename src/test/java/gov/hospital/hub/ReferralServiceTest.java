package gov.hospital.hub;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import gov.hospital.hub.entity.Hospital;
import gov.hospital.hub.entity.Patient;
import gov.hospital.hub.entity.Referral;
import gov.hospital.hub.repository.HospitalRepository;
import gov.hospital.hub.repository.PatientRepository;
import gov.hospital.hub.service.ReferralService;
import gov.hospital.hub.service.ReferralService.CreateReferralRequest;

/**
 * Guards inter-hospital invariant: from != to.
 * WHY: frontend Referrals.jsx blocks self-transfer for UX, but direct POSTs
 * bypass it — backend must fail fast 400 (IllegalArgumentException via
 * GlobalExceptionHandler.handleBadRequest), not 201.
 * Naming: methodName_stateUnderTest_expectedBehavior.
 */
@SpringBootTest
@Transactional
class ReferralServiceTest {

    @Autowired
    private ReferralService referrals;

    @Autowired
    private HospitalRepository hospitals;

    @Autowired
    private PatientRepository patients;

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @BeforeEach
    void setupMockMvc() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    private Patient seedPatient(Hospital hospital) {
        return patients.save(new Patient("CENT-REF-" + System.nanoTime(), "Ref Patient",
                40, "M", "9999999999", hospital));
    }

    @Test
    void refer_sameHospital_throwsIllegalArgumentException() {
        Hospital hospital = hospitals.save(
                new Hospital("Referral Guard Hospital", "Delhi", "CENTRAL", 50));
        Patient patient = seedPatient(hospital);
        CreateReferralRequest same = new CreateReferralRequest(patient.getId(),
                hospital.getId(), hospital.getId(), "self review");
        assertThrows(IllegalArgumentException.class, () -> referrals.refer(same));
    }

    @Test
    void refer_distinctHospitals_createsPending() {
        Hospital from = hospitals.save(
                new Hospital("Referral From Hospital", "Delhi", "CENTRAL", 50));
        Hospital to = hospitals.save(
                new Hospital("Referral To Hospital", "Mumbai", "DISTRICT", 50));
        Patient patient = seedPatient(from);
        Referral saved = referrals.refer(new CreateReferralRequest(patient.getId(),
                from.getId(), to.getId(), "cardiology review"));
        assertEquals("PENDING", saved.getStatus());
    }

    @Test
    void referRest_sameHospital_returns400Not201() throws Exception {
        Hospital hospital = hospitals.save(
                new Hospital("Referral REST Hospital", "Delhi", "CENTRAL", 50));
        Patient patient = seedPatient(hospital);
        String body = "{\"patientId\":" + patient.getId()
                + ",\"fromHospitalId\":" + hospital.getId()
                + ",\"toHospitalId\":" + hospital.getId()
                + ",\"reason\":\"self review\"}";
        mockMvc.perform(post("/api/referrals").contentType(MediaType.APPLICATION_JSON)
                .content(body)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void referRest_distinctHospitals_returns201() throws Exception {
        Hospital from = hospitals.save(
                new Hospital("Referral REST From", "Delhi", "CENTRAL", 50));
        Hospital to = hospitals.save(
                new Hospital("Referral REST To", "Mumbai", "DISTRICT", 50));
        Patient patient = seedPatient(from);
        String body = "{\"patientId\":" + patient.getId()
                + ",\"fromHospitalId\":" + from.getId()
                + ",\"toHospitalId\":" + to.getId()
                + ",\"reason\":\"cardiology review\"}";
        mockMvc.perform(post("/api/referrals").contentType(MediaType.APPLICATION_JSON)
                .content(body)).andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"));
    }
}
